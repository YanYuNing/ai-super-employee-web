import { NextResponse } from 'next/server';
import { getCurrentAdmin, hasPermission, isSuperAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const superAdmin = isSuperAdmin(admin);
    const permissions = superAdmin
      ? ['*']
      : (admin.adminRoles || []).flatMap((x: any) =>
          (x.role?.permissions || [])
            .map((p: any) => p.permission?.code)
            .filter(Boolean)
        );

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        roles: (admin.adminRoles || []).map((x: any) => x.role?.name).filter(Boolean),
        permissions,
        superAdmin,
        canManageAdmins: superAdmin || hasPermission(admin, 'admin.view'),
      },
    });
  } catch (error) {
    console.error('[api/admin/me] 读取管理员权限失败：', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '读取管理员权限失败',
    }, { status: 500 });
  }
}
