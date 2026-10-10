import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission, requirePermission } from '@/lib/admin-auth';

const MODELS: Record<string, string> = {
  solutions: 'solution', cases: 'caseStudy', resources: 'resource', tutorials: 'tutorial', articles: 'article', faqs: 'faq',
  changelogs: 'changelog', leads: 'lead', media: 'mediaAsset', pages: 'page',
};

function normalizeBody(body: Record<string, unknown>) {
  const b = { ...body };
  delete b.id; delete b.createdAt; delete b.updatedAt;
  for (const key of ['sortOrder', 'duration', 'viewCount', 'downloadCount', 'copyCount', 'fileSize']) {
    if (key in b && b[key] !== '' && b[key] !== null && b[key] !== undefined) (b as any)[key] = Number((b as any)[key]);
  }
  for (const key of ['tags', 'results', 'socialLinks', 'data']) {
    if (typeof (b as any)[key] === 'string') {
      try { (b as any)[key] = JSON.parse((b as any)[key]); } catch { /* keep plain string for helpful error */ }
    }
  }

  for (const key of ['publishedAt', 'releaseDate']) {
    if (typeof (b as any)[key] === 'string' && String((b as any)[key]).trim()) {
      const date = new Date(String((b as any)[key]));
      if (Number.isNaN(date.getTime())) throw new Error(`${key} 日期格式无效`);
      (b as any)[key] = date;
    } else if ((b as any)[key] === '') {
      (b as any)[key] = null;
    }
  }
  return b;
}

function permissionFor(type: string, action: 'view' | 'edit' | 'delete') {
  if (type === 'leads') return `lead.${action}`;
  if (type === 'media') return action === 'view' ? 'file.view' : action === 'delete' ? 'file.delete' : 'file.manage';
  return `content.${action}`;
}

function serialize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
}

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const model = MODELS[type];
  if (!model) return NextResponse.json({ success: false, message: '不支持的 CMS 类型' }, { status: 404 });
  try {
    await requirePermission(permissionFor(type, 'view'));
    const item = await (prisma as any)[model].findUnique({ where: { id: Number(id) } });
    if (!item) return NextResponse.json({ success: false, message: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: serialize(item) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '读取失败' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const model = MODELS[type];
  if (!model) return NextResponse.json({ success: false, message: '不支持的 CMS 类型' }, { status: 404 });
  try {
    await requirePermission(permissionFor(type, 'edit'));
    const body = normalizeBody(await request.json());
    if (type !== 'leads' && type !== 'media' && body.status === 'PUBLISHED') {
      if (!(await checkPermission('content.publish'))) return NextResponse.json({ success: false, message: '没有内容发布权限' }, { status: 403 });
    }
    const item = await (prisma as any)[model].update({ where: { id: Number(id) }, data: body });
    return NextResponse.json({ success: true, data: serialize(item) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '更新失败，请检查必填项和唯一字段' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const model = MODELS[type];
  if (!model) return NextResponse.json({ success: false, message: '不支持的 CMS 类型' }, { status: 404 });
  try {
    await requirePermission(permissionFor(type, 'delete'));
    await (prisma as any)[model].delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 400 });
  }
}
