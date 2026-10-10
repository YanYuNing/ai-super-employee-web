import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';
import { getPageData } from '@/lib/public-page';
import ResourceViewer from '@/components/resource-viewer';
import ResourceBackLink from '@/components/resource-back-link';
import { resolvePublicAsset } from '@/lib/public-asset';
import MediaImage from '@/components/public/media-image';
import { isLikelyImageSource } from '@/lib/media';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const x = await prisma.skill.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });

  return {
    title: x?.seoTitle || `${x?.name || 'Skill'}｜豫辉 AI超级员工`,
    description: x?.seoDescription || x?.description || '豫辉 AI超级员工 Skill 技能。',
  };
}

export default async function SkillDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [x, cms] = await Promise.all([
    prisma.skill.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { fileAsset: true },
        },
      },
    }),
    getPage('skills'),
  ]);

  if (!x) notFound();

  const detail = getPageData(cms, 'detail');
  const latestVersion = x.versions.find((version: any) => version.isLatest) || x.versions[0];
  const latestAsset = latestVersion?.fileAsset;
  const resolvedLatestAsset = await resolvePublicAsset(latestAsset?.url);

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="inner-hero-grid" />
        <div className="container inner-hero-inner">
          <ResourceBackLink href="/skills" children="返回 Skills 技能中心" />
          <span className="section-kicker resource-back-kicker">
            {detail.kicker || 'SKILL'} · {x.version || 'LATEST'}
          </span>
          <h1>{x.name}</h1>
          <p>{x.description || detail.descriptionFallback || '可复用的 AI 工作能力。'}</p>
          <div className="inner-hero-actions">
            <Link href={detail.primary?.url || '/contact'} className="button button-primary">
              {detail.primary?.text || '了解部署'}
            </Link>
            <Link href={detail.secondary?.url || '/skills'} className="button button-secondary">
              {detail.secondary?.text || '返回 Skills'}
            </Link>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="container detail-content">
          {(x.coverImage || x.icon) && <div className="skill-detail-visual">{x.coverImage && isLikelyImageSource(x.coverImage) ? <MediaImage src={x.coverImage} alt={x.name} className="skill-detail-cover" fallback={null} /> : <div className="public-product-icon large">{x.icon || 'AI'}</div>}</div>}
          <div className="rich-content">
            <h2>{detail.contentTitle || '技能说明'}</h2>
            {x.content || '暂无内容'}
            {Array.isArray(x.tags) && x.tags.length > 0 && <div className="resource-card-tags skill-detail-tags">{x.tags.slice(0,8).map((tag:any,i:number)=><em key={`${tag}-${i}`}>{String(tag)}</em>)}</div>}
          </div>

          <div className="version-list">
            <h2>{detail.versionsTitle || '版本记录'}</h2>
            {x.versions.map((version: any) => (
              <div className="version-row" key={version.id}>
                <div>
                  <strong>{version.version}</strong>
                  {version.isLatest && <span className="version-badge">{detail.latestText || '最新'}</span>}
                  <p>{version.releaseNotes || detail.versionEmptyText || '暂无更新说明'}</p>
                  {version.fileName && <small>{version.fileName}</small>}
                </div>
                {version.fileUrl && (
                  <a className="button button-small button-primary" href={version.fileUrl}>
                    {detail.downloadText || '下载'}
                  </a>
                )}
              </div>
            ))}
          </div>

          {latestAsset && (
            <div className="skill-package-viewer">
              <div className="section-heading">
                <span className="section-kicker">SKILL PACKAGE</span>
                <h2>{detail.packageTitle || '当前版本 Skill 包'}</h2>
              </div>
              <ResourceViewer
                url={resolvedLatestAsset.url}
                name={resolvedLatestAsset.name || latestAsset?.originalName || latestVersion?.fileName}
                mimeType={resolvedLatestAsset.mimeType || latestAsset?.mimeType}
                type="ARCHIVE"
              />
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
