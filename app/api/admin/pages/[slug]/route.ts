import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';

function parseSectionData(section: any, index: number): Record<string, any> | null {
  if (section.data === null || section.data === undefined || section.data === '') return null;
  if (typeof section.data === 'object' && !Array.isArray(section.data)) return section.data;
  if (typeof section.data === 'string') {
    const parsed = JSON.parse(section.data);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`区块「${section.sectionKey || `section-${index + 1}`}」的数据必须是 JSON 对象`);
    return parsed;
  }
  throw new Error(`区块「${section.sectionKey || `section-${index + 1}`}」的数据格式无效`);
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await checkPermission('page.view');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug }, include: { sections: { orderBy: { sortOrder: 'asc' } } } });
  if (!page) return NextResponse.json({ success: false, message: '页面不存在' }, { status: 404 });
  return NextResponse.json({ success: true, data: page });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const editor = await checkPermission('page.edit');
  if (!editor) return NextResponse.json({ success: false, message: '没有页面编辑权限' }, { status: 403 });
  const { slug } = await params;
  const body = await request.json();
  const requestedStatus = String(body.status || 'PUBLISHED');

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(requestedStatus)) {
    return NextResponse.json({ success: false, message: '页面状态无效' }, { status: 400 });
  }
  if (requestedStatus === 'PUBLISHED' && !await checkPermission('page.publish')) {
    return NextResponse.json({ success: false, message: '没有页面发布权限' }, { status: 403 });
  }

  let sectionRows: any[] | null = null;
  try {
    if (Array.isArray(body.sections)) {
      sectionRows = body.sections.map((section: any, index: number) => ({
        sectionKey: String(section.sectionKey || `section-${index + 1}`),
        title: section.title ?? null,
        subtitle: section.subtitle ?? null,
        content: section.content ?? null,
        imageUrl: section.imageUrl ?? null,
        videoUrl: section.videoUrl ?? null,
        data: parseSectionData(section, index),
        sortOrder: Number(section.sortOrder ?? index),
        enabled: section.enabled !== false,
      }));
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '区块数据 JSON 无效' }, { status: 400 });
  }

  const saved = await prisma.$transaction(async (tx) => {
    const page = await tx.page.upsert({
      where: { slug },
      update: {
        title: String(body.title ?? ''),
        description: body.description ?? null,
        content: ['home', 'about', 'contact'].includes(slug) ? null : (body.content ?? null),
        coverImage: null,
        status: requestedStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        sortOrder: Number(body.sortOrder || 0),
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        seoKeywords: body.seoKeywords ?? null,
      },
      create: {
        slug,
        title: String(body.title ?? slug),
        description: body.description ?? null,
        content: ['home', 'about', 'contact'].includes(slug) ? null : (body.content ?? null),
        coverImage: null,
        status: requestedStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        sortOrder: Number(body.sortOrder || 0),
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        seoKeywords: body.seoKeywords ?? null,
      },
    });

    if (sectionRows) {
      await tx.pageSection.deleteMany({ where: { pageId: page.id } });
      if (sectionRows.length) {
        await tx.pageSection.createMany({ data: sectionRows.map((row) => ({ ...row, pageId: page.id })) });
      }
    }

    return tx.page.findUnique({ where: { id: page.id }, include: { sections: { orderBy: { sortOrder: 'asc' } } } });
  });

  return NextResponse.json({ success: true, data: saved });
}
