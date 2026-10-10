import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 管理后台会话令牌的纯鉴权模块。
 * 只依赖 node:crypto 和环境变量，可以同时被 App Router 与 Next.js 16 Proxy 使用。
 */
export const ADMIN_SESSION_COOKIE = 'admin_session_v2';
export const LEGACY_ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL = 60 * 60 * 12;

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'change-this-admin-session-secret'
  );
}

export function signAdminSession(adminId: number) {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL;
  const payload = `${adminId}.${exp}`;
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [idRaw, expRaw, signature] = parts;
  const adminId = Number(idRaw);
  const exp = Number(expRaw);

  if (!Number.isInteger(adminId) || adminId <= 0) return null;
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
  if (!signature || signature.length !== 64) return null;

  const payload = `${adminId}.${exp}`;
  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');

  try {
    const actualBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (actualBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }

  return { adminId, exp };
}
