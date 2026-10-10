import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, isSuperAdmin } from '@/lib/admin-auth';

function serialize(data: any[]) {
  return data.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    permissions: (role.permissions || []).map((x: any) => ({ id: x.id, permissionId: x.permissionId, code: x.permission?.code, name: x.permission?.name })),
    admins: (role.admins || []).map((x: any) => ({ id: x.id, adminId: x.adminId })),
    protected: role.name === '超级管理员' || String(role.name).toUpperCase() === 'SUPER_ADMIN',
  }));
}

export async function GET() {
  try {
    await requirePermission('role.view');
    const data = await prisma.role.findMany({ orderBy: { id: 'asc' }, include: { permissions: { include: { permission: true } }, admins: true } });
    return NextResponse.json({ success: true, data: serialize(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '无权限' }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission('role.create');
    const b = await req.json();
    const name = String(b.name || '').trim();
    if (!name) return NextResponse.json({ success: false, message: '角色名称不能为空' }, { status: 400 });
    if (name === '超级管理员' || name.toUpperCase() === 'SUPER_ADMIN') return NextResponse.json({ success: false, message: '超级管理员为系统保留角色，请创建其他角色' }, { status: 400 });
    const ids = Array.isArray(b.permissionIds) ? b.permissionIds.map(Number).filter(Boolean) : [];
    if (!isSuperAdmin(actor) && ids.length) {
      const sensitive = await prisma.permission.findMany({ where: { id: { in: ids } } });
      if (sensitive.some((p) => p.code.startsWith('admin.') || p.code.startsWith('role.'))) return NextResponse.json({ success: false, message: '管理员与角色权限属于高危权限，只有超级管理员可以授予' }, { status: 403 });
    }
    const data = await prisma.role.create({
      data: {
        name,
        description: b.description?.trim() || null,
        permissions: ids.length ? { create: ids.map((permissionId: number) => ({ permission: { connect: { id: permissionId } } })) } : undefined,
      },
      include: { permissions: { include: { permission: true } }, admins: true },
    });
    return NextResponse.json({ success: true, data: serialize([data])[0] });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '创建角色失败' }, { status: 400 });
  }
}
