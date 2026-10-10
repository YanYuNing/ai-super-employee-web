import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import PublicExtraSections from '@/components/public/page-extra-sections';
import { prisma } from '@/lib/prisma';
import { getPage, getPageValue } from '@/lib/public-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('articles');
  return { title: page?.seoTitle || '文章 / 新闻｜豫辉 AI超级员工', description: page?.seoDescription || page?.description || '豫辉 AI超级员工知识文章、企业动态与产品内容。' };
}

export default async function ArticlesPage() {
  const [items, page] = await Promise.all([
    prisma.article.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] }),
    getPage('articles'),
  ]);
  return <main className="public-page">
    <SiteHeader dark />
    <section className="inner-hero inner-hero-light">
      <div className="inner-hero-grid" />
      <div className="container inner-hero-inner">
        <span className="section-kicker">{getPageValue(page, 'hero', 'kicker', 'KNOWLEDGE / ARTICLES')}</span>
        <h1>{page?.title || '文章 / 新闻'}</h1>
        <p>{page?.description || '产品观点、AI 数字员工实践与企业内容统一沉淀在这里。'}</p>
      </div>
    </section>
    <section className="public-section">
      <div className="container">
        <div className="resource-public-grid">
          {items.map((x) => <Link href={`/articles/${x.slug}`} className="resource-public-card" key={x.id}>
            {x.coverImage && <img className="public-list-card-image" src={x.coverImage} alt={x.title} />}
            <span>{x.author || getPageValue(page, 'cards', 'label', 'KNOWLEDGE')}</span>
            <h2>{x.title}</h2>
            <p>{x.summary || x.content.slice(0, 140)}</p>
            <small>{x.publishedAt ? new Date(x.publishedAt).toLocaleDateString('zh-CN') : ''}</small>{Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags">{x.tags.slice(0,4).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}
            <b>{getPageValue(page, 'cards', 'ctaText', '阅读全文 →')}</b>
          </Link>)}
        </div>
        {!items.length && <div className="empty-public">{getPageValue(page, 'empty', 'text', '暂无已发布文章，可在 CMS 后台维护。')}</div>}
      </div>
    </section>
    <PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty']} />
    <SiteFooter />
  </main>;
}
