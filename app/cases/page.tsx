import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';
import PublicExtraSections from '@/components/public/page-extra-sections';
import { getPageValue } from '@/lib/public-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('cases');
  return { title: page?.seoTitle || '客户案例｜豫辉 AI超级员工', description: page?.seoDescription || page?.description || '查看后台发布的豫辉 AI超级员工客户案例与应用场景。' };
}

export default async function Cases() {
  const [items, page] = await Promise.all([
    prisma.caseStudy.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
    getPage('cases'),
  ]);
  return <main className="public-page"><SiteHeader dark/><section className="inner-hero inner-hero-light"><div className="container inner-hero-inner"><span className="section-kicker">{getPageValue(page,'hero','kicker','CASES')}</span><h1>{page?.title || '客户案例'}</h1><p>{page?.description || '案例内容由后台统一维护，发布后首页与案例中心自动同步。'}</p></div></section><section className="public-section"><div className="container"><div className="case-public-grid">{items.map(x=><Link href={`/cases/${x.slug}`} className="case-public-card" key={x.id}>{x.coverImage&&<img src={x.coverImage} alt={x.title}/>}<div><span>{x.industry||getPageValue(page,'cards','tag','企业案例')}</span><h2>{x.title}</h2><p>{x.description||x.companyName||getPageValue(page,'cards','description','查看案例详情')}</p></div></Link>)}</div>{!items.length&&<div className="empty-public">{getPageValue(page,'empty','text','后台暂未发布客户案例。')}</div>}</div></section><PublicExtraSections page={page} reservedKeys={['hero','cards','empty','detail']} /><SiteFooter/></main>;
}
