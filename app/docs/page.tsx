import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceBackLink from '@/components/resource-back-link';
import { prisma } from '@/lib/prisma';
import { getPage, getSiteSetting } from '@/lib/public-site';
import { getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';

export async function generateMetadata(): Promise<Metadata> {
  const [s, page] = await Promise.all([getSiteSetting(), getPage('docs')]);
  return { title: page?.seoTitle || `使用教程｜${s?.siteName || '豫辉 AI超级员工'}`, description: page?.seoDescription || page?.description || 'AI Claw、AI短视频、AI混剪、IP智能体、GEO与客服产品使用教程。' };
}

export default async function Docs() {
  const [items, page] = await Promise.all([
    prisma.tutorial.findMany({ where: { status: 'PUBLISHED' }, include: { category: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
    getPage('docs'),
  ]);
  return <main className="public-page"><SiteHeader dark/><section className="inner-hero inner-hero-light"><div className="container inner-hero-inner"><span className="section-kicker">{getPageValue(page,'hero','kicker','DOCS / TUTORIALS')}</span><h1>{page?.title || '使用教程'}</h1><p>{page?.description || '产品操作、AI Claw 与各个 AI 超级员工的教程，由 CMS 后台统一发布。'}</p></div></section><section className="public-section"><div className="container"><div className="resource-public-grid">{items.map(x=><Link href={`/docs/${x.slug}`} className="resource-public-card" key={x.id}><span>{x.category?.name||getPageValue(page,'cards','label','教程')}</span><h2>{x.title}</h2><p>{x.description}</p>{Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags">{x.tags.slice(0,4).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}<b>{getPageValue(page,'cards','ctaText','查看教程 →')}</b></Link>)}</div>{!items.length&&<div className="empty-public">{getPageValue(page,'empty','text','后台暂未发布教程。进入 CMS → 内容中心 → 教程，即可发布。')}</div>}</div></section><PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty']} /><SiteFooter/></main>;
}
