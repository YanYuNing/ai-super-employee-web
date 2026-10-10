import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, isSuperAdmin } from '@/lib/admin-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission('role.edit');
    const id = Number((await params).id);
    const role = await prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } }, admins: true } });
    if (!role) return NextResponse.json({ success: false, message: '角色不存在' }, { status: 404 });
    const b = await req.json();
    const protectedRole = role.name === '超级管理员' || role.name.toUpperCase() === 'SUPER_ADMIN';
    if (protectedRole) {
      return NextResponse.json({ success: false, message: '超级管理员为系统保留角色，不允许修改权限或删除' }, { status: 403 });
    }
    const name = String(b.name || '').trim();
    if (!name) return NextResponse.json({ success: false, message: '角色名称不能为空' }, { status: 400 });
    if (name === '超级管理员' || name.toUpperCase() === 'SUPER_ADMIN') return NextResponse.json({ success: false, message: '超级管理员为系统保留角色，请使用其他名称' }, { status: 400 });
    const ids = Array.isArray(b.permissionIds) ? b.permissionIds.map(Number).filter(Boolean) : [];
    if (!isSuperAdmin(actor) && ids.length) {
      const sensitive = await prisma.permission.findMany({ where: { id: { in: ids } } });
      if (sensitive.some((p) => p.code.startsWith('admin.') || p.code.startsWith('role.'))) return NextResponse.json({ success: false, message: '管理员与角色权限属于高危权限，只有超级管理员可以授予' }, { status: 403 });
    }
    const data = await prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id }, data: { name, description: b.description?.trim() || null } });
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (ids.length) await tx.rolePermission.createMany({ data: ids.map((permissionId: number) => ({ roleId: id, permissionId })), skipDuplicates: true });
      return tx.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } }, admins: true } });
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '更新角色失败' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('role.delete');
    const id = Number((await params).id);
    const role = await prisma.role.findUnique({ where: { id }, include: { admins: true } });
    if (!role) return NextResponse.json({ success: false, message: '角色不存在' }, { status: 404 });
    if (role.name === '超级管理员' || role.name.toUpperCase() === 'SUPER_ADMIN') return NextResponse.json({ success: false, message: '超级管理员为系统保留角色，不允许删除' }, { status: 403 });
    if (role.admins.length) return NextResponse.json({ success: false, message: `该角色仍被 ${role.admins.length} 个管理员使用，请先调整管理员角色` }, { status: 400 });
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '删除角色失败' }, { status: 400 });
  }
}
