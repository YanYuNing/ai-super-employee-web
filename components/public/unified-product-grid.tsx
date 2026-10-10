import Link from 'next/link';
import MediaImage from '@/components/public/media-image';
import { isLikelyImageSource } from '@/lib/media';
import { getEmployeeShowcaseProductSlug, type EmployeeShowcaseItem } from '@/lib/employee-showcase';
import { getPublicProductSlug } from '@/lib/product-routing';
import styles from './unified-product-grid.module.css';

type ProductFeature = { id?: string | number; name: string };
type ProductCardData = {
  id: string | number;
  slug: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  features?: ProductFeature[];
};

type Props = {
  products: ProductCardData[];
  scenes: EmployeeShowcaseItem[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  tagFallback?: string;
  ctaText?: string;
  emptyText?: string;
};

function safeScenes(items: EmployeeShowcaseItem[]) {
  return Array.isArray(items)
    ? items.filter((item) => item && item.enabled !== false && String(item.title || '').trim())
    : [];
}

export default function UnifiedProductGrid({ products, scenes, title = '看看 AI 数字员工如何工作', subtitle = '从内容创作到智能获客，透过真实操作界面，直观了解数字员工如何把岗位能力转化为可执行的工作流程。', kicker = 'AI DIGITAL WORKFORCE / CAPABILITY MAP', tagFallback = 'AI数字员工', ctaText = '查看能力', emptyText = '后台暂未发布产品。' }: Props) {
  const activeScenes = safeScenes(scenes);
  if (!products.length) return <div className={styles.empty}>{emptyText}</div>;

  return (
    <section className={styles.section} id="employee-showcase-products" aria-labelledby="unified-product-grid-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={styles.headingCopy}>
            <span className={styles.kicker}><i /> {kicker}</span>
            <h2 id="unified-product-grid-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className={styles.stats}>
            <strong>{String(products.length).padStart(2, '0')}</strong>
            <span>AI EMPLOYEE ROLES</span>
            <small>能力介绍 · 操作场景 · 工作流程</small>
          </div>
        </div>

        <div className={styles.grid}>
          {products.map((product, index) => {
            const publicSlug = getPublicProductSlug(product);
            const relatedScenes = activeScenes.filter((scene) => getEmployeeShowcaseProductSlug(scene) === publicSlug);
            const primaryScene = relatedScenes.find((scene) => String(scene.imageUrl || '').trim()) || relatedScenes[0];
            const extraScenes = relatedScenes.filter((scene) => scene !== primaryScene).slice(0, 3);
            const primaryImage = primaryScene ? String(primaryScene.imageUrl || '').trim() : String(product.coverImage || '').trim();
            const iconIsImage = isLikelyImageSource(product.icon);
            const iconMark = iconIsImage ? null : (String(product.icon || '').trim() || 'AI');
            return (
              <Link className={styles.card} href={`/products/${getPublicProductSlug(product)}`} key={product.id}>
                <div className={styles.cardGlow} aria-hidden="true" />
                <div className={styles.cardHead}>
                  <span className={styles.index}>{String(index + 1).padStart(2, '0')} <i> / </i> DIGITAL EMPLOYEE</span>
                  <span className={styles.status}><i /> CAPABILITY ONLINE</span>
                </div>

                <div className={styles.visual}>
                  <div className={styles.browserBar} aria-hidden="true">
                    <span className={styles.browserDots}><i /><i /><i /></span>
                    <span>AI EMPLOYEE / WORK SCENE</span>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                  </div>
                  <div className={`${styles.visualViewport} ${primaryImage ? styles.hasImage : styles.noImage}`}>
                    {primaryImage ? (
                      <MediaImage src={primaryImage} alt={primaryScene?.imageAlt || `${product.name}操作界面`} className={styles.productScreenshot} fallback={<div className={styles.noImageInner}><span>{iconMark || 'AI'}</span><small>AI DIGITAL EMPLOYEE</small></div>} />
                    ) : (
                      <div className={styles.noImageInner}>
                        {iconIsImage ? <MediaImage src={product.icon} alt="" className={styles.iconImage} fallback={<span>AI</span>} /> : <span>{iconMark}</span>}
                        <small>{primaryScene?.category || 'AI DIGITAL EMPLOYEE'}</small>
                        <em aria-hidden="true">{String(index + 1).padStart(2, '0')}</em>
                      </div>
                    )}
                    {primaryImage && <span className={styles.imageLabel}>{primaryScene?.category || product.shortName || 'AI WORK SCENE'}</span>}
                  </div>
                </div>

                <div className={styles.body}>
                  <div className={styles.metaRow}>
                    <span className={styles.productTag}>{product.shortName || tagFallback}</span>
                    {primaryScene?.category && <span className={styles.sceneTag}>{primaryScene.category}</span>}
                  </div>
                  <h3>{product.name}</h3>
                  <p className={styles.description}>{product.description || '围绕企业营销任务提供可组合、可协同的 AI 数字员工能力。'}</p>

                  {primaryScene && (
                    <div className={styles.sceneSummary}>
                      <span><i /> WORK SCENE</span>
                      <strong>{primaryScene.title}</strong>
                      {primaryScene.description && <p>{primaryScene.description}</p>}
                    </div>
                  )}

                  {extraScenes.length > 0 && (
                    <div className={styles.relatedScenes} aria-label="更多工作现场">
                      {extraScenes.map((scene) => (
                        <div className={styles.relatedScene} key={scene.id} title={scene.title}>
                          {scene.imageUrl ? <MediaImage src={scene.imageUrl} alt={scene.imageAlt || scene.title} className={styles.relatedImage} fallback={<span>AI</span>} /> : <span className={styles.relatedTextIcon}>Aa</span>}
                          <span>{scene.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!!product.features?.length && (
                    <div className={styles.features}>
                      {product.features.slice(0, 3).map((feature, featureIndex) => <span key={feature.id ?? `${product.slug}-feature-${featureIndex}`}>{feature.name}</span>)}
                    </div>
                  )}
                  <div className={styles.cardFoot}><span>{ctaText}</span><b aria-hidden="true">↗</b></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
