import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from '@/lib/admin-session';

/**
 * Next.js 16 Proxy：不仅检查 cookie 是否存在，还验证签名和有效期。
 * 这样旧项目留下的失效 admin_session 不会把用户卡在 /admin 的 403 页面里。
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  if ((isAdminPage && !isLoginPage) || (isAdminApi && !isLoginApi)) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSession(token);

    if (!session) {
      if (isAdminApi) {
        const response = NextResponse.json(
          { success: false, message: '未登录或登录已失效，请重新登录' },
          { status: 401 },
        );
        response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
        response.cookies.set(LEGACY_ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
        return response;
      }

      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('reason', 'session-expired');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
      response.cookies.set(LEGACY_ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
