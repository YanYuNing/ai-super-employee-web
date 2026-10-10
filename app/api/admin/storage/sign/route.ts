import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { getStorageConfig, ossPutUrl, publicUrl, resolveStorageFolder, storageKeyFor, validateUploadPolicy } from '@/lib/storage';
import { detectFileType } from '@/lib/file-types';
import { createSupabaseSignedUploadUrl } from '@/lib/supabase-storage';

export async function POST(req: Request) {
  try {
    await requirePermission('file.upload');
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ success: false, message: '文件名不能为空。' }, { status: 400 });
    const config = await getStorageConfig();
    if (!config) return NextResponse.json({ success: false, message: '文件存储尚未配置。请先到“文件存储”中完成配置。' }, { status: 400 });

    const assetType = String(body.assetType || detectFileType(String(body.name), String(body.mimeType || ''))).toUpperCase();
    validateUploadPolicy(config, {
      name: String(body.name),
      size: Number(body.size || 0),
      mimeType: String(body.mimeType || ''),
      assetType,
    });

    const folder = resolveStorageFolder(config, String(body.folder || 'uploads'));
    const key = storageKeyFor(String(body.name), folder);
    if (config.provider === 'OSS') {
      const signed = ossPutUrl(config, key);
      return NextResponse.json({ success: true, provider: 'OSS', key, url: signed.url, publicUrl: publicUrl(config, key), expiresAt: signed.expiresAt, assetType, folder });
    }

    if (config.provider === 'SUPABASE') {
      const signed = await createSupabaseSignedUploadUrl(key, config.bucket);
      return NextResponse.json({ success: true, provider: 'SUPABASE', key, url: signed.url, token: signed.token, publicUrl: publicUrl(config, key), assetType, folder, bucket: signed.bucket });
    }

    return NextResponse.json({ success: true, provider: 'LOCAL', key, publicUrl: publicUrl(config, key), assetType, folder });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '生成上传地址失败' }, { status: 400 });
  }
}
