import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { getStorageConfig } from '../lib/storage';

const baseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'site-assets').trim();
if (!baseUrl || !serviceKey || !bucket) throw new Error('需要配置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、SUPABASE_STORAGE_BUCKET。');
if (!/^https:\/\//i.test(baseUrl)) throw new Error('SUPABASE_URL 必须为 HTTPS 地址。');
if (!/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(bucket)) throw new Error('Bucket 名称不合法，请使用 2–63 位字母、数字、点、下划线或连字符。');
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
const maxFileSizeMb = Math.max(1, Math.min(500 * 1024, Number(process.env.SUPABASE_STORAGE_MAX_FILE_SIZE_MB || 50)));
const bucketOptions = { public: true, file_size_limit: maxFileSizeMb * 1024 * 1024 };

async function main() {
  const endpoint = `${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`;
  const current = await fetch(endpoint, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
  const currentText = await current.text().catch(() => '');
  let currentBody: Record<string, unknown> = {};
  try { currentBody = currentText ? JSON.parse(currentText) as Record<string, unknown> : {}; } catch { /* preserve raw body for diagnostics */ }
  // Supabase Storage sometimes wraps the internal 404 as HTTP 400 with code NoSuchBucket.
  // Treat both representations as a missing bucket so this script can create it idempotently.
  const missingBucket = current.status === 404
    || String(currentBody.statusCode || '') === '404'
    || String(currentBody.code || '') === 'NoSuchBucket'
    || /bucket not found/i.test(String(currentBody.message || ''));
  if (missingBucket) {
    const created = await fetch(`${baseUrl}/storage/v1/bucket`, { method: 'POST', headers, body: JSON.stringify({ id: bucket, name: bucket, ...bucketOptions }) });
    const createdText = await created.text().catch(() => '');
    if (!created.ok) {
      // A concurrent run may have created it between the GET and POST; verify before failing.
      const verified = await fetch(endpoint, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
      if (!verified.ok) throw new Error(`创建 Supabase Storage bucket 失败（HTTP ${created.status}）：${createdText.slice(0, 300)}`);
      const info = await verified.json().catch(() => ({})) as { public?: boolean };
      if (info.public !== true && process.env.SUPABASE_STORAGE_MAKE_PUBLIC !== 'true') {
        throw new Error(`Bucket「${bucket}」已经存在且为私有。请确认里面没有私人文件，再设置 SUPABASE_STORAGE_MAKE_PUBLIC=true；否则请使用新的公开 Bucket。`);
      }
      console.log(`[STORAGE] Bucket already exists: ${bucket}`);
    } else {
      console.log(`[STORAGE] Created public bucket: ${bucket}`);
    }
  } else if (current.ok) {
    const info = currentBody as { public?: boolean };
    if (info.public !== true && process.env.SUPABASE_STORAGE_MAKE_PUBLIC !== 'true') {
      throw new Error(`Bucket「${bucket}」已存在且为私有。为避免意外公开已有文件，脚本没有自动更改权限。建议创建一个全新的公开 bucket；只有确认该 bucket 内所有对象均可公开访问时，才将 SUPABASE_STORAGE_MAKE_PUBLIC=true 后重试。`);
    }
    const updated = await fetch(endpoint, { method: 'PUT', headers, body: JSON.stringify(bucketOptions) });
    const updatedText = await updated.text().catch(() => '');
    if (!updated.ok) throw new Error(`更新 bucket 配置失败（HTTP ${updated.status}）：${updatedText.slice(0, 300)}`);
    console.log(`[STORAGE] Bucket configured: ${bucket}, public=true, fileSizeLimit=${maxFileSizeMb}MB`);
  } else {
    throw new Error(`检查 Supabase Storage bucket 失败（HTTP ${current.status}）：${currentText.slice(0, 300)}`);
  }

  const existing = await getStorageConfig();
  await (prisma as any).storageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, provider: 'SUPABASE', endpoint: baseUrl, bucket, maxFileSizeMb, allowedTypes: existing?.allowedTypes || ['IMAGE','VIDEO','AUDIO','ARCHIVE','PDF','WORD','SPREADSHEET','PRESENTATION','MARKDOWN','TEXT','FILE'], enabled: true },
    update: { provider: 'SUPABASE', endpoint: baseUrl, region: null, bucket, maxFileSizeMb, accessKeyId: null, secretEncrypted: null, cdnUrl: null, enabled: true },
  });
  console.log(`[STORAGE] DB storage_configs configured for Supabase bucket ${bucket}.`);
}

main().catch((error) => { console.error('[STORAGE] Setup failed:', error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
