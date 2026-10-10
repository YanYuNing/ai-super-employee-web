import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';

export async function GET() { try { await requirePermission('prompt.view'); return NextResponse.json({ success: true, data: await prisma.promptCategory.findMany({ orderBy: { sortOrder: 'asc' } }) }); } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '无权限' }, { status: 403 }); } }
export async function POST(req: Request) { try { await requirePermission('prompt.create'); const b = await req.json(); if (!b.name || !b.slug) return NextResponse.json({ success: false, message: '分类名称和 Slug 不能为空' }, { status: 400 }); const data = await prisma.promptCategory.create({ data: { name: b.name, slug: b.slug, description: b.description || null, sortOrder: Number(b.sortOrder || 0), status: b.status || 'PUBLISHED' } }); return NextResponse.json({ success: true, data }); } catch (e) { return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '创建分类失败' }, { status: 400 }); } }
