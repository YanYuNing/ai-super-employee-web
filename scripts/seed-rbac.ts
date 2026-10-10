import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { DEFAULT_ROLE_PRESETS, PERMISSION_CATALOG } from '@/lib/rbac/catalog';

const roleDefs = [
  { name: '超级管理员', description: '系统最高权限，拥有全部后台能力，不受普通角色权限限制' },
  { name: '内容编辑', description: '负责官网内容、产品、Skill、Prompt、下载与线索维护' },
  { name: '文件管理员', description: '负责媒体文件、Skill/Prompt 文件与对象存储配置' },
  { name: '运营人员', description: '负责日常官网内容查看、运营与销售线索跟进' },
];

async function main() {
  for (const item of PERMISSION_CATALOG) {
    await prisma.permission.upsert({ where: { code: item.code }, update: { name: item.name }, create: { code: item.code, name: item.name } });
  }
  const all = await prisma.permission.findMany();
  const byCode = new Map(all.map((p) => [p.code, p]));
  const roles: Record<string, any> = {};

  for (const def of roleDefs) {
    roles[def.name] = await prisma.role.upsert({ where: { name: def.name }, update: { description: def.description }, create: def });
  }

  const superRole = roles['超级管理员'];
  await prisma.rolePermission.deleteMany({ where: { roleId: superRole.id } });
  await prisma.rolePermission.createMany({ data: all.map((p) => ({ roleId: superRole.id, permissionId: p.id })), skipDuplicates: true });

  for (const [roleName, codes] of Object.entries(DEFAULT_ROLE_PRESETS)) {
    const role = roles[roleName];
    if (!role) continue;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissionIds = (codes as string[]).map((code) => byCode.get(code)?.id).filter(Boolean) as number[];
    if (permissionIds.length) await prisma.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true });
  }

  let admin = await prisma.admin.findFirst({ where: { username: 'admin' } });
  if (!admin) admin = await prisma.admin.findFirst({ orderBy: { id: 'asc' } });
  if (!admin && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    admin = await prisma.admin.create({ data: { username: process.env.ADMIN_USERNAME, passwordHash: hashPassword(process.env.ADMIN_PASSWORD), name: '超级管理员', role: 'admin', status: 'ACTIVE' } });
  }
  if (admin) {
    await prisma.adminRole.upsert({ where: { adminId_roleId: { adminId: admin.id, roleId: superRole.id } }, update: {}, create: { adminId: admin.id, roleId: superRole.id } });
  }

  console.log('RBAC 初始化完成', { permissions: all.length, roles: roleDefs.length, admin: admin?.username || 'none' });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
