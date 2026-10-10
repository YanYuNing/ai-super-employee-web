import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';
import {
  getLocalUploadRoot,
  getStorageConfig,
  ensureFileStorageSchema,
  localPublicUrl,
  resolveLocalStoragePath,
  resolveStorageFolder,
  sanitizeRelativeFolder,
  storageKeyFor,
  validateUploadPolicy,
} from '@/lib/storage';
import { detectFileType } from '@/lib/file-types';
import { uploadSupabaseObject } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serialize(value: any): any {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
}

function safeFileName(name: string) {
  const ext = path.extname(name);
  const base = path.basename(name, ext).normalize('NFKC').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || '文件';
  return `${Date.now()}-${crypto.randomBytes(5).toString('hex')}-${base}${ext}`;
}

export async function POST(req: Request) {
  try {
    await requirePermission('file.upload');
    await ensureFileStorageSchema();
    const form = await req.formData();
    const raw = form.getAll('files');
    const single = form.get('file');
    if (single instanceof File) raw.push(single);
    const files = raw.filter((x): x is File => x instanceof File);
    if (!files.length) return NextResponse.json({ success: false, message: '请选择要上传的文件。' }, { status: 400 });

    const config = await getStorageConfig();
    if (!config) return NextResponse.json({ success: false, message: '尚未配置文件存储。请先到“文件存储”完成配置。' }, { status: 400 });
    if (config.provider === 'OSS') return NextResponse.json({ success: false, message: '当前已启用 OSS，请使用云端直传方式。' }, { status: 400 });

    const folderInput = String(form.get('folder') || 'uploads');
    const folder = sanitizeRelativeFolder(resolveStorageFolder(config, folderInput));
    const assets: any[] = [];

    for (const file of files) {
      if (!file.name || file.size <= 0) throw new Error(`文件“${file.name || '未命名文件'}”为空。`);
      const assetType = detectFileType(file.name, file.type);
      validateUploadPolicy(config, { name: file.name, size: file.size, mimeType: file.type, assetType });

      const filename = safeFileName(file.name);
      const storageKey = `${folder}/${filename}`;
      let url: string;
      const fileBytes = Buffer.from(await file.arrayBuffer());
      if (config.provider === 'SUPABASE') {
        const uploaded = await uploadSupabaseObject(storageKey, fileBytes, file.type || 'application/octet-stream', { bucket: config.bucket, upsert: false });
        url = uploaded.url;
      } else {
        const target = resolveLocalStoragePath(config, storageKey);
        const root = path.resolve(getLocalUploadRoot());
        const resolvedTarget = path.resolve(target);
        if (!(resolvedTarget === root || resolvedTarget.startsWith(`${root}${path.sep}`))) {
          throw new Error('上传目录路径无效，请检查本地存储目录配置。');
        }
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, fileBytes);
        url = localPublicUrl(storageKey);
      }

      const extension = path.extname(file.name).replace('.', '').toLowerCase() || null;
      const asset = await prisma.mediaAsset.create({
        data: {
          name: file.name,
          originalName: file.name,
          extension,
          type: assetType,
          url,
          mimeType: file.type || 'application/octet-stream',
          fileSize: BigInt(file.size),
          folder,
          storageProvider: config.provider,
          storageKey,
          isPublic: true,
          metadata: { uploadedAt: new Date().toISOString(), provider: config.provider },
        } as any,
      });
      const serialized = serialize(asset) as any;
      serialized.url = `/api/public/assets/${asset.id}`;
      assets.push(serialized);
    }

    return NextResponse.json({
      success: true,
      message: `成功上传 ${assets.length} 个文件。`,
      assets,
      asset: assets[0],
      assetId: assets[0]?.id,
      url: assets[0]?.url,
      key: assets[0]?.storageKey,
      storageProvider: config.provider,
      assetType: assets[0]?.type,
    });
  } catch (e) {
    console.error('[upload]', e);
    return NextResponse.json({ success: false, message: e instanceof Error ? `上传失败：${e.message}` : '上传失败，请稍后重试。' }, { status: 500 });
  }
}
