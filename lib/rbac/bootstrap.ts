import { prisma } from '@/lib/prisma';
import { DEFAULT_ROLE_PRESETS, PERMISSION_CATALOG } from '@/lib/rbac/catalog';

export async function ensureRbacDefaults() {
  for (const item of PERMISSION_CATALOG) {
    await prisma.permission.upsert({ where: { code: item.code }, update: { name: item.name }, create: { code: item.code, name: item.name } });
  }
  const all = await prisma.permission.findMany();
  const byCode = new Map(all.map((p) => [p.code, p]));
  const defs = [
    { name: '超级管理员', description: '系统最高权限，拥有全部后台能力，不受普通角色权限限制' },
    { name: '内容编辑', description: '负责官网内容、产品、Skill、Prompt、下载与线索维护' },
    { name: '文件管理员', description: '负责媒体文件、Skill/Prompt 文件与对象存储配置' },
    { name: '运营人员', description: '负责日常官网内容查看、运营与销售线索跟进' },
  ];
  for (const def of defs) {
    const role = await prisma.role.upsert({ where: { name: def.name }, update: {}, create: def });
    if (def.name === '超级管理员') continue;
    const current = await prisma.rolePermission.count({ where: { roleId: role.id } });
    if (current === 0) {
      const ids = (DEFAULT_ROLE_PRESETS[def.name] || []).map((code) => byCode.get(code)?.id).filter(Boolean) as number[];
      if (ids.length) await prisma.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true });
    }
  }
  const admin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  const superRole = await prisma.role.findUnique({ where: { name: '超级管理员' } });
  if (admin && superRole) await prisma.adminRole.upsert({ where: { adminId_roleId: { adminId: admin.id, roleId: superRole.id } }, update: {}, create: { adminId: admin.id, roleId: superRole.id } });
  return { permissions: all.length, roles: defs.length };
}
