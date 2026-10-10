import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage, getPageValue } from '@/lib/public-page';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = await prisma.article.findFirst({ where: { slug, status: 'PUBLISHED' } });
  return { title: x?.seoTitle || `${x?.title || '文章'}｜豫辉 AI超级员工`, description: x?.seoDescription || x?.summary || '豫辉 AI超级员工文章。' };
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [x, page] = await Promise.all([
    prisma.article.findFirst({ where: { slug, status: 'PUBLISHED' } }),
    getPage('articles'),
  ]);
  if (!x) notFound();
  return <main className="public-page">
    <SiteHeader dark />
    <section className="inner-hero inner-hero-light">
      <div className="container inner-hero-inner">
        <Link href="/articles" className="solution-detail-back">← 返回文章列表</Link>
        <span className="section-kicker">{getPageValue(page, 'detail', 'kicker', 'ARTICLE')}</span>
        <h1>{x.title}</h1>
        <p>{x.summary || ''}</p>
        <small className="article-detail-meta">{x.author || getPageValue(page, 'detail', 'authorFallback', '豫辉 AI超级员工')} · {x.publishedAt ? new Date(x.publishedAt).toLocaleDateString('zh-CN') : ''}</small>{Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags">{x.tags.slice(0,8).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}
      </div>
    </section>
    <section className="public-section">
      <div className="container detail-content">
        {x.coverImage && <img className="detail-cover" src={x.coverImage} alt={x.title} />}
        <article className="rich-content">{x.content}</article>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
