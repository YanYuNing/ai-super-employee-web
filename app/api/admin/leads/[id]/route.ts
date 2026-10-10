import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('lead.edit');
    const b = await req.json();
    const data = await prisma.lead.update({ where: { id: Number((await params).id) }, data: { name: b.name || null, company: b.company || null, phone: b.phone || null, wechat: b.wechat || null, industry: b.industry || null, source: b.source || undefined, status: b.status || undefined, assignedTo: b.assignedTo || null, remark: b.remark || null, message: b.message || null } });
    return NextResponse.json({ success: true, data });
  } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '更新线索失败' }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requirePermission('lead.delete'); await prisma.lead.delete({ where: { id: Number((await params).id) } }); return NextResponse.json({ success: true }); }
  catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '删除线索失败' }, { status: 400 }); }
}
