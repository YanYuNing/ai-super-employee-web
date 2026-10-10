import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage, jsonObject } from '@/lib/public-site';
import { getPageData } from '@/lib/public-page';
import MediaImage from '@/components/public/media-image';
import ResourceViewer from '@/components/resource-viewer';
import { resolvePublicAsset } from '@/lib/public-asset';
import { isLikelyImageSource } from '@/lib/media';
import { getEmployeeShowcaseProductSlug, type EmployeeShowcaseItem } from '@/lib/employee-showcase';
import { getLegacyProductIdForPublicSlug, getLegacyProductNamesForPublicSlug, getPublicProductSlug } from '@/lib/product-routing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function findActiveProductByPublicSlug(slug: string, withFeatures = false): Promise<any | null> {
  const include = { features: { orderBy: { sortOrder: 'asc' as const } } };
  const direct = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    ...(withFeatures ? { include } : {}),
  });
  if (direct) return direct;

  // Keep old records reachable when their stored slug was malformed (e.g. ".." for 地图获客).
  const legacyNames = getLegacyProductNamesForPublicSlug(slug);
  if (legacyNames.length) {
    const byName = await prisma.product.findFirst({
      where: { name: { in: legacyNames }, status: 'ACTIVE' },
      ...(withFeatures ? { include } : {}),
    });
    if (byName) return byName;
  }

  const legacyId = getLegacyProductIdForPublicSlug(slug);
  if (legacyId) {
    return prisma.product.findFirst({
      where: { id: legacyId, status: 'ACTIVE' },
      ...(withFeatures ? { include } : {}),
    });
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await findActiveProductByPublicSlug(slug);
  return { title: p?.seoTitle || `${p?.name || 'AI员工'}｜豫辉 AI超级员工`, description: p?.seoDescription || p?.description || '豫辉 AI超级员工产品能力。' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await findActiveProductByPublicSlug(slug, true);
  if (!p) notFound();
  const [cms, relatedProducts] = await Promise.all([
    getPage('products'),
    prisma.product.findMany({ where: { status: 'ACTIVE', id: { not: p.id } }, include: { features: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' }, take: 3 }),
  ]);

  const detail = getPageData(cms, 'detail');
  const showcaseSection = cms?.sections?.find((section: any) => section.sectionKey === 'showcase');
  const showcaseData = jsonObject(showcaseSection?.data);
  const showcaseItems = showcaseSection && showcaseSection.enabled !== false && Array.isArray(showcaseData.items)
    ? showcaseData.items.filter((item: any) => item && item.enabled !== false && String(item.title || '').trim()) as EmployeeShowcaseItem[]
    : [];
  const canonicalProductSlug = getPublicProductSlug(p);
  const productScenes = showcaseItems.filter((scene) => getEmployeeShowcaseProductSlug(scene) === canonicalProductSlug);
  const primaryScene = productScenes.find((scene) => String(scene.imageUrl || '').trim()) || productScenes[0];
  const productVideoResolved = await resolvePublicAsset(p.videoUrl);
  const productVideo = p.videoUrl ? { ...productVideoResolved, type: 'VIDEO' } : productVideoResolved;
  const featureSteps = p.features.slice(0, 3);
  const hasHeroImage = Boolean(primaryScene?.imageUrl || p.coverImage);

  return (
    <main className="public-page employee-product-detail-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light product-detail-hero">
        <div className="inner-hero-grid" aria-hidden="true" />
        <div className="container product-detail-hero-grid">
          <div className="product-detail-hero-copy">
            <span className="section-kicker">{detail.kicker || 'AI DIGITAL EMPLOYEE / ROLE PROFILE'}</span>
            <div className="product-detail-meta"><span>AI DIGITAL WORKFORCE</span><span><i /> 岗位能力已整理</span></div>
            <h1>{p.name}</h1>
            <p>{p.description || `围绕${p.name}组织可执行的 AI 工作流程，帮助团队把分散操作转化为清晰、可复用的岗位能力。`}</p>
            <div className="product-detail-tags">
              {(p.features.length ? p.features.slice(0, 4).map((feature: { name: string }) => feature.name) : [p.shortName || 'AI数字员工', '岗位化执行', '团队协同']).map((tag: string, index: number) => <span key={`${tag}-${index}`}>{tag}</span>)}
            </div>
            <div className="inner-hero-actions">
              <Link href={detail.primary?.url || '/contact'} className="button button-primary">{detail.primary?.text || '预约演示'} <span>↗</span></Link>
              <Link href={detail.secondary?.url || '/products'} className="button button-secondary">{detail.secondary?.text || '返回产品中心'}</Link>
            </div>
            <div className="product-detail-proof"><span><b>01</b> 明确岗位职责</span><span><b>02</b> 组合核心能力</span><span><b>03</b> 融入营销流程</span></div>
          </div>

          <div className="product-detail-hero-visual">
            <div className="product-scene-window">
              <div className="product-scene-window-bar"><span><i /><i /><i /></span><small>AI EMPLOYEE / WORK SCENE</small><b>{String(productScenes.length || 1).padStart(2, '0')}</b></div>
              <div className={`product-scene-window-screen${hasHeroImage ? ' has-image' : ' no-image'}`}>
                {primaryScene?.imageUrl ? <MediaImage src={primaryScene.imageUrl} alt={primaryScene.imageAlt || primaryScene.title || p.name} className="product-scene-window-image" fallback={<div className="product-scene-placeholder"><strong>{p.shortName || 'AI'}</strong><span>DIGITAL WORKFLOW</span></div>} /> : p.coverImage ? <MediaImage src={p.coverImage} alt={p.name} className="product-scene-window-image" fallback={<div className="product-scene-placeholder"><strong>{p.shortName || 'AI'}</strong><span>DIGITAL WORKFLOW</span></div>} /> : <div className="product-scene-placeholder"><div className="product-scene-orbit" /><strong>{isLikelyImageSource(p.icon) ? 'AI' : (p.icon || 'AI')}</strong><span>AI DIGITAL EMPLOYEE</span><small>ROLE / {canonicalProductSlug.toUpperCase()}</small></div>}
                <span className="product-scene-window-index">ROLE  /  {canonicalProductSlug.toUpperCase()}</span>
              </div>
              <div className="product-scene-window-copy"><span><i /> WORK SCENE</span><strong>{primaryScene?.title || `${p.name} · 岗位工作现场`}</strong><p>{primaryScene?.description || '用真实业务场景理解岗位如何工作，并将能力融入团队协作。'}</p></div>
            </div>
            <div className="product-detail-float-chip"><i /> <span>AI ROLE PROFILE</span><b>{p.shortName || p.name}</b></div>
          </div>
        </div>
      </section>

      {productScenes.length > 0 && <section className="employee-detail-scenes">
        <div className="container">
          <div className="employee-detail-section-heading"><div><span className="section-kicker">INSIDE THE WORKFLOW</span><h2>真实工作现场</h2><p>从操作界面、关键步骤到业务结果，看看 {p.name} 如何把岗位能力落实到具体流程。</p></div><span className="employee-detail-count"><strong>{String(productScenes.length).padStart(2, '0')}</strong><small>WORK SCENES</small></span></div>
          <div className="employee-detail-scene-grid">
            {productScenes.map((scene, index) => <article className="employee-detail-scene-card" key={scene.id || `${scene.title}-${index}`}>
              <div className="employee-detail-screen">
                <div className="employee-detail-screen-bar"><span><i /><i /><i /></span><small>{scene.category || p.name}</small><b>{String(index + 1).padStart(2, '0')}</b></div>
                {scene.imageUrl ? <MediaImage src={scene.imageUrl} alt={scene.imageAlt || scene.title} className="employee-detail-scene-image" fallback={<div className="employee-detail-scene-fallback">AI / WORKFLOW</div>} /> : <div className="employee-detail-scene-fallback"><strong>{String(index + 1).padStart(2, '0')}</strong><span>AI DIGITAL WORKFLOW</span></div>}
              </div>
              <div className="employee-detail-scene-copy"><span>{scene.category || '岗位场景'}</span><h3>{scene.title}</h3><p>{scene.description || `围绕${p.name}的岗位目标组织操作步骤，帮助团队更清晰地理解和复用工作方式。`}</p></div>
            </article>)}
          </div>
        </div>
      </section>}

      <section className="public-section employee-detail-capabilities">
        <div className="container detail-content">
          <div className="employee-detail-section-heading light-heading"><div><span className="section-kicker">CAPABILITY MODULES</span><h2>{detail.capabilitiesTitle || '核心能力'}</h2><p>把能力拆解成可以理解、组合和持续优化的工作模块。</p></div><span className="employee-detail-count"><strong>{String(p.features.length).padStart(2, '0')}</strong><small>CAPABILITIES</small></span></div>
          {p.features.length ? <div className="public-feature-grid employee-detail-feature-grid">{p.features.map((feature: { id: number; name: string; description: string | null }, index: number) => <div key={feature.id}><span className="employee-feature-number">{String(index + 1).padStart(2, '0')}</span><strong>{feature.name}</strong><p>{feature.description || `围绕${feature.name}构建岗位能力，为${p.name}的工作流程提供支持。`}</p></div>)}</div> : <div className="rich-content">{p.content || detail.emptyContent || '产品能力正在由后台内容中心持续完善。'}</div>}
          {p.content && p.features.length > 0 && <div className="rich-content employee-detail-rich-content"><h2>{detail.contentTitle || '岗位介绍'}</h2><p>{p.content}</p></div>}
        </div>
      </section>

      <section className="employee-detail-workflow">
        <div className="container">
          <div className="employee-detail-section-heading"><div><span className="section-kicker">FROM TASK TO DELIVERY</span><h2>如何融入企业营销工作流</h2><p>{p.name} 不是孤立工具，而是营销链路中可被调用、可与其他岗位配合的能力节点。</p></div></div>
          <div className="employee-detail-workflow-grid">
            {(featureSteps.length ? featureSteps : [{ name: '理解业务目标', description: '明确任务对象、输入素材与期望结果。' }, { name: '调用岗位能力', description: `由${p.name}执行对应操作，形成清晰的工作步骤。` }, { name: '交付并持续优化', description: '将结果交给团队复核，再进入下一阶段营销动作。' }]).map((step: any, index: number) => <article key={step.id || `${step.name}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div className="employee-workflow-line" /><h3>{index === 0 ? '明确目标 / 输入' : index === 1 ? '执行岗位能力' : '沉淀结果 / 协同'}</h3><strong>{step.name}</strong><p>{step.description || `将${step.name}纳入${p.name}的工作步骤。`}</p></article>)}
          </div>
          <div className="employee-detail-cta"><div><span className="section-kicker">BUILD YOUR AI WORKFORCE</span><h2>让 {p.name} 成为你的营销团队一员</h2><p>结合业务需求，了解合适的岗位组合与落地方式。</p></div><Link href="/contact" className="button button-primary">预约专属演示 <span>↗</span></Link></div>
        </div>
      </section>

      {productVideo.url && <section className="public-section employee-detail-video-section"><div className="container"><div className="product-detail-video">
        <span className="section-kicker">PRODUCT VIDEO</span><h2>产品演示</h2><p className="product-detail-video-copy">通过真实演示了解这个 AI 数字员工负责什么、如何工作，以及它如何和其他员工协同。</p>
        <ResourceViewer url={productVideo.url} name={productVideo.name || p.name} mimeType={productVideo.mimeType} type="VIDEO" poster={p.coverImage} title={p.name} />
      </div></div></section>}

      {relatedProducts.length > 0 && <section className="employee-detail-related"><div className="container"><div className="employee-detail-section-heading"><div><span className="section-kicker">MEET THE TEAM</span><h2>与其他数字员工协同</h2><p>把不同岗位组织成一条完整的内容、获客和客户转化链路。</p></div><Link href="/products">查看全部员工 ↗</Link></div><div className="employee-related-grid">{relatedProducts.map((product, index) => <Link href={`/products/${getPublicProductSlug(product)}`} key={product.id} className="employee-related-card"><span>{String(index + 1).padStart(2, '0')} / DIGITAL EMPLOYEE</span><strong>{product.name}</strong><p>{product.description || '与其他 AI 数字员工协同，补齐营销链路中的关键能力。'}</p><b>查看岗位能力 ↗</b></Link>)}</div></div></section>}
      <SiteFooter />
    </main>
  );
}
