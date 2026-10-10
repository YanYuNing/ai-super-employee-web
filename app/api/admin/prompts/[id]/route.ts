import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';
import { ensureFileStorageSchema } from '@/lib/storage';

function serialize(v: unknown): unknown {
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialize(x)]));
  return v;
}

function fileAllowed(name = '', type = '') {
  const ext = name.toLowerCase().split('.').pop() || '';
  return ['md', 'txt', 'doc', 'docx', 'pdf', 'json', 'zip'].includes(ext) || /pdf|word|json|zip|markdown|text/i.test(type);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkPermission('prompt.view');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });
  await ensureFileStorageSchema();
  const data = await prisma.prompt.findUnique({ where: { id: Number((await params).id) }, include: { category: true, fileAsset: true } as any });
  if (!data) return NextResponse.json({ success: false, message: 'Prompt 不存在' }, { status: 404 });
  return NextResponse.json({ success: true, data: serialize(data) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkPermission('prompt.edit');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });
  try { await ensureFileStorageSchema();
    const b = await req.json();
    const status = b.status || 'DRAFT';
    const hasFile = Boolean(b.fileAssetId && b.fileUrl);
    if (status === 'PUBLISHED' && !hasFile && !String(b.content || '').trim()) return NextResponse.json({ success: false, message: '发布 Prompt 至少需要上传一个 Prompt 文件，或填写文字内容。' }, { status: 400 });
    if (hasFile && b.fileName && !fileAllowed(String(b.fileName), String(b.fileType || ''))) return NextResponse.json({ success: false, message: 'Prompt 文件仅支持 MD、TXT、DOC、DOCX、PDF、JSON、ZIP 等资料格式。' }, { status: 400 });
    const data = await prisma.prompt.update({ where: { id: Number((await params).id) }, data: { slug: b.slug, title: b.title, description: b.description || null, content: b.content || '', usage: b.usage || null, model: b.model || null, tags: typeof b.tags === 'string' ? JSON.parse(b.tags || 'null') : b.tags || null, categoryId: b.categoryId ? Number(b.categoryId) : null, status, fileAssetId: b.fileAssetId ? Number(b.fileAssetId) : null, fileName: b.fileName || null, fileType: b.fileType || null } as any });
    return NextResponse.json({ success: true, data: serialize(data) });
  } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '更新失败' }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkPermission('prompt.delete');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });
  try { await prisma.prompt.delete({ where: { id: Number((await params).id) } }); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ success: false, message: '删除失败' }, { status: 400 }); }
}
