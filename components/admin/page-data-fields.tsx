'use client';

import { useEffect, useMemo, useState } from 'react';
import AssetPicker from '@/components/admin/asset-picker';
import { EMPLOYEE_SHOWCASE_GALLERY, getEmployeeShowcaseProductSlug } from '@/lib/employee-showcase';

type ShowcaseProductOption = { slug: string; name: string; status?: string };

type ShowcaseGalleryAsset = {
  id: number;
  url: string;
  name: string;
  label: string;
  alt?: string | null;
  isBuiltin?: boolean;
};

type Props = {
  dataText: string;
  onChange: (value: string) => void;
  sectionKey: string;
  allowedKeys?: string[] | null;
  onSave?: () => Promise<boolean>;
  saving?: boolean;
};

const BUTTON_KEYS = ['primaryButton', 'secondaryButton', 'primary', 'secondary', 'button'];
const KEY_LABELS: Record<string, string> = {
  kicker: '英文小标题 / Kicker',
  consoleTitle: '控制台标题',
  consoleStatus: '控制台状态',
  modelFallback: '模型默认文案',
  descriptionFallback: '简介默认文案',
  capabilitiesKicker: '能力区英文标题',
  capabilitiesTitle: '能力区标题',
  contentTitle: '正文区标题',
  usageTitle: '使用方法标题',
  versionsTitle: '版本记录标题',
  latestText: '最新版本文案',
  downloadText: '下载按钮文案',
  emptyContent: '空内容提示',
  emptyText: '空状态文案',
  tag: '卡片标签',
  label: '卡片标签',
  ctaText: '卡片按钮',
  description: '卡片默认描述',
  resourceLabel: '资源标签',
  resourceCta: '资源按钮',
  skillLabel: 'Skill 标签',
  skillCta: 'Skill 按钮',
  promptLabel: 'Prompt 标签',
  promptCta: 'Prompt 按钮',
  versionPrefix: '版本前缀',
  platformFallback: '平台默认文案',
  versionFallback: '版本默认文案',
  codePrefix: '提取码前缀',
};

function prettyKey(key: string) {
  return KEY_LABELS[key] || key;
}

