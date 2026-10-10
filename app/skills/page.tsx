import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceBackLink from '@/components/resource-back-link';
import { getPage, getSiteSetting } from '@/lib/public-site';
import { getPageValue } from '@/lib/public-page';
import { isLikelyImageSource } from '@/lib/media';
import MediaImage from '@/components/public/media-image';
import { prisma } from '@/lib/prisma';
import PublicExtraSections from '@/components/public/page-extra-sections';

export async function generateMetadata(): Promise<Metadata> {
  const [s, page] = await Promise.all([getSiteSetting(), getPage('skills')]);
  return { title: page?.seoTitle || `Skills 技能中心｜${s?.siteName || '豫辉 AI超级员工'}`, description: page?.seoDescription || page?.description || '沉淀可复用的 AI 工作能力与自动化技能。' };
}

export default async function Skills() {
  const [items, page] = await Promise.all([
    prisma.skill.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
    getPage('skills'),
  ]);
  return <main className="public-page"><SiteHeader dark /><section className="inner-hero inner-hero-light"><div className="inner-hero-grid"/><div className="container inner-hero-inner"><ResourceBackLink /><span className="section-kicker resource-back-kicker">{getPageValue(page,'hero','kicker','SKILLS')}</span><h1>{page?.title || 'Skills 技能中心'}</h1><p>{page?.description || '沉淀可复用的 AI 工作能力，让能力可以被持续调用、复用与迭代。'}</p></div></section><section className="public-section"><div className="container"><div className="resource-public-grid">{items.map(x => <Link key={x.id} href={`/skills/${x.slug}`} className="resource-public-card resource-public-card-rich">{x.coverImage && isLikelyImageSource(x.coverImage) ? <MediaImage src={x.coverImage} alt={x.name} className="resource-card-cover" fallback={null} /> : <div className="resource-card-icon">{x.icon || 'AI'}</div>}<span>{getPageValue(page,'cards','versionPrefix','SKILL')} · v{x.version || '—'}</span><h2>{x.name}</h2><p>{x.description || getPageValue(page,'cards','description','暂无简介')}</p>{Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags">{x.tags.slice(0,4).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}<b>{getPageValue(page,'cards','ctaText','查看技能 →')}</b></Link>)}</div>{!items.length && <div className="empty-public">{getPageValue(page,'empty','text','暂未发布 Skill，可在 CMS 后台进行发布。')}</div>}</div></section><PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty']} /><SiteFooter /></main>;
}
