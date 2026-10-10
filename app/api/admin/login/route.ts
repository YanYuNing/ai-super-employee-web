import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/password';
import { adminCookieOptions, COOKIE, LEGACY_COOKIE, signSession } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const normalizedUsername = String(username || '').trim();

    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { success: false, message: '请输入管理员账号和密码' },
        { status: 400 },
      );
    }

    let admin = await prisma.admin.findUnique({ where: { username: normalizedUsername } });

    if (!admin) {
      const bootstrapUser = process.env.ADMIN_USERNAME;
      const bootstrapPass = process.env.ADMIN_PASSWORD;
      if (
        bootstrapUser &&
        bootstrapPass &&
        bootstrapUser === normalizedUsername &&
        bootstrapPass === password
      ) {
        const count = await prisma.admin.count();
        if (count === 0) {
          admin = await prisma.admin.create({
            data: {
              username: bootstrapUser,
              passwordHash: hashPassword(bootstrapPass),
              name: '超级管理员',
              role: 'admin',
              status: 'ACTIVE',
            },
          });
        }
      }
    }

    if (!admin || admin.status !== 'ACTIVE' || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { success: false, message: '账号或密码错误' },
        { status: 401 },
      );
    }

    // 登录即修复管理员的历史数据兼容状态：无需依赖角色表存在，admin 本身就拥有最高权限。
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    // 对已有 RBAC 数据进行尽力修复；失败不会阻断登录，因为 admin 的超级权限由 admin-auth 保证。
    try {
      const superRole = await prisma.role.findUnique({ where: { name: '超级管理员' } });
      if (superRole) {
        await prisma.adminRole.upsert({
          where: { adminId_roleId: { adminId: admin.id, roleId: superRole.id } },
          update: {},
          create: { adminId: admin.id, roleId: superRole.id },
        });
      }
    } catch (error) {
      console.warn(
        '[admin-login] RBAC 自动修复跳过：',
        error instanceof Error ? error.message : error,
      );
    }

    const response = NextResponse.json({
      success: true,
      data: { id: admin.id, username: admin.username, name: admin.name },
    });

    // 使用 v2 会话名，自动淘汰旧包/旧密钥生成的 admin_session，避免旧 cookie 导致假 403。
    response.cookies.set(COOKIE, signSession(admin.id), adminCookieOptions);
    response.cookies.set(LEGACY_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });

    return response;
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : '登录失败' },
      { status: 500 },
    );
  }
}
