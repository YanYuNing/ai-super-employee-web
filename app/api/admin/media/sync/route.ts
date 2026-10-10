import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { syncLocalResourceAssets } from '@/lib/local-asset-sync';

export async function POST() {
  try {
    await requirePermission('file.upload');
    const summary = await syncLocalResourceAssets();
    return NextResponse.json({ success: true, message: '资源文件地址已与素材资产库完成关联检查。', data: summary });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '素材同步失败。' }, { status: 500 });
  }
}
