import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission, requirePermission } from '@/lib/admin-auth';

const CONFIG: Record<string, { model: string; orderBy: Record<string, 'asc' | 'desc'>; searchFields: string[] }> = {
  solutions: { model: 'solution', orderBy: { sortOrder: 'asc' }, searchFields: ['name', 'slug', 'description'] },
  cases: { model: 'caseStudy', orderBy: { sortOrder: 'asc' }, searchFields: ['title', 'slug', 'companyName', 'industry'] },
  resources: { model: 'resource', orderBy: { sortOrder: 'asc' }, searchFields: ['title', 'slug', 'description'] },
  tutorials: { model: 'tutorial', orderBy: { sortOrder: 'asc' }, searchFields: ['title', 'slug', 'description'] },
  articles: { model: 'article', orderBy: { createdAt: 'desc' }, searchFields: ['title', 'slug', 'summary'] },
  faqs: { model: 'faq', orderBy: { sortOrder: 'asc' }, searchFields: ['question', 'answer', 'category'] },
  changelogs: { model: 'changelog', orderBy: { releaseDate: 'desc' }, searchFields: ['version', 'title'] },
  leads: { model: 'lead', orderBy: { createdAt: 'desc' }, searchFields: ['name', 'company', 'phone', 'wechat', 'industry', 'message'] },
  media: { model: 'mediaAsset', orderBy: { createdAt: 'desc' }, searchFields: ['name', 'type', 'alt', 'description'] },
  pages: { model: 'page', orderBy: { sortOrder: 'asc' }, searchFields: ['title', 'slug', 'description'] },
};

function getConfig(type: string) {
  return CONFIG[type];
}
function permissionFor(type: string, action: 'view' | 'create' | 'edit' | 'delete') {
  if (type === 'leads') return `lead.${action === 'delete' ? 'delete' : action === 'view' ? 'view' : 'edit'}`;
  if (type === 'media') return action === 'view' ? 'file.view' : action === 'create' ? 'file.upload' : action === 'delete' ? 'file.delete' : 'file.manage';
  return `content.${action}`;
}


function normalizeBody(type: string, body: Record<string, unknown>) {
  const b: Record<string, unknown> = { ...body };
  delete b.id;
  delete b.createdAt;
  delete b.updatedAt;

  const numeric = ['sortOrder', 'duration', 'viewCount', 'downloadCount', 'copyCount', 'fileSize'];
  for (const key of numeric) {
    if (key in b && b[key] !== '' && b[key] !== null && b[key] !== undefined) b[key] = Number(b[key]);
  }

  for (const key of ['tags', 'results', 'socialLinks', 'data']) {
    if (typeof b[key] === 'string') {
      try { b[key] = JSON.parse(b[key] as string); } catch { b[key] = b[key]; }
    }
  }

  for (const key of ['publishedAt', 'releaseDate']) {
    if (typeof b[key] === 'string' && b[key].trim()) {
      const date = new Date(b[key]);
      if (Number.isNaN(date.getTime())) throw new Error(`${key} 日期格式无效`);
      b[key] = date;
    } else if (b[key] === '') {
      b[key] = null;
    }
  }

  if (type === 'leads') {
    for (const key of ['name', 'company', 'phone', 'wechat', 'industry', 'message', 'assignedTo', 'remark']) {
      if (key in b) b[key] = b[key] === '' ? null : b[key];
    }
  }

  if (type === 'pages') {
    if (!b.slug || !b.title) throw new Error('页面 Slug 和标题不能为空');
  }
  if (['solutions', 'cases', 'resources', 'tutorials', 'articles'].includes(type)) {
    if (!b.slug || !b.title && !b.name) throw new Error('Slug 和标题不能为空');
  }
  if (type === 'faqs' && (!b.question || !b.answer)) throw new Error('问题和答案不能为空');
  if (type === 'changelogs' && (!b.version || !b.title || !b.content)) throw new Error('版本、标题和内容不能为空');
  if (type === 'media' && (!b.name || !b.type || !b.url)) throw new Error('素材名称、类型和 URL 不能为空');

  return b;
}

function serialize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = getConfig(type);
  if (!config) return NextResponse.json({ success: false, message: '不支持的 CMS 类型' }, { status: 404 });

  try {
    await requirePermission(permissionFor(type, 'view'));
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const status = url.searchParams.get('status')?.trim() || '';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
    const db = prisma as any;
    const where: any = {};

    if (q) where.OR = config.searchFields.map((field) => ({ [field]: { contains: q } }));
    if (status && type !== 'leads') where.status = status;
    if (status && type === 'leads') where.status = status;

    const [items, total] = await Promise.all([
      db[config.model].findMany({ where, orderBy: config.orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      db[config.model].count({ where }),
    ]);

    return NextResponse.json({ success: true, data: serialize(items), meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error(`CMS GET ${type} failed`, error);
    return NextResponse.json({ success: false, message: '读取数据失败' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = getConfig(type);
  if (!config) return NextResponse.json({ success: false, message: '不支持的 CMS 类型' }, { status: 404 });
  try {
    await requirePermission(permissionFor(type, 'create'));
    const body = normalizeBody(type, await request.json());
    if (type !== 'leads' && type !== 'media' && body.status === 'PUBLISHED') {
      if (!(await checkPermission('content.publish'))) return NextResponse.json({ success: false, message: '没有内容发布权限' }, { status: 403 });
    }
    const db = prisma as any;
    const item = await db[config.model].create({ data: body });
    return NextResponse.json({ success: true, data: serialize(item) });
  } catch (error) {
    console.error(`CMS POST ${type} failed`, error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '创建失败' }, { status: 400 });
  }
}
