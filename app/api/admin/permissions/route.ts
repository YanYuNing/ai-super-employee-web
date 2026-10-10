import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';
import { PERMISSION_CATALOG } from '@/lib/rbac/catalog';
import { ensureRbacDefaults } from '@/lib/rbac/bootstrap';

export async function GET() {
  try {
    await requirePermission('role.view');
    await ensureRbacDefaults();
    const data = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
    const catalog = new Map(PERMISSION_CATALOG.map((x) => [x.code, x]));
    return NextResponse.json({
      success: true,
      data: data.map((x) => ({ ...x, ...(catalog.get(x.code) || { group: 'custom', groupName: '其他', description: '自定义权限项', action: '自定义' }) })),
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '无权限' }, { status: 403 });
  }
}
