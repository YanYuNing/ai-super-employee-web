import type { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceBackLink from '@/components/resource-back-link';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';
import { getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('downloads');
  return { title: page?.seoTitle || '产品下载｜豫辉 AI超级员工', description: page?.seoDescription || page?.description || '豫辉 AI超级员工客户端、Skill、模板与产品资源下载中心。' };
}

export default async function DownloadsPage() {
  const [items, page] = await Promise.all([
    prisma.download.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' }, include: { versions: { where: { isLatest: true }, take: 1 } } }),
    getPage('downloads'),
  ]);
  return <main className="public-page"><SiteHeader dark /><section className="inner-hero inner-hero-light"><div className="inner-hero-grid"/><div className="container inner-hero-inner"><ResourceBackLink /><span className="section-kicker resource-back-kicker">{getPageValue(page,'hero','kicker','DOWNLOADS')}</span><h1>{page?.title || '产品下载中心'}</h1><p>{page?.description || '客户端、Skill、模板与产品资源统一从 CMS 发布与维护。'}</p></div></section><section className="public-section"><div className="container"><div className="resource-public-grid">{items.map(x => { const v = x.versions[0]; return <article key={x.id} className="resource-public-card"><span>{x.platform || getPageValue(page,'cards','platformFallback','通用')} · {v?.version || getPageValue(page,'cards','versionFallback','暂无版本')}</span><h2>{x.name}</h2><p>{x.description || getPageValue(page,'cards','description','产品下载资源')}</p>{v && <div className="download-meta"><a className="button button-primary button-small" href={v.url}>{getPageValue(page,'cards','downloadText','立即下载')}</a>{v.extractionCode && <span>{getPageValue(page,'cards','codePrefix','提取码')}：{v.extractionCode}</span>}</div>}</article>; })}</div>{!items.length && <div className="empty-public">{getPageValue(page,'empty','text','暂无可下载内容。可在 CMS 后台进入下载管理发布版本。')}</div>}</div></section><PublicExtraSections page={page} reservedKeys={['hero','cards','detail','empty']} /><SiteFooter /></main>;
}
