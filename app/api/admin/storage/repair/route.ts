import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { ensureStorageConfigTable, ensureFileStorageSchema } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await requirePermission('storage.edit');
    const result = await ensureStorageConfigTable();
    await ensureFileStorageSchema();
    return NextResponse.json({ success: true, created: result.created, fileSchemaReady: true, message: result.created ? '存储配置与文件资源结构已初始化，并已写入默认本地存储配置。' : '存储配置与 Skill / Prompt / MediaAsset 文件资源结构已经就绪。' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '存储配置表修复失败。' }, { status: 500 });
  }
}
