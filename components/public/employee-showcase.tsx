import Link from 'next/link';
import MediaImage from '@/components/public/media-image';
import type { EmployeeShowcaseItem } from '@/lib/employee-showcase';
import styles from './employee-showcase.module.css';

type Props = {
  title?: string | null;
  subtitle?: string | null;
  kicker?: string | null;
  items?: EmployeeShowcaseItem[] | unknown;
  button?: { text?: string; url?: string } | null;
  variant?: 'home' | 'page';
};

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export default function EmployeeShowcase({
  title = '看看 AI 数字员工如何工作',
  subtitle = '从内容创作到智能获客，透过真实操作界面，直观了解数字员工如何把岗位能力转化为可执行的工作流程。',
  kicker = 'INSIDE THE AI WORKFORCE',
  items = [],
  button = { text: '了解数字员工能力', url: '/products' },
  variant = 'page',
}: Props) {
  const normalizedItems = Array.isArray(items)
    ? (items as EmployeeShowcaseItem[]).filter((item) => item && item.enabled !== false && String(item.title || '').trim())
    : [];
  const visibleItems = variant === 'home' ? normalizedItems.slice(0, 3) : normalizedItems;
  if (!visibleItems.length) return null;

  return (
    <section id={variant === 'home' ? 'employee-showcase-home' : 'employee-showcase-products'} className={`${styles.section} ${variant === 'home' ? styles.home : styles.page}`} aria-labelledby={`employee-showcase-${variant}-title`}>
      <div className={styles.ambientGrid} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.headingRow}>
          <div className={styles.headingCopy}>
            <span className={styles.kicker}><i />{kicker || 'INSIDE THE AI WORKFORCE'}</span>
            <h2 id={`employee-showcase-${variant}-title`}>{title || '看看 AI 数字员工如何工作'}</h2>
            <p>{subtitle || '从内容创作到智能获客，透过真实操作界面，直观了解数字员工如何把岗位能力转化为可执行的工作流程。'}</p>
          </div>
          <div className={styles.sectionIndex} aria-hidden="true">
            <strong>{String(visibleItems.length).padStart(2, '0')}</strong>
            <span>WORK SCENES</span>
          </div>
        </div>

        <div className={styles.grid}>
          {visibleItems.map((item, index) => {
            const href = String(item.href || '/products');
            const card = (
              <>
                {item.imageUrl ? (
                  <div className={styles.mediaShell}>
                    <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /><span>AI DIGITAL EMPLOYEE / PREVIEW</span><b>•••</b></div>
                    <div className={styles.screenshotFrame}>
                      <MediaImage src={item.imageUrl} alt={item.imageAlt || item.title} className={styles.screenshot} fallback={<div className={styles.imageFallback}><span>AI</span><small>DIGITAL EMPLOYEE</small></div>} />
                    </div>
                    <span className={styles.mediaCorner} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                ) : (
                  <div className={styles.textModeTop} aria-hidden="true">
                    <span className={styles.textModeIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.textModeMark}><i /><i /><i /></span>
                    <span className={styles.textModeWord}>AI EMPLOYEE / CAPABILITY</span>
                  </div>
                )}
                <div className={styles.cardBody}>
                  <span className={styles.category}>{item.category || 'AI DIGITAL EMPLOYEE'}</span>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                  <div className={styles.cardFoot}><span>了解相关能力</span><b aria-hidden="true">↗</b></div>
                </div>
              </>
            );
            return isExternalUrl(href) ? (
              <a className={`${styles.card} ${!item.imageUrl ? styles.textOnly : ''}`} href={href} key={item.id || `${item.title}-${index}`} target="_blank" rel="noreferrer">{card}</a>
            ) : (
              <Link className={`${styles.card} ${!item.imageUrl ? styles.textOnly : ''}`} href={href} key={item.id || `${item.title}-${index}`}>{card}</Link>
            );
          })}
        </div>

        {button?.text && <div className={styles.footerLink}><Link href={button.url || '/products'}>{button.text}<span>↗</span></Link></div>}
      </div>
    </section>
  );
}
