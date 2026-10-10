import 'dotenv/config';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { getLocalUploadRoot, getStorageConfig, resolveLocalStoragePath } from '../lib/storage';
import { uploadSupabaseStreamObject } from '../lib/supabase-storage';

function mimeFor(asset: any) {
  if (asset.mimeType) return String(asset.mimeType);
  const ext = path.extname(String(asset.originalName || asset.name || '')).toLowerCase();
  const types: Record<string,string> = { '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf','.zip':'application/zip','.txt':'text/plain' };
  return types[ext] || 'application/octet-stream';
}


function replaceTextUrls(value: string, replacements: Map<string, string>) {
  if (replacements.has(value)) return replacements.get(value)!;
  let result = value;
  // Longer aliases must be applied first, so an encoded/path-specific match wins
  // over a shorter alias in the same string.
  const entries = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    if (from && result.includes(from)) result = result.split(from).join(to);
  }
  return result;
}

function encodedKey(key: string) {
  return key.split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/');
}

/**
 * Reconstruct common old local URL forms for assets that were uploaded by a
 * previous interrupted run. The first run had already updated media_assets.url
 * before reference rewriting failed, so the original URL may no longer be in
 * the database. Reconstructing aliases makes this migration safely resumable.
 */
function addLegacyStorageAliases(replacements: Map<string, string>, storageKey: string, destinationUrl: string) {
  const cleanKey = String(storageKey || '').replace(/^\/+/, '');
  if (!cleanKey || !destinationUrl) return;
  const encoded = encodedKey(cleanKey);
  const aliases = new Set([
    `/uploads/${encoded}`,
    `/uploads/${cleanKey}`,
    `/${encoded}`,
    `/${cleanKey}`,
    `public/${encoded}`,
    `public/${cleanKey}`,
  ]);
  for (const alias of aliases) {
    if (!alias || alias === destinationUrl || /^\/api\/public\/assets\//i.test(alias)) continue;
    replacements.set(alias, destinationUrl);
  }
}

function replaceUrlValues(value: unknown, replacements: Map<string, string>): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const next = replaceTextUrls(value, replacements);
    return { value: next, changed: next !== value };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((entry) => {
      const rewritten = replaceUrlValues(entry, replacements);
      changed = changed || rewritten.changed;
      return rewritten.value;
    });
    return { value: next, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const rewritten = replaceUrlValues(entry, replacements);
      next[key] = rewritten.value;
      changed = changed || rewritten.changed;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
}

async function rewriteDatabaseReferences(replacements: Map<string, string>) {
  if (!replacements.size) return 0;
  const plans: Array<{ model: string; fields: string[]; jsonFields?: string[] }> = [
    { model: 'siteSetting', fields: ['logo', 'favicon', 'downloadUrl'], jsonFields: ['socialLinks'] },
    { model: 'mediaAsset', fields: ['thumbnail'] },
    { model: 'user', fields: ['avatar'] },
    { model: 'product', fields: ['icon', 'coverImage', 'videoUrl', 'content'] },
    { model: 'skill', fields: ['icon', 'coverImage', 'content'], jsonFields: ['tags'] },
    { model: 'skillVersion', fields: ['fileUrl', 'releaseNotes'] },
    { model: 'prompt', fields: ['content', 'usage'], jsonFields: ['tags'] },
    { model: 'resource', fields: ['coverImage', 'fileUrl', 'videoUrl', 'content'] },
    { model: 'tutorial', fields: ['coverImage', 'videoUrl', 'content'] },
    { model: 'downloadVersion', fields: ['url', 'releaseNotes'] },
    { model: 'solution', fields: ['coverImage', 'icon', 'content'] },
    { model: 'caseStudy', fields: ['coverImage', 'logo', 'content'], jsonFields: ['results', 'tags'] },
    { model: 'article', fields: ['coverImage', 'content'], jsonFields: ['tags'] },
    { model: 'page', fields: ['coverImage', 'content'] },
    { model: 'pageSection', fields: ['imageUrl', 'videoUrl', 'content'], jsonFields: ['data'] },
    { model: 'homeConfig', fields: ['value'] },
  ];
  let changedRows = 0;
  for (const plan of plans) {
    const delegate = (prisma as any)[plan.model];
    if (!delegate?.findMany || !delegate?.update) continue;
    // Prisma 7 exposes the generated runtime model metadata. Filter the field
    // plan against the real model before building `select`, avoiding a whole-run
    // failure if an older model-specific field (e.g. Prompt.fileUrl) never existed.
    const runtimeModelName = plan.model.charAt(0).toUpperCase() + plan.model.slice(1);
    const modelMeta = (prisma as any)._runtimeDataModel?.models?.[runtimeModelName];
    const knownFields = Array.isArray(modelMeta?.fields)
      ? new Set<string>(modelMeta.fields.map((field: { name: string }) => field.name))
      : null;
    const requestedFields = [...plan.fields, ...(plan.jsonFields || [])];
    const fields = knownFields
      ? requestedFields.filter((field) => knownFields.has(field))
      : requestedFields.filter((field) => !(plan.model === 'prompt' && field === 'fileUrl') && !(plan.model === 'tutorial' && field === 'fileUrl'));
    const invalidFields = requestedFields.filter((field) => !fields.includes(field));
    if (invalidFields.length) console.warn(`[ASSETS] Skip non-existent field(s) for ${plan.model}: ${invalidFields.join(', ')}`);
    const scalarFields = fields.filter((field) => field !== 'id');
    const scalarPlanFields = plan.fields.filter((field) => scalarFields.includes(field));
    const jsonPlanFields = (plan.jsonFields || []).filter((field) => scalarFields.includes(field));
    const select: Record<string, boolean> = { id: true };
    for (const field of scalarFields) select[field] = true;
    const rows = await delegate.findMany({ select });
    for (const row of rows) {
      const data: Record<string, unknown> = {};
      for (const field of scalarPlanFields) {
        const current = row[field];
        if (typeof current !== 'string' || !current) continue;
        const next = replaceTextUrls(current, replacements);
        if (next !== current) data[field] = next;
      }
      for (const field of jsonPlanFields) {
        const current = row[field];
        if (current == null) continue;
        const rewritten = replaceUrlValues(current, replacements);
        if (rewritten.changed) data[field] = rewritten.value;
      }
      if (Object.keys(data).length) {
        await delegate.update({ where: { id: row.id }, data });
        changedRows += 1;
      }
    }
  }
  return changedRows;
}

async function main() {
  const config = await getStorageConfig();
  if (config?.provider !== 'SUPABASE') throw new Error('请先运行 npm.cmd run storage:setup:supabase，并确认数据库存储 provider 为 SUPABASE。');
  console.log('[ASSETS] Local upload root:', getLocalUploadRoot());
  const assets = await prisma.mediaAsset.findMany({ where: { storageProvider: 'LOCAL', storageKey: { not: null }, isPublic: true }, orderBy: { id: 'asc' } });
  let migrated = 0, missing = 0, failed = 0;
  const urlReplacements = new Map<string, string>();
  for (const asset of assets) {
    const key = String(asset.storageKey || '').replace(/^\/+/, '');
    if (!key) continue;
    try {
      const filePath = resolveLocalStoragePath(config, key);
      const info = await stat(filePath);
      const uploaded = await uploadSupabaseStreamObject(key, createReadStream(filePath), info.size, mimeFor(asset), { bucket: config.bucket, upsert: true });
      for (const oldUrl of [asset.url, asset.thumbnail, `/uploads/${key}`]) {
        const original = String(oldUrl || '').trim();
        if (original && !/^\/api\/public\/assets\//i.test(original) && original !== uploaded.url) urlReplacements.set(original, uploaded.url);
      }
      await prisma.mediaAsset.update({ where: { id: asset.id }, data: { storageProvider: 'SUPABASE', url: uploaded.url, thumbnail: asset.thumbnail ? uploaded.url : null, metadata: { ...(asset.metadata && typeof asset.metadata === 'object' ? asset.metadata as Record<string, unknown> : {}), migratedToSupabaseAt: new Date().toISOString() } as any } });
      migrated += 1;
      if (migrated % 20 === 0) console.log(`[ASSETS] Migrated ${migrated}/${assets.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/ENOENT|no such file/i.test(message)) { missing += 1; console.warn(`[ASSETS] Missing local file for asset ${asset.id}: ${key}`); }
      else { failed += 1; console.error(`[ASSETS] Failed asset ${asset.id} (${key}): ${message}`); }
    }
  }
  // Recover URL replacements on reruns. Earlier attempts may have uploaded files
  // and updated media_assets, then stopped during reference rewriting. Those assets
  // no longer match the LOCAL query above, so derive aliases from their storageKey.
  const alreadyMigratedAssets = await prisma.mediaAsset.findMany({
    where: { storageProvider: 'SUPABASE', storageKey: { not: null }, isPublic: true },
    select: { storageKey: true, url: true },
  });
  for (const asset of alreadyMigratedAssets) {
    const key = String(asset.storageKey || '').replace(/^\/+/, '');
    const url = String(asset.url || '').trim();
    if (key && url) addLegacyStorageAliases(urlReplacements, key, url);
  }

  const referencesRewritten = await rewriteDatabaseReferences(urlReplacements);
  const privateLocal = await prisma.mediaAsset.count({ where: { storageProvider: 'LOCAL', storageKey: { not: null }, isPublic: false } });
  console.log(JSON.stringify({
    totalPublicLocalAssetsBeforeThisRun: assets.length,
    alreadyMigratedPublicAssets: alreadyMigratedAssets.length,
    migratedThisRun: migrated,
    missingLocalFiles: missing,
    failedUploads: failed,
    databaseRowsWithRewrittenReferences: referencesRewritten,
    privateAssetsNotMoved: privateLocal,
  }, null, 2));
  if (failed) throw new Error(`${failed} 项资源迁移失败，请修复后重新运行（重复运行会以 upsert 覆盖同 Key 文件）。`);
  if (privateLocal) console.warn('注意：未迁移私有资源，避免放入公开 bucket；请为私有文件单独建立 private bucket 与签名读取流程。');
}

main().catch((error) => { console.error('[ASSETS] Migration failed:', error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
