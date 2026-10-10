import Link from 'next/link';
import type { ReactNode } from 'react';
import { jsonObject } from '@/lib/public-site';
import type { PublicPage } from '@/lib/public-page';

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function renderItem(item: any, index: number): ReactNode {
  if (typeof item === 'string') return <div className="public-extra-item" key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>;
  if (!item || typeof item !== 'object') return null;
  const title = asText(item.title || item.name || item.label || item.value);
  const text = asText(item.text || item.description || item.desc || item.content);
  return <article className="public-extra-item" key={`${title || 'item'}-${index}`}>
    <span>{item.number || String(index + 1).padStart(2, '0')}</span>
    <div>{title && <h3>{title}</h3>}{text && <p>{text}</p>}</div>
  </article>;
}

export default function PublicExtraSections({
  page,
  reservedKeys = [],
  includePageContent = true,
  kicker = 'CMS / EXTENSION',
}: {
  page: PublicPage;
  reservedKeys?: string[];
  includePageContent?: boolean;
  kicker?: string;
}) {
  const sections = (page?.sections || [])
    .filter((section: any) => section.enabled !== false && !reservedKeys.includes(section.sectionKey))
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  const pageContent = asText(page?.content);
  const meaningfulContent = pageContent && !/^(010+|0{4,32}|1{4,32})$/.test(pageContent);

  if (!sections.length && !(includePageContent && meaningfulContent)) return null;

  return <>
    {includePageContent && meaningfulContent && (
      <section className="public-section cms-public-page-content-section">
        <div className="container cms-public-page-content">
          <span className="section-kicker">PAGE CONTENT</span>
          <div className="rich-content">{pageContent}</div>
        </div>
      </section>
    )}
    {!!sections.length && <section className="public-section public-extra-section">
      <div className="container">
        <div className="public-extra-heading">
          <span className="section-kicker">{kicker}</span>
          <h2>更多内容</h2>
          <p>该页面的扩展区块由 CMS 后台统一维护，保存后直接同步到用户端。</p>
        </div>
        <div className="public-extra-grid">
          {sections.map((section: any) => {
            const data = jsonObject(section.data);
            const items = Array.isArray(data.items) ? data.items : [];
            const primary = data.button || data.primaryButton;
            const title = asText(section.title || data.title || data.heading);
            const subtitle = asText(section.subtitle || data.subtitle || data.description);
            const imageUrl = asText(section.imageUrl || data.imageUrl || data.image);
            const videoUrl = asText(section.videoUrl || data.videoUrl || data.video);
            const content = asText(section.content || data.content || data.text);
            const kickerText = asText(data.kicker || section.sectionKey);
            return <article className="public-extra-card" key={section.id || section.sectionKey}>
              {kickerText && <span className="section-kicker">{kickerText}</span>}
              {title && <h2>{title}</h2>}
              {subtitle && <p className="public-extra-subtitle">{subtitle}</p>}
              {imageUrl && <img src={imageUrl} alt={title || ''} />}
              {videoUrl && <video src={videoUrl} controls playsInline preload="metadata" />}
              {content && <div className="public-extra-copy">{content}</div>}
              {items.length > 0 && <div className="public-extra-items">{items.slice(0, 12).map(renderItem)}</div>}
              {primary?.text && <Link href={primary.url || '#'} className="button button-secondary">{primary.text} <span>→</span></Link>}
            </article>;
          })}
        </div>
      </div>
    </section>}
  </>;
}
