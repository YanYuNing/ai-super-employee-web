import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { PERMISSION_CATALOG } from '@/lib/rbac/catalog';

async function main() {
  let admin = await prisma.admin.findUnique({ where: { username: 'admin' } });

  if (!admin) {
    admin = await prisma.admin.findFirst({ where: { status: 'ACTIVE' }, orderBy: { id: 'asc' } });
  }

  if (!admin && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    admin = await prisma.admin.create({
      data: {
        username: process.env.ADMIN_USERNAME,
        passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
        name: '超级管理员',
        role: 'admin',
        status: 'ACTIVE',
      },
    });
  }

  if (!admin) throw new Error('数据库中没有可用管理员账号');

  if (admin.status !== 'ACTIVE') {
    admin = await prisma.admin.update({ where: { id: admin.id }, data: { status: 'ACTIVE' } });
  }

  let rbacReady = true;
  try {
    for (const item of PERMISSION_CATALOG) {
      await prisma.permission.upsert({
        where: { code: item.code },
        update: { name: item.name },
        create: { code: item.code, name: item.name },
      });
    }

    const allPermissions = await prisma.permission.findMany();
    const superRole = await prisma.role.upsert({
      where: { name: '超级管理员' },
      update: { description: '系统最高权限，拥有全部后台能力，不受普通角色权限限制' },
      create: { name: '超级管理员', description: '系统最高权限，拥有全部后台能力，不受普通角色权限限制' },
    });

    await prisma.rolePermission.createMany({
      data: allPermissions.map((permission) => ({ roleId: superRole.id, permissionId: permission.id })),
      skipDuplicates: true,
    });

    await prisma.adminRole.upsert({
      where: { adminId_roleId: { adminId: admin.id, roleId: superRole.id } },
      update: {},
      create: { adminId: admin.id, roleId: superRole.id },
    });
  } catch (error) {
    rbacReady = false;
    console.warn('RBAC 表暂不可用，但管理员自身仍按超级管理员兼容模式运行。');
    console.warn(error instanceof Error ? error.message : error);
  }

  console.log('管理员权限修复完成', {
    adminId: admin.id,
    username: admin.username,
    status: admin.status,
    rbacReady,
    rule: 'username=admin 或唯一 ACTIVE 管理员自动拥有全部后台权限',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
