import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceBackLink from '@/components/resource-back-link';
import { prisma } from '@/lib/prisma';
import ResourceViewer from '@/components/resource-viewer';
import { getPage } from '@/lib/public-site';
import { getPageData } from '@/lib/public-page';
import { resolvePublicAsset } from '@/lib/public-asset';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = await prisma.resource.findFirst({ where: { slug, status: 'PUBLISHED' } });
  return { title: x?.seoTitle || `${x?.title || '资源'}｜豫辉 AI超级员工`, description: x?.seoDescription || x?.description || '豫辉 AI超级员工资源中心。' };
}

export default async function ResourceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [x, cms] = await Promise.all([
    prisma.resource.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { category: true } }),
    getPage('resources'),
  ]);
  if (!x) notFound();
  const detail = getPageData(cms, 'detail');
  const [fileAsset, configuredVideoAsset] = await Promise.all([
    resolvePublicAsset(x.fileUrl),
    resolvePublicAsset(x.videoUrl),
  ]);
  const resolvedVideoAsset = x.videoUrl
    ? { ...configuredVideoAsset, type: 'VIDEO' }
    : fileAsset.type === 'VIDEO'
      ? fileAsset
      : null;
  const resolvedFileAsset = fileAsset.url && fileAsset.url !== resolvedVideoAsset?.url ? fileAsset : null;

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="container inner-hero-inner">
          <ResourceBackLink href="/resources/library">返回行业资料与资源</ResourceBackLink>
          <span className="section-kicker resource-back-kicker">{detail.kicker || 'RESOURCE'} / {x.category?.name || 'RESOURCE'}</span>
          <h1>{x.title}</h1>
          <p>{x.description}</p>
        </div>
      </section>
      <section className="public-section">
        <div className="container detail-content resource-detail-layout">
          {x.coverImage && <img className="detail-cover" src={x.coverImage} alt={x.title} />}
          <div className="rich-content">{x.content || detail.emptyContent || '资源内容正在持续完善。'}</div>
          {resolvedVideoAsset?.url && (
            <div className="resource-detail-media">
              <div className="resource-detail-media-label"><span>VIDEO</span><strong>在线播放</strong><small>{resolvedVideoAsset.mimeType || '视频资源'}</small></div>
              <ResourceViewer url={resolvedVideoAsset.url} name={resolvedVideoAsset.name || x.title} mimeType={resolvedVideoAsset.mimeType} type="VIDEO" poster={x.coverImage} title={x.title} />
            </div>
          )}
          {resolvedFileAsset?.url && (
            <div className="resource-detail-attachment">
              <div className="resource-detail-attachment-head">
                <div><span className="section-kicker">ATTACHMENT</span><h2>资料附件</h2><p>{resolvedFileAsset.name || x.title}</p></div>
                <a href={resolvedFileAsset.url} download className="button button-secondary">下载附件 →</a>
              </div>
              <ResourceViewer url={resolvedFileAsset.url} name={resolvedFileAsset.name || x.title} mimeType={resolvedFileAsset.mimeType} type={resolvedFileAsset.type} poster={x.coverImage} title={x.title} />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
