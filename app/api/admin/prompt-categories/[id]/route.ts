import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requirePermission('prompt.edit'); const b = await req.json(); const data = await prisma.promptCategory.update({ where: { id: Number((await params).id) }, data: { name: b.name, slug: b.slug, description: b.description || null, sortOrder: Number(b.sortOrder || 0), status: b.status || 'PUBLISHED' } }); return NextResponse.json({ success: true, data }); } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '更新失败' }, { status: 400 }); } }
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requirePermission('prompt.delete'); await prisma.promptCategory.delete({ where: { id: Number((await params).id) } }); return NextResponse.json({ success: true }); } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '删除分类失败' }, { status: 400 }); } }
