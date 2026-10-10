import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('lead.edit');
    const b = await req.json();
    const allowed = ['NEW', 'CONTACTED', 'FOLLOWING', 'CONVERTED', 'CLOSED'];
    if (!allowed.includes(b.status)) return NextResponse.json({ success: false, message: '状态无效' }, { status: 400 });
    const data = await prisma.lead.update({ where: { id: Number((await params).id) }, data: { status: b.status, remark: b.remark || undefined } });
    return NextResponse.json({ success: true, data });
  } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '更新状态失败' }, { status: 400 }); }
}
