import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { getStorageConfig, saveStorageConfig } from '@/lib/storage';

export async function GET() {
  try {
    await requirePermission('storage.view');
    const data = await getStorageConfig();
    if (!data) return NextResponse.json({ success: true, data: null });
    return NextResponse.json({ success: true, data: { ...data, secretConfigured: data.provider === 'SUPABASE' ? Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) : Boolean(data.secretEncrypted), secretEncrypted: undefined } });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '读取存储配置失败' }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  try {
    await requirePermission('storage.edit');
    const body = await req.json();
    const data = await saveStorageConfig({
      provider: body.provider === 'OSS' ? 'OSS' : body.provider === 'SUPABASE' ? 'SUPABASE' : 'LOCAL',
      endpoint: body.endpoint,
      region: body.region,
      bucket: body.bucket,
      accessKeyId: body.accessKeyId,
      secret: body.secret,
      basePath: body.basePath,
      cdnUrl: body.cdnUrl,
      maxFileSizeMb: body.maxFileSizeMb,
      allowedTypes: body.allowedTypes,
      enabled: body.enabled,
    });
    return NextResponse.json({ success: true, data: { ...data, secretEncrypted: undefined, secretConfigured: data?.provider === 'SUPABASE' ? Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) : Boolean(data?.secretEncrypted) } });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '保存存储配置失败' }, { status: 400 });
  }
}
