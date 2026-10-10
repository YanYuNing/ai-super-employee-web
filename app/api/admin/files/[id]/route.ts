import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';
import { deleteSupabaseObject } from '@/lib/supabase-storage';
import { getStorageConfig } from '@/lib/storage';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('file.delete');
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, message: '资源 ID 无效' }, { status: 400 });
    const asset = await prisma.mediaAsset.findUnique({ where: { id } }) as any;
    if (!asset) return NextResponse.json({ success: false, message: '资源不存在' }, { status: 404 });
    const config = await getStorageConfig();
    const provider = String(asset.storageProvider || config?.provider || 'LOCAL').toUpperCase();
    if (provider === 'SUPABASE' && asset.storageKey) {
      await deleteSupabaseObject(String(asset.storageKey), config?.bucket);
    }
    await prisma.mediaAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '删除失败' }, { status: 400 });
  }
}
