import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/password';

const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin';
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!password) {
  throw new Error('请提供新密码：npx.cmd tsx scripts/reset-admin-password.ts admin 123456');
}

const admin = await prisma.admin.findUnique({ where: { username } });
if (!admin) {
  throw new Error(`管理员不存在：${username}`);
}

await prisma.admin.update({
  where: { id: admin.id },
  data: { passwordHash: hashPassword(password), status: 'ACTIVE' },
});

console.log(`管理员 ${username} 密码已重置为安全哈希。`);
process.exit(0);
