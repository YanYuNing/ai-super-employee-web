import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';
import { getPageData, getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';

const industryMeta: Record<string, { kicker: string; icon: string; flow: string[] }> = {
  ecommerce: { kicker: '电商增长', icon: '◈', flow: ['内容生产', 'AI获客', '客服转化'] },
  'local-life': { kicker: '本地生活', icon: '◎', flow: ['本地曝光', '线索引流', '客户接待'] },
  education: { kicker: '教育增长', icon: '✦', flow: ['内容生产', '搜索获客', '咨询转化'] },
  automotive: { kicker: '汽车服务', icon: '◇', flow: ['门店曝光', '客户引流', '销售跟进'] },
  manufacturing: { kicker: '制造业获客', icon: '▣', flow: ['行业内容', '精准获客', '商机跟进'] },
  factory: { kicker: '工厂获客', icon: '⌁', flow: ['产品内容', '关键词曝光', '询盘转化'] },
  'building-materials': { kicker: '建材行业', icon: '◌', flow: ['行业内容', '本地获客', '销售转化'] },
};

function metaFor(slug: string, name: string) {
  if (industryMeta[slug]) return industryMeta[slug];
  return Object.entries(industryMeta).find(([key, meta]) => slug.includes(key) || name.includes(meta.kicker))?.[1] || { kicker: '行业增长', icon: '✦', flow: ['内容生产', 'AI获客', '客户转化'] };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('solutions');
  return { title: page?.seoTitle || '解决方案｜豫辉 AI超级员工', description: page?.seoDescription || page?.description || '按行业与业务场景组合AI内容、获客、引流、销售与客服能力。' };
}

export default async function Solutions() {
  const [items, page] = await Promise.all([
    prisma.solution.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
    getPage('solutions'),
  ]);
  const hero = getPageData(page, 'hero');
  const cards = getPageData(page, 'cards');
  const cardsTitle = String(cards.title || '选择你的行业，直接进入营销作战方案');
  const cardsDescription = String(cards.description || '每个行业方案都可以继续拆分为数字员工岗位、能力组合与执行任务，让行业策略真正落到日常营销动作。');
  return <main className="public-page solutions-list-page"><SiteHeader dark/>
    <section className="inner-hero inner-hero-light solutions-hero">
      <div className="inner-hero-grid" />
      <div className="container inner-hero-inner">
        <span className="section-kicker">{getPageValue(page, 'hero', 'kicker', 'SOLUTIONS / INDUSTRY PLAYBOOK')}</span>
        <h1>{page?.title || '覆盖企业营销全链路的行业方案'}</h1>
        <p>{page?.description || '不是复制一套营销模板，而是根据行业、客户与业务目标组合数字员工能力。'}</p>
        {hero.button?.text && <Link href={hero.button.url || '/contact'} className="button button-primary">{hero.button.text}<span>→</span></Link>}
      </div>
    </section>
    <section className="public-section solutions-list-section">
      <div className="container">
        <div className="solutions-list-heading"><div><span className="section-kicker">{String(cards.kicker || 'AI DIGITAL WORKFORCE / INDUSTRY FIT')}</span><h2>{cardsTitle}</h2><p>{cardsDescription}</p></div><span>{items.length} 个行业场景</span></div>
        <div className="solutions-list-grid">
          {items.map((x, index) => { const meta = metaFor(x.slug, x.name); const tags = Array.isArray(x.tags) ? (x.tags as any[]).slice(0, 3).map(String) : []; return <Link href={`/solutions/${x.slug}`} className="solution-list-card" key={x.id}>
            <div className="solution-list-top"><span>{String(index + 1).padStart(2, '0')}</span><i>{x.icon || meta.icon}</i></div>
            <span className="solution-list-kicker">{meta.kicker}</span>
            <h2>{x.name}</h2>
            <p>{x.description || `围绕${meta.kicker}建立内容、获客、引流与客户转化闭环。`}</p>
            <div className="solution-list-flow">{(tags.length ? tags : meta.flow).map((tag: string, tagIndex: number) => <span key={`${tag}-${tagIndex}`}>{tag}</span>)}</div>
            <div className="solution-list-cta"><b>{cards.ctaText || '进入方案'}</b><span>↗</span></div>
          </Link>; })}
        </div>
        {!items.length && <div className="empty-public">{getPageValue(page, 'empty', 'text', '后台暂未发布解决方案。发布后前台会自动同步。')}</div>}
      </div>
    </section>
    <PublicExtraSections page={page} reservedKeys={['hero','cards','empty','detail']} />
    <SiteFooter/>
  </main>;
}

