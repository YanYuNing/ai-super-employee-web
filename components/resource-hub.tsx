import Link from 'next/link';

export type HubItem = {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  meta?: string;
};

export type ResourceHubBlock = {
  key: 'skills' | 'prompts' | 'guides' | 'downloads' | 'materials';
  label: string;
  title: string;
  description: string;
  href: string;
  count: number;
  items: HubItem[];
  enabled?: boolean;
};

type Props = {
  blocks: ResourceHubBlock[];
  variant?: 'page' | 'home';
};

const blockMeta: Record<ResourceHubBlock['key'], { icon: string; eyebrow: string; stage: string }> = {
  skills: { icon: '✦', eyebrow: 'CAPABILITY / SKILLS', stage: '能力库' },
  prompts: { icon: '⌘', eyebrow: 'EXPRESSION / PROMPT', stage: '表达库' },
  guides: { icon: '→', eyebrow: 'ONBOARDING / GUIDES', stage: '上手区' },
  downloads: { icon: '↓', eyebrow: 'DELIVERY / DOWNLOADS', stage: '交付区' },
  materials: { icon: '◫', eyebrow: 'INSIGHT / MATERIALS', stage: '资料区' },
};

function Block({ block, variant }: { block: ResourceHubBlock; variant: 'page' | 'home' }) {
  const primary = ['skills', 'prompts', 'guides'].includes(block.key);
  const visibleItems = block.items.slice(0, variant === 'home' ? 3 : (primary ? 4 : 3));
  const meta = blockMeta[block.key];

  return (
    <section className={`resource-center-block resource-center-block-${block.key}`}>
      <div className="resource-center-block-head">
        <div className="resource-center-block-identity">
          <span className="resource-center-block-icon" aria-hidden="true">{meta.icon}</span>
          <div>
            <span className="resource-center-block-label">{meta.eyebrow}</span>
            <div className="resource-center-block-title-row">
              <h2>{block.title}</h2>
              <span className="resource-center-block-count">{block.count}</span>
            </div>
            <span className="resource-center-block-stage">{meta.stage}</span>
          </div>
        </div>
        <Link href={block.href} className="resource-center-block-more" aria-label={`查看全部：${block.title}`}>
          全部 <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <p className="resource-center-block-description">{block.description}</p>

      <div className="resource-center-items">
        {visibleItems.length ? visibleItems.map((item, index) => (
          <Link href={item.href} className="resource-center-item" key={item.id} aria-label={`打开：${item.title}`}>
            <div className="resource-center-item-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="resource-center-item-main">
              <div className="resource-center-item-meta">{item.meta || block.label}</div>
              <h3>{item.title}</h3>
              <p>{item.description || '进入资源详情，快速开始使用。'}</p>
            </div>
            <span className="resource-center-item-arrow" aria-hidden="true">↗</span>
          </Link>
        )) : (
          <div className="resource-center-empty">
            <strong>暂无已发布内容</strong>
            <span>后台发布后，这里会自动显示对应资源。</span>
          </div>
        )}
      </div>
      <Link href={block.href} className="resource-center-block-footer">进入 {block.title} <span>→</span></Link>
    </section>
  );
}

export default function ResourceHub({ blocks, variant = 'page' }: Props) {
  const enabledBlocks = blocks.filter((block) => block.enabled !== false);
  const primaryBlocks = enabledBlocks.filter((block) => ['skills', 'prompts', 'guides'].includes(block.key));
  const secondaryBlocks = enabledBlocks.filter((block) => !['skills', 'prompts', 'guides'].includes(block.key));

  return (
    <div className={`resource-center-hub resource-center-hub-${variant}`}>
      <div className="resource-center-primary">
        {primaryBlocks.map((block) => <Block key={block.key} block={block} variant={variant} />)}
      </div>
      {secondaryBlocks.length > 0 && (
        <div className="resource-center-secondary">
          {secondaryBlocks.map((block) => <Block key={block.key} block={block} variant={variant} />)}
        </div>
      )}
    </div>
  );
}
