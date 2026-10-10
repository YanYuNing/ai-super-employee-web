import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceBackLink from '@/components/resource-back-link';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('resources');
  return {
    title: `资料库｜${page?.title || '资源中心'}`,
    description: '仅展示 CMS 资源内容。Skills 与 Prompt 使用各自独立中心管理，不在资料库中重复出现。',
  };
}

export default async function ResourceLibrary({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const page = await getPage('resources');
  const categorySlug = String(category || '').trim().toLowerCase();
  let categoryRow: { id: number } | null = null;
  if (categorySlug) {
    const row = await prisma.resourceCategory.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [
          { slug: categorySlug },
          { name: { contains: categorySlug } },
          ...(categorySlug === 'manual' ? [{ name: { contains: '使用手册' } }] : []),
        ],
      },
      select: { id: true },
    });
    categoryRow = row;
  }

  const items = await prisma.resource.findMany({
    where: {
      status: 'PUBLISHED',
      ...(categoryRow ? { categoryId: categoryRow.id } : {}),
    },
    include: { category: true },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="inner-hero-grid" />
        <div className="container inner-hero-inner">
          <ResourceBackLink />
          <span className="section-kicker resource-back-kicker">AI DIGITAL WORKFORCE / LIBRARY</span>
          <h1>{categorySlug ? '使用手册' : '行业资料与资源'}</h1>
          <p>这里承接 AI 数字员工工作所需的资料、手册、产品材料与行业参考内容；Skills、Prompt 与教程仍从各自模块进入。</p>
        </div>
      </section>
      <section className="public-section">
        <div className="container">
          <div className="resource-public-grid">
            {items.map((item) => (
              <Link href={`/resources/${item.slug}`} className="resource-public-card" key={item.id}>
                <span>{item.category?.name || '资源'}</span>
                <h2>{item.title}</h2>
                <p>{item.description || '暂无简介'}</p>{Array.isArray(item.tags) && item.tags.length > 0 && <div className="resource-card-tags">{item.tags.slice(0,4).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}
                <b>查看资料 →</b>
              </Link>
            ))}
          </div>
          {!items.length && <div className="empty-public">当前模块暂无已发布资料。</div>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
