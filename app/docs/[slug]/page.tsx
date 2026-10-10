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
  const x = await prisma.tutorial.findFirst({ where: { slug, status: 'PUBLISHED' } });
  return { title: x?.seoTitle || `${x?.title || '教程'}｜豫辉 AI超级员工`, description: x?.seoDescription || x?.description || '豫辉 AI超级员工使用教程。' };
}

export default async function TutorialDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [x, cms] = await Promise.all([
    prisma.tutorial.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { category: true } }),
    getPage('docs'),
  ]);
  if (!x) notFound();
  const detail = getPageData(cms, 'detail');
  const videoResolved = await resolvePublicAsset(x.videoUrl);
  const video = x.videoUrl ? { ...videoResolved, type: 'VIDEO' } : videoResolved;

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="container inner-hero-inner">
          <ResourceBackLink href="/docs">返回使用教程</ResourceBackLink>
          <span className="section-kicker resource-back-kicker">{detail.kicker || 'TUTORIAL'} / {x.category?.name || 'DOCS'}</span>
          <h1>{x.title}</h1>
          <p>{x.description}</p>
        </div>
      </section>
      <section className="public-section">
        <div className="container detail-content resource-detail-layout">
          {x.coverImage && <img className="detail-cover" src={x.coverImage} alt={x.title} />}
          <div className="rich-content">{x.content || detail.emptyContent || '教程内容正在完善。'}</div>
          {video.url && (
            <div className="resource-detail-media">
              <div className="resource-detail-media-label"><span>VIDEO</span><strong>在线播放教程</strong><small>{video.mimeType || '视频资源'}{x.duration ? ` · ${Math.ceil(x.duration / 60)} 分钟` : ''}</small></div>
              <ResourceViewer url={video.url} name={video.name || x.title} mimeType={video.mimeType} type="VIDEO" poster={x.coverImage} title={x.title} />
            </div>
          )}
          {!video.url && x.videoUrl && <div className="video-unavailable-note">视频地址当前不可用，请在后台重新选择或上传视频资源。</div>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
