import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage, getSiteSetting, jsonObject } from '@/lib/public-site';
import { getPageData, getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';
import UnifiedProductGrid from '@/components/public/unified-product-grid';
import type { EmployeeShowcaseItem } from '@/lib/employee-showcase';
import { dynamicEmployeeTitle } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [s, page] = await Promise.all([getSiteSetting(), getPage('products')]);
  return { title: page?.seoTitle || `AI超级员工｜${s?.siteName || '豫辉'}`, description: page?.seoDescription || page?.description || '查看豫辉 AI数字员工的岗位能力与营销场景。' };
}

export default async function Products() {
  const [items, page] = await Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE' }, include: { features: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }),
    getPage('products'),
  ]);
  const heroData = getPageData(page, 'hero');
  const showcaseSection = page?.sections?.find((section: any) => section.sectionKey === 'showcase');
  const showcaseData = jsonObject(showcaseSection?.data);
  const showcaseItems = (showcaseSection && showcaseSection.enabled !== false && Array.isArray(showcaseData.items) ? showcaseData.items : []) as EmployeeShowcaseItem[];
  const employeeTitle = dynamicEmployeeTitle(page?.title, items.length).replace(/AI\s*超级员工/g, 'AI数字员工');
  const ctaText = String(getPageValue(page, 'cards', 'ctaText', '查看能力')).replace(/[→↗\s]+$/, '');

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="container inner-hero-inner">
          <span className="section-kicker">{getPageValue(page, 'hero', 'kicker', 'AI WORKFORCE')}</span>
          <h1>{employeeTitle}</h1>
          <p>{page?.description || '从内容生产、品牌IP、AI获客，到客户接待与销售跟进，覆盖企业营销关键环节。'}</p>
          {heroData.button?.text && <Link href={heroData.button.url || '/contact'} className="button button-secondary">{heroData.button.text}</Link>}
        </div>
      </section>

      <UnifiedProductGrid
        products={items}
        scenes={showcaseItems}
        title={showcaseSection?.title || '看看 AI 数字员工如何工作'}
        subtitle={showcaseSection?.subtitle || '从内容创作到智能获客，透过真实操作界面，直观了解数字员工如何把岗位能力转化为可执行的工作流程。'}
        kicker={String(showcaseData.kicker || 'AI DIGITAL WORKFORCE / CAPABILITY MAP')}
        tagFallback={String(getPageValue(page, 'cards', 'tag', 'AI数字员工'))}
        ctaText={ctaText}
        emptyText={String(getPageValue(page, 'empty', 'text', '后台暂未发布产品。'))}
      />

      <PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty','showcase']} />
      <SiteFooter />
    </main>
  );
}
