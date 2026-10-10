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
  const [s, page] = await Promise.all([getSiteSetting(), getPage('prompts')]);
  return { title: page?.seoTitle || `Prompt 提示词中心｜${s?.siteName || '豫辉 AI超级员工'}`, description: page?.seoDescription || page?.description || '官方整理 AI 创作与营销提示词模板。' };
}

export default async function Prompts() {
  const [items, page] = await Promise.all([
    prisma.prompt.findMany({ where: { status: 'PUBLISHED' }, orderBy: { updatedAt: 'desc' }, include: { category: true } }),
    getPage('prompts'),
  ]);
  return <main className="public-page"><SiteHeader dark /><section className="inner-hero inner-hero-light"><div className="inner-hero-grid"/><div className="container inner-hero-inner"><ResourceBackLink /><span className="section-kicker resource-back-kicker">{getPageValue(page,'hero','kicker','PROMPTS')}</span><h1>{page?.title || 'Prompt 提示词中心'}</h1><p>{page?.description || '把已经验证过的任务表达方式沉淀下来，让 AI 工作流更容易复用。'}</p></div></section><section className="public-section"><div className="container"><div className="resource-public-grid">{items.map(x => <Link key={x.id} href={`/prompts/${x.slug}`} className="resource-public-card"><span>{x.category?.name || getPageValue(page,'cards','label','PROMPT')} · {x.model || getPageValue(page,'cards','modelFallback','通用模型')}</span><h2>{x.title}</h2><p>{x.description || getPageValue(page,'cards','description','官方提示词模板')}</p>{Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags">{x.tags.slice(0,4).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}<b>{getPageValue(page,'cards','ctaText','查看 Prompt →')}</b></Link>)}</div>{!items.length && <div className="empty-public">{getPageValue(page,'empty','text','暂未发布 Prompt，可在 CMS 后台进行发布。')}</div>}</div></section><PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty']} /><SiteFooter /></main>;
}