function parseObject(text: string) {
  try {
    const value = JSON.parse(text || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function formatData(value: Record<string, any>) {
  return JSON.stringify(value, null, 2);
}

const defaultProductByScene: Record<string, string> = {
  'video-workflow': 'ai-video', 'image-creation': 'ai-image', 'geo-acquisition': 'geo',
  'workflow-automation': 'ai-lead', 'operations-overview': 'ai-lead', 'platform-accounts': 'ai-lead',
  'video-template': 'ai-mix', 'geo-report': 'geo', 'agent-library': 'ip-agent',
};

export default function PageDataFields({ dataText, onChange, sectionKey, allowedKeys = null, onSave, saving = false }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [galleryAssets, setGalleryAssets] = useState<ShowcaseGalleryAsset[]>([]);
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProductOption[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [expandedShowcaseItems, setExpandedShowcaseItems] = useState<Record<string, boolean>>({});
  const data = useMemo(() => parseObject(dataText), [dataText]);

  const hasKey = (key: string) => !allowedKeys || allowedKeys.includes(key);
  const scalarEntries = Object.entries(data).filter(([key, value]) => hasKey(key) && (value === null || ['string', 'number', 'boolean'].includes(typeof value)));
  const stringArrays = Object.entries(data).filter(([key, value]) => hasKey(key) && Array.isArray(value) && value.every((x) => typeof x === 'string'));
  const buttonEntries = BUTTON_KEYS.filter((key) => hasKey(key) && data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]));
  const stats = hasKey('stats') && Array.isArray(data.stats) && data.stats.every((x: unknown) => x && typeof x === 'object' && !Array.isArray(x)) ? data.stats : null;
  const principles = hasKey('principles') && Array.isArray(data.principles) && data.principles.every((x: unknown) => x && typeof x === 'object' && !Array.isArray(x)) ? data.principles : null;
  const showcaseItems = sectionKey === 'showcase' && hasKey('items') && Array.isArray(data.items) && data.items.every((x: any) => x && typeof x === 'object' && !Array.isArray(x)) ? data.items : null;

  useEffect(() => {
    if (sectionKey !== 'showcase') return;
    const controller = new AbortController();
    setGalleryLoading(true);
    fetch('/api/admin/employee-showcase-gallery', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '读取数据库截图库失败');
        const databaseAssets: ShowcaseGalleryAsset[] = Array.isArray(result.data) ? result.data : [];
        if (databaseAssets.length) {
          setGalleryAssets(databaseAssets);
          setGalleryMessage('');
        } else {
          // Let admins change screenshots even before running the one-time media-library seed.
          // Negative IDs mark bundled static images; they are saved as URLs, not mediaAsset IDs.
          const bundledAssets: ShowcaseGalleryAsset[] = EMPLOYEE_SHOWCASE_GALLERY.map((entry) => ({
            id: -entry.number,
            url: entry.src,
            name: entry.label,
            label: `${entry.label} · 内置截图`,
            alt: entry.label,
            isBuiltin: true,
          }));
          setGalleryAssets(bundledAssets);
          setGalleryMessage('数据库媒体图库尚未初始化，当前先提供内置截图以便替换。建议首次部署后执行 npm.cmd run seed:employee-showcase，将 60 张图片登记为数据库媒体资产。');
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setGalleryMessage(error instanceof Error ? error.message : '读取数据库截图库失败');
      })
      .finally(() => { if (!controller.signal.aborted) setGalleryLoading(false); });
    fetch('/api/admin/products', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) {
          setShowcaseProducts(result.data.map((product: any) => ({ slug: String(product.slug), name: String(product.name), status: String(product.status || '') })));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [sectionKey]);

  function update(next: Record<string, any>) {
    const text = formatData(next);
    onChange(text);
    setJsonError('');
  }

  function updateScalar(key: string, value: string) {
    const old = data[key];
    if (typeof old === 'number') update({ ...data, [key]: Number(value) || 0 });
    else if (typeof old === 'boolean') update({ ...data, [key]: value === 'true' });
    else update({ ...data, [key]: value });
  }

  function updateButton(key: string, field: 'text' | 'url', value: string) {
    update({ ...data, [key]: { ...(data[key] || {}), [field]: value } });
  }

  function updateStringArray(key: string, value: string) {
    update({ ...data, [key]: value.split('\n').map((x) => x.trim()).filter(Boolean) });
  }

  async function saveShowcaseNow() {
    if (!onSave) return;
    setSaveFeedback('正在保存图片、文字和产品关联…');
    const success = await onSave();
    setSaveFeedback(success ? '保存成功：图片资产 ID 与展示配置已写入数据库。刷新官网即可查看。' : '保存未成功：请检查本页保存提示、权限或数据库连接后重试。');
  }

  function updateShowcaseItem(index: number, patch: Record<string, any>) {
    if (!showcaseItems) return;
    setSaveFeedback('内容已修改，尚未保存到数据库。');
    const next = [...showcaseItems];
    next[index] = { ...next[index], ...patch };
    update({ ...data, items: next });
  }

  function moveShowcaseItem(index: number, delta: number) {
    if (!showcaseItems) return;
    const target = index + delta;
    if (target < 0 || target >= showcaseItems.length) return;
    const next = [...showcaseItems];
    [next[index], next[target]] = [next[target], next[index]];
    update({ ...data, items: next });
  }

  return (
    <div className="page-data-fields">
      <div className="page-data-head">
        <div>
          <strong>区块内容字段</strong>
          <small>常用文字、按钮、标签、列表和“关于我们”指标可以直接编辑；复杂结构再使用高级 JSON。</small>
        </div>
        <span className="page-data-section-key">{sectionKey}</span>
      </div>

      {!!scalarEntries.length && <div className="page-data-scalar-grid">
        {scalarEntries.map(([key, value]) => (
          <label key={key}>
            <span>{prettyKey(key)}</span>
            {String(value).length > 80 ? <textarea rows={4} value={String(value ?? '')} onChange={(e) => updateScalar(key, e.target.value)} /> : <input value={String(value ?? '')} onChange={(e) => updateScalar(key, e.target.value)} />}
          </label>
        ))}
      </div>}

      {!!buttonEntries.length && <div className="page-data-button-grid">
        {buttonEntries.map((key) => (
          <div className="page-data-button-card" key={key}>
            <strong>{prettyKey(key)}</strong>
            <label><span>按钮文字</span><input value={String(data[key]?.text || '')} onChange={(e) => updateButton(key, 'text', e.target.value)} /></label>
            <label><span>跳转地址</span><input value={String(data[key]?.url || '')} onChange={(e) => updateButton(key, 'url', e.target.value)} /></label>
          </div>
        ))}
      </div>}

      {!!stringArrays.length && <div className="page-data-array-grid">
        {stringArrays.map(([key, value]) => (
          <label key={key}>
            <span>{prettyKey(key)}（一行一个）</span>
            <textarea rows={5} value={(value as string[]).join('\n')} onChange={(e) => updateStringArray(key, e.target.value)} />
          </label>
        ))}
      </div>}

      {!!stats && <div className="page-data-repeaters">
        <div className="page-data-repeater-head"><strong>关于我们 · 核心指标</strong><small>每项由“数值 + 标签 + 说明”组成，直接影响关于我们页面右侧快照。</small></div>
        <div className="page-data-repeaters-grid">
          {stats.slice(0, 6).map((item: any, index: number) => (
            <div className="page-data-repeater-card" key={`stat-${index}`}>
              <div className="page-data-repeater-index">0{index + 1}</div>
              <label><span>数值</span><input value={String(item.value ?? item.number ?? '')} onChange={(e) => { const next = [...stats]; next[index] = { ...next[index], value: e.target.value }; update({ ...data, stats: next }); }} /></label>
              <label><span>标签</span><input value={String(item.label ?? item.title ?? '')} onChange={(e) => { const next = [...stats]; next[index] = { ...next[index], label: e.target.value }; update({ ...data, stats: next }); }} /></label>
              <label><span>说明</span><textarea rows={3} value={String(item.detail ?? item.desc ?? item.description ?? '')} onChange={(e) => { const next = [...stats]; next[index] = { ...next[index], detail: e.target.value }; update({ ...data, stats: next }); }} /></label>
            </div>
          ))}
        </div>
      </div>}

      {!!showcaseItems && <div className="page-data-repeaters employee-showcase-admin-editor">
        <div className="page-data-repeater-head">
          <strong>官网展示 · AI 数字员工工作现场</strong>
          <small>首页岗位矩阵、产品中心与岗位详情页共用这里的数据库内容。展开需要修改的展示项，选择图库图片或上传新图片，然后点击本区块的「保存图片与文案到数据库」。图片资产 ID、文字、归属产品、顺序和启用状态都会保存。</small>
        </div>
        <div className="employee-showcase-admin-items">
          {showcaseItems.map((item: any, index: number) => {
            const galleryMatch = galleryAssets.find((entry) => entry.url === item.imageUrl || entry.id === Number(item.imageAssetId));
            const galleryValue = galleryMatch ? String(galleryMatch.id) : item.imageUrl ? '__uploaded__' : '__none__';
            const itemKey = String(item.id || `showcase-${index}`);
            const isExpanded = expandedShowcaseItems[itemKey] ?? index === 0;
            return <div className={`employee-showcase-admin-item${item.enabled === false ? ' is-disabled' : ''}${isExpanded ? ' is-expanded' : ''}`} key={itemKey}>
              <div className="employee-showcase-admin-item-head">
                <strong><span>{String(index + 1).padStart(2, '0')}</span><span className="employee-showcase-admin-item-title">{item.title || '未命名展示项'}<small>{item.category || 'AI数字员工'} · {item.imageUrl ? '图文模式' : '纯文字模式'}{item.enabled === false ? ' · 已隐藏' : ''}</small></span></strong>
                <div>
                  <button type="button" className="admin-ghost-button showcase-item-toggle" aria-expanded={isExpanded} onClick={() => setExpandedShowcaseItems((old) => ({ ...old, [itemKey]: !isExpanded }))}>{isExpanded ? '收起' : '编辑'}</button>
                  <button type="button" className="admin-ghost-button" disabled={index === 0} onClick={() => moveShowcaseItem(index, -1)}>上移</button>
                  <button type="button" className="admin-ghost-button" disabled={index === showcaseItems.length - 1} onClick={() => moveShowcaseItem(index, 1)}>下移</button>
                  <button type="button" className="admin-ghost-button danger" onClick={() => update({ ...data, items: showcaseItems.filter((_: any, itemIndex: number) => itemIndex !== index) })}>删除</button>
                </div>
              </div>
              {isExpanded && <div className="employee-showcase-admin-item-content"><div className="employee-showcase-admin-item-grid">
                <label><span>展示标题</span><input value={String(item.title || '')} onChange={(e) => updateShowcaseItem(index, { title: e.target.value })} placeholder="例如：从文案到成片的一体化创作" /></label>
                <label><span>分类标签</span><input value={String(item.category || '')} onChange={(e) => updateShowcaseItem(index, { category: e.target.value })} placeholder="例如：内容生产 / AI短视频" /></label>
                <label className="showcase-admin-description"><span>说明文案</span><textarea rows={3} value={String(item.description || '')} onChange={(e) => updateShowcaseItem(index, { description: e.target.value })} placeholder="简要说明该数字员工能做什么。" /></label>
                <label><span>融合到产品卡片</span><select value={item.productSlugUnlinked === true ? '' : String(item.productSlug || getEmployeeShowcaseProductSlug({ ...item, productSlug: '' }) || defaultProductByScene[String(item.id || '')] || '')} onChange={(e) => updateShowcaseItem(index, { productSlug: e.target.value, productSlugUnlinked: !e.target.value })}><option value="">不关联产品卡片</option>{showcaseProducts.map((product) => <option key={product.slug} value={product.slug}>{product.name}{product.status === 'INACTIVE' ? '（已停用）' : ''}</option>)}</select><small>官网产品中心会将此场景的图片与说明融入所选产品卡片。</small></label>
                <label><span>点击跳转地址（首页工作现场使用）</span><input value={String(item.href || '')} onChange={(e) => updateShowcaseItem(index, { href: e.target.value })} placeholder="/products/ai-video" /></label>
                <label><span>图片说明 / Alt</span><input value={String(item.imageAlt || '')} onChange={(e) => updateShowcaseItem(index, { imageAlt: e.target.value })} placeholder="无障碍说明与图片搜索语义" /></label>
                <label className="showcase-admin-gallery-select"><span>数据库图片库（选择已上传图片）</span><select value={galleryValue} onChange={(e) => {
                  if (e.target.value === '__none__') updateShowcaseItem(index, { imageUrl: '', imageAssetId: null, imageAlt: '' });
                  else if (e.target.value !== '__uploaded__') {
                    const asset = galleryAssets.find((entry) => String(entry.id) === e.target.value);
                    if (asset) {
                      const imageAssetId = asset.isBuiltin || asset.id < 0 ? null : asset.id;
                      const imageUrl = imageAssetId ? `/api/public/assets/${imageAssetId}` : asset.url;
                      updateShowcaseItem(index, { imageUrl, imageAssetId, imageAlt: asset.alt || asset.label || item.imageAlt || '' });
                    }
                  }
                }}>
                  <option value="__none__">不使用图片（纯文字）</option>
                  {galleryValue === '__uploaded__' && <option value="__uploaded__">已选择上传图片（在下方更换）</option>}
                  {galleryAssets.map((entry) => <option key={entry.id} value={String(entry.id)}>{entry.label}</option>)}
                </select></label>
                <div className="showcase-admin-image-field">
                  {item.imageUrl ? <div className="showcase-admin-image-preview"><img src={item.imageUrl} alt={item.imageAlt || ''} /><span>已启用图文展示</span></div> : <div className="showcase-admin-image-empty"><span className="showcase-admin-image-empty-icon">Aa</span><strong>纯文字模式</strong><small>前台会显示科技感文字卡片</small></div>}
                  <AssetPicker label="上传图片 / 从素材库选择" folder="pages/products/showcase" accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={50} value={item.imageUrl || ''} assetId={Number(item.imageAssetId) || undefined} onChange={(asset) => {
                    const assetId = Number(asset.assetId) || null;
                    const imageUrl = assetId ? `/api/public/assets/${assetId}` : (asset.url || '');
                    const imageAlt = imageUrl ? (asset.fileName || item.imageAlt || '') : '';
                    if (assetId && imageUrl) {
                      const label = asset.fileName || `图片资产 ${assetId}`;
                      setGalleryAssets((current) => [{ id: assetId, url: imageUrl, name: label, label: `新上传 · ${label}`, alt: imageAlt }, ...current.filter((entry) => entry.id !== assetId)]);
                    }
                    updateShowcaseItem(index, { imageUrl, imageAssetId: assetId, imageAlt });
                  }} helper="上传、素材库选择、清除都会立即更新当前表单；最后点击下方保存按钮写入数据库。清除后前台自动切换纯文字卡片。" />
                  {galleryLoading && <small className="showcase-admin-gallery-message">正在读取数据库中的截图……</small>}
                  {!galleryLoading && !!galleryMessage && <small className="showcase-admin-gallery-message">{galleryMessage}</small>}
                  {!galleryLoading && !galleryAssets.length && !galleryMessage && <small className="showcase-admin-gallery-message">媒体库暂时没有图片。可以直接在右侧上传图片；如需导入压缩包附带的 60 张初始截图，请执行 npm.cmd run seed:employee-showcase。</small>}
                </div>
                <label className="employee-showcase-admin-enabled"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => updateShowcaseItem(index, { enabled: e.target.checked })} /><span>在官网展示此项</span></label>
              </div></div>}
            </div>;
          })}
        </div>
        <div className="employee-showcase-admin-footer"><div className="employee-showcase-admin-footer-copy"><span>实际展示位置：<a href="/#employee-showcase-home" target="_blank" rel="noreferrer">预览首页融合矩阵 ↗</a> · <a href="/products#employee-showcase-products" target="_blank" rel="noreferrer">预览产品中心 ↗</a>。图片会保存在统一媒体库，展示文案、图片资产 ID、产品归属与顺序会写入 CMS 数据库。</span>{saveFeedback && <strong className={saveFeedback.startsWith('保存未') ? 'is-error' : saveFeedback.startsWith('保存成功') ? 'is-success' : ''}>{saveFeedback}</strong>}</div><div className="employee-showcase-admin-footer-actions"><button type="button" className="admin-secondary-button" onClick={() => update({ ...data, items: [...(showcaseItems || []), { id: `showcase-${Date.now()}`, productSlug: '', productSlugUnlinked: true, category: 'AI数字员工', title: '', description: '', imageUrl: '', imageAssetId: null, imageAlt: '', href: '/products', enabled: true }] })}>＋ 添加展示项</button>{onSave && <button type="button" className="admin-primary-button" disabled={saving} onClick={() => void saveShowcaseNow()}>{saving ? '保存中…' : '保存图片与文案到数据库'}</button>}</div></div>
      </div>}

      {!!principles && <div className="page-data-repeaters">
        <div className="page-data-repeater-head"><strong>关于我们 · 价值原则</strong><small>页面中“岗位化 / 可调度 / 持续执行 / 可沉淀”等卡片可直接编辑。</small></div>
        <div className="page-data-repeaters-grid">
          {principles.slice(0, 8).map((item: any, index: number) => (
            <div className="page-data-repeater-card" key={`principle-${index}`}>
              <div className="page-data-repeater-index">{String(index + 1).padStart(2, '0')}</div>
              <label><span>序号</span><input value={String(item.index ?? '')} onChange={(e) => { const next = [...principles]; next[index] = { ...next[index], index: e.target.value }; update({ ...data, principles: next }); }} /></label>
              <label><span>标题</span><input value={String(item.title ?? item.name ?? '')} onChange={(e) => { const next = [...principles]; next[index] = { ...next[index], title: e.target.value }; update({ ...data, principles: next }); }} /></label>
              <label><span>说明</span><textarea rows={3} value={String(item.text ?? item.description ?? item.desc ?? '')} onChange={(e) => { const next = [...principles]; next[index] = { ...next[index], text: e.target.value }; update({ ...data, principles: next }); }} /></label>
            </div>
          ))}
        </div>
      </div>}

      <div className="page-data-add-row">
        <span className="admin-field-note">只编辑当前页面组件已经支持的字段；新增自定义字段前，请先确保用户端有对应渲染逻辑。</span>
        <button type="button" className="admin-ghost-button" onClick={() => setAdvanced((x) => !x)}>{advanced ? '收起高级 JSON' : '打开高级 JSON'}</button>
      </div>
      {jsonError && <div className="admin-error-message">{jsonError}</div>}

      {advanced && <div className="page-data-advanced">
        <div className="page-data-advanced-head"><span>完整 JSON</span><small>数组、对象、首页任务步骤与复杂业务数据可在这里编辑。</small></div>
        <textarea rows={16} spellCheck={false} value={dataText} onChange={(e) => { setJsonError(''); onChange(e.target.value); }} onBlur={() => { const value = parseObject(dataText); const normalized = formatData(value); if (normalized !== dataText) onChange(normalized); }} />
        {dataText.trim() && Object.keys(data).length === 0 && <div className="admin-error-message">当前 JSON 不是对象，保存时会失败。</div>}
      </div>}
    </div>
  );
}
