import { NextResponse } from 'next/server';
import { access, constants, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { checkPermission } from '@/lib/admin-auth';
import { getLocalUploadRoot, getStorageConfig, ossDeleteUrl, ossPutUrl, storageProviderLabel } from '@/lib/storage';
import { checkSupabaseBucket, deleteSupabaseObject, uploadSupabaseObject } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkOss(config: Awaited<ReturnType<typeof getStorageConfig>>) {
  if (!config) return { ok: false, message: '数据库中尚未找到文件存储配置。' };
  const required = [
    ['Endpoint', config.endpoint],
    ['Bucket', config.bucket],
    ['AccessKey ID', config.accessKeyId],
    ['AccessKey Secret', config.secretEncrypted],
  ];
  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) return { ok: false, provider: 'OSS', missing, message: `OSS 配置不完整：${missing.join('、')}` };

  const key = `system/health/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.txt`;
  const body = Buffer.from('ai-super-employee-storage-health');
  const put = ossPutUrl(config, key, 180);
  const putResponse = await fetch(put.url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body });
  if (!putResponse.ok) {
    const detail = await putResponse.text().catch(() => '');
    throw new Error(`OSS 写入测试失败：HTTP ${putResponse.status}${detail ? `：${detail.slice(0, 180)}` : ''}`);
  }

  try {
    const del = ossDeleteUrl(config, key, 180);
    const delResponse = await fetch(del.url, { method: 'DELETE' });
    if (!delResponse.ok && delResponse.status !== 404) {
      const detail = await delResponse.text().catch(() => '');
      throw new Error(`OSS 删除测试失败：HTTP ${delResponse.status}${detail ? `：${detail.slice(0, 180)}` : ''}`);
    }
  } finally {
    // 测试对象使用短生命周期签名地址，删除失败时也不会进入业务目录。
  }

  return { ok: true, provider: 'OSS', providerLabel: storageProviderLabel('OSS'), endpoint: config.endpoint, bucket: config.bucket, basePath: config.basePath || '', signedPutReady: true, writeTest: true, deleteTest: true, message: 'OSS 配置完整，签名地址生成、写入与删除测试均通过。' };
}

async function checkSupabase(config: Awaited<ReturnType<typeof getStorageConfig>>) {
  if (!config?.bucket) return { ok: false, provider: 'SUPABASE', message: '未配置 Supabase Storage bucket。' };
  const bucket = await checkSupabaseBucket(config.bucket);
  if (!bucket.isPublic) return { ok: false, provider: 'SUPABASE', providerLabel: storageProviderLabel('SUPABASE'), bucket: bucket.bucket, message: 'Bucket 已存在但不是公开读取。官网图片使用公开 URL，请运行 npm.cmd run storage:setup:supabase 重新配置。' };
  const key = `system/health/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.txt`;
  await uploadSupabaseObject(key, Buffer.from('ai-super-employee-storage-health'), 'text/plain', { bucket: config.bucket, upsert: true });
  await deleteSupabaseObject(key, config.bucket);
  return { ok: true, provider: 'SUPABASE', providerLabel: storageProviderLabel('SUPABASE'), endpoint: config.endpoint, bucket: config.bucket, basePath: config.basePath || '', writeTest: true, deleteTest: true, message: 'Supabase Storage Bucket 可访问，写入和删除测试通过。' };
}

export async function GET() {
  const admin = await checkPermission('storage.view');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });

  try {
    const config = await getStorageConfig();
    if (!config) return NextResponse.json({ success: true, data: { ok: false, provider: 'LOCAL', providerLabel: '本地存储', message: '数据库中尚未找到文件存储配置。' } });

    if (config.provider === 'LOCAL') {
      const root = getLocalUploadRoot();
      await mkdir(root, { recursive: true });
      await access(root, constants.W_OK);
      const probe = path.join(root, `.storage-health-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.tmp`);
      await writeFile(probe, 'ok', 'utf8');
      await rm(probe, { force: true });
      return NextResponse.json({ success: true, data: { ok: true, provider: 'LOCAL', providerLabel: storageProviderLabel('LOCAL'), root, basePath: config.basePath || '', writable: true, writeTest: true, deleteTest: true, message: '本地存储目录可访问、可写入、可删除，上传服务可以使用。' } });
    }

    if (config.provider === 'SUPABASE') return NextResponse.json({ success: true, data: await checkSupabase(config) });
    return NextResponse.json({ success: true, data: await checkOss(config) });
  } catch (error) {
    return NextResponse.json({ success: true, data: { ok: false, message: error instanceof Error ? error.message : '存储检测失败。' } });
  }
}
