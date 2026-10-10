import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';

function serialize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

const types = new Set(['CLIENT', 'AGENT', 'SKILL', 'TEMPLATE', 'RESOURCE', 'OTHER']);
const platforms = new Set(['WINDOWS', 'MACOS', 'LINUX', 'WEB', 'ANDROID', 'IOS', 'OTHER']);
const statuses = new Set(['ACTIVE', 'INACTIVE']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkPermission('download.edit');
  if (!admin) return NextResponse.json({ success: false, message: '没有编辑下载项的权限或登录已过期' }, { status: 403 });

  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: '下载项 ID 无效' }, { status: 400 });
    }

    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const type = String(body.type ?? 'CLIENT').toUpperCase();
    const platformText = String(body.platform ?? '').toUpperCase();
    const status = String(body.status ?? 'ACTIVE').toUpperCase();
    const description = String(body.description ?? '').trim();
    const sortOrder = Number(body.sortOrder ?? 0);

    if (!name) return NextResponse.json({ success: false, message: '下载项名称不能为空' }, { status: 400 });
    if (name.length > 150) return NextResponse.json({ success: false, message: '名称不能超过 150 个字符' }, { status: 400 });
    if (!types.has(type)) return NextResponse.json({ success: false, message: '下载类型无效' }, { status: 400 });
    if (platformText && !platforms.has(platformText)) return NextResponse.json({ success: false, message: '平台类型无效' }, { status: 400 });
    if (!statuses.has(status)) return NextResponse.json({ success: false, message: '状态无效' }, { status: 400 });
    if (!Number.isFinite(sortOrder)) return NextResponse.json({ success: false, message: '排序必须是数字' }, { status: 400 });
    if (description.length > 500) return NextResponse.json({ success: false, message: '描述不能超过 500 个字符' }, { status: 400 });

    const data = await prisma.download.update({
      where: { id },
      data: {
        name,
        type: type as any,
        platform: platformText ? (platformText as any) : null,
        status: status as any,
        description: description || null,
        sortOrder: Math.trunc(sortOrder),
      },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json({ success: true, data: serialize(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新下载项失败';
    const isMissing = Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2025');
    return NextResponse.json({ success: false, message: isMissing ? '下载项不存在或已删除' : message }, { status: isMissing ? 404 : 400 });
  }
}
