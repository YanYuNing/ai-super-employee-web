import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';
import { ensureFileStorageSchema } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Read public image assets for the page editor, including screenshots uploaded after initial seeding. */
export async function GET() {
  try {
    // Page editors must be able to replace showcase images even when their role does not
    // grant access to the broader file-management screen. Upload permissions remain enforced
    // by the existing upload endpoint.
    const admin = await checkPermission('page.view');
    if (!admin) return NextResponse.json({ success: false, message: '没有页面查看权限，请重新登录或联系管理员。' }, { status: 403 });
    await ensureFileStorageSchema();

    const assets = await prisma.mediaAsset.findMany({
      where: { type: 'IMAGE', isPublic: true },
      orderBy: [{ folder: 'asc' }, { sortOrder: 'asc' }, { id: 'desc' }],
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: assets.map((asset) => {
        const metadata = asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
          ? asset.metadata as Record<string, unknown>
          : {};
        return {
          id: asset.id,
          name: asset.name,
          url: `/api/public/assets/${asset.id}`,
          alt: asset.alt,
          label: String(metadata.galleryLabel || `${asset.folder || '素材库'} · ${asset.name}`),
          number: Number(metadata.galleryNumber || asset.sortOrder || 0),
          mimeType: asset.mimeType,
          fileSize: String(asset.fileSize || 0),
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取数据库截图库失败';
    return NextResponse.json({ success: false, message }, { status: /权限|permission/i.test(message) ? 403 : 500 });
  }
}
