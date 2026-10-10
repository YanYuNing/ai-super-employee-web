import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL,
  LEGACY_ADMIN_SESSION_COOKIE,
  signAdminSession,
  verifyAdminSession,
} from '@/lib/admin-session';

export const COOKIE = ADMIN_SESSION_COOKIE;
export const LEGACY_COOKIE = LEGACY_ADMIN_SESSION_COOKIE;

export function signSession(adminId: number) {
  return signAdminSession(adminId);
}

export function verifySessionToken(token?: string | null) {
  return verifyAdminSession(token);
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) return null;

  // 先读取管理员本身。超级管理员判定不依赖 RBAC 关联表，避免历史数据库的角色表问题把唯一管理员挡在后台外。
  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return null;

  let adminRoles: any[] = [];
  try {
    const withRoles = await prisma.admin.findUnique({
      where: { id: session.adminId },
      include: {
        adminRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    adminRoles = withRoles?.adminRoles || [];
  } catch (error) {
    console.warn(
      '[admin-auth] RBAC 关联读取失败，管理员改用兼容权限模式：',
      error instanceof Error ? error.message : error,
    );
  }

  // 这是兼容历史项目数据库的关键：只有一个有效管理员时，他就是最高管理员。
  let singleActiveAdmin = false;
  try {
    singleActiveAdmin = (await prisma.admin.count({ where: { status: 'ACTIVE' } })) <= 1;
  } catch {
    // 不因为统计失败影响已经验证通过的管理员登录。
  }

  return Object.assign(admin, {
    adminRoles,
    __singleActiveAdmin: singleActiveAdmin,
    __sessionExpiresAt: session.exp,
  });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.status !== 'ACTIVE') throw new Error('未登录或管理员已禁用');
  return admin;
}

export function isSuperAdmin(admin: any) {
  if (!admin) return false;
  const username = String(admin.username || '').trim().toLowerCase();
  const legacyRole = String(admin.role || '').trim().toUpperCase();

  return (
    username === 'admin' ||
    admin.__singleActiveAdmin === true ||
    legacyRole === 'SUPER_ADMIN' ||
    legacyRole === 'SUPERADMIN' ||
    (admin.adminRoles || []).some((ar: any) => {
      const name = String(ar.role?.name || '').trim();
      return (
        name === '超级管理员' ||
        name.toUpperCase() === 'SUPER_ADMIN' ||
        name.toUpperCase() === 'SUPERADMIN'
      );
    })
  );
}

export function hasPermission(admin: any, permission: string) {
  if (!admin || admin.status !== 'ACTIVE') return false;
  if (isSuperAdmin(admin)) return true;

  const codes = (admin.adminRoles || [])
    .flatMap((ar: any) =>
      (ar.role?.permissions || [])
        .map((rp: any) => rp.permission?.code)
        .filter(Boolean),
    );

  return (
    codes.includes('*') ||
    codes.includes(permission) ||
    codes.some((code: string) => permission.startsWith(`${code}.`))
  );
}

export async function requirePermission(permission: string) {
  const admin = await requireAdmin();
  if (!hasPermission(admin, permission)) throw new Error(`没有权限：${permission}`);
  return admin;
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: ADMIN_SESSION_TTL,
};

export async function checkPermission(permission: string) {
  try {
    return await requirePermission(permission);
  } catch {
    return null;
  }
}
