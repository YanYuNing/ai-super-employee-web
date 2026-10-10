import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('lead.edit');
    const b = await req.json();
    const lead = await prisma.lead.findUnique({ where: { id: Number((await params).id) } });
    if (!lead) return NextResponse.json({ success: false, message: '线索不存在' }, { status: 404 });
    if (!b.content?.trim()) return NextResponse.json({ success: false, message: '跟进内容不能为空' }, { status: 400 });
    const line = `[${new Date().toLocaleString('zh-CN')}] ${b.operator || '管理员'}：${String(b.content).trim()}`;
    const remark = [lead.remark, line].filter(Boolean).join('\n');
    const data = await prisma.lead.update({ where: { id: lead.id }, data: { remark, status: b.status || 'FOLLOWING', assignedTo: b.assignedTo || lead.assignedTo || null } });
    return NextResponse.json({ success: true, data });
  } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '记录跟进失败' }, { status: 400 }); }
}
