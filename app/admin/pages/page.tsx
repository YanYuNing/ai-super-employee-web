'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssetPicker from '@/components/admin/asset-picker';
import PageDataFields from '@/components/admin/page-data-fields';
import { DEFAULT_EMPLOYEE_SHOWCASE_SECTION, DEFAULT_EMPLOYEE_SHOWCASE_ITEMS, getEmployeeShowcaseProductSlug } from '@/lib/employee-showcase';
import { readCmsSectionData } from '@/lib/cms-section-data';

const defs = [
  ['home', '首页'], ['about', '关于我们'], ['contact', '联系我们'], ['ai-claw', 'AI Claw'],
  ['products', '产品中心'], ['solutions', '解决方案'], ['cases', '案例中心'], ['resources', '资源中心'],
  ['skills', 'Skills中心'], ['prompts', 'Prompt中心'], ['docs', '使用手册'], ['downloads', '下载中心'], ['articles', '文章 / 新闻'], ['faq', 'FAQ'], ['changelog', '更新日志'],
] as const;

const statusOptions = [
  ['DRAFT', '草稿'],
  ['PUBLISHED', '已发布'],
  ['ARCHIVED', '已归档'],
] as const;

const statusLabels: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' };

function normalizeSection(section: any, index: number, slug?: string) {
  const isAboutBody = slug === 'about' && section?.sectionKey === 'body';
  const defaultStats = [
    { value: 'AI', label: '核心技术方向', detail: '把多种 AI 能力组织成可执行岗位' },
    { value: '24/7', label: '工作方式', detail: '持续处理内容、获客、引流与服务任务' },
    { value: '10', label: '数字员工岗位', detail: '覆盖企业营销关键环节' },
    { value: '1→N', label: '协同方式', detail: '一个任务可调度多名数字员工协作' },
  ];
  const defaultPrinciples = [
    { index: '01', title: '岗位化', text: '一个 AI 员工对应一个清晰职责，让能力更容易理解、调用与交接。' },
    { index: '02', title: '可调度', text: 'AI Claw 负责理解任务并调用对应数字员工，不要求用户记住复杂操作。' },
    { index: '03', title: '持续执行', text: '内容生成、获客、客服与销售跟进可以被拆成持续运行的任务。' },
    { index: '04', title: '可沉淀', text: 'Skills、Prompt、教程与行业资料统一沉淀到资源中心，持续复用。' },
  ];
  // Keep live dataText edits across React rerenders; the API uses the persisted `data` field.
  const normalizedData = readCmsSectionData(section);
  const isProductShowcase = slug === 'products' && section?.sectionKey === 'showcase';
  const data = isAboutBody ? {
    kicker: normalizedData.kicker || 'ABOUT US',
    principlesKicker: normalizedData.principlesKicker || 'WHY DIGITAL EMPLOYEE',
    principlesTitle: normalizedData.principlesTitle || '从“工具集合”到“岗位协同”',
    principlesDescription: normalizedData.principlesDescription || '把产品、Prompt、Skill 与 AI Claw 重新放回一条工作链路里，用户看到的是“谁在做什么”，而不只是“有什么功能”。',
    statsKicker: normalizedData.statsKicker || 'AI DIGITAL WORKFORCE / SNAPSHOT',
    statsStatus: normalizedData.statsStatus || '● LIVE',
    stats: Array.isArray(normalizedData.stats) && normalizedData.stats.length ? normalizedData.stats : defaultStats,
    principles: Array.isArray(normalizedData.principles) && normalizedData.principles.length ? normalizedData.principles : defaultPrinciples,
  } : isProductShowcase ? {
    ...DEFAULT_EMPLOYEE_SHOWCASE_SECTION.data,
    ...normalizedData,
    items: Array.isArray(normalizedData.items) ? normalizedData.items.map((item: any) => ({ ...item, productSlug: item.productSlugUnlinked === true ? '' : (String(item.productSlug || '').trim() || getEmployeeShowcaseProductSlug({ ...item, productSlug: '' })), productSlugUnlinked: item.productSlugUnlinked === true })) : DEFAULT_EMPLOYEE_SHOWCASE_ITEMS,
    button: normalizedData.button && typeof normalizedData.button === 'object' ? normalizedData.button : DEFAULT_EMPLOYEE_SHOWCASE_SECTION.data.button,
  } : normalizedData;
  return {
    id: section?.id,
    sectionKey: section?.sectionKey ?? `section-${index + 1}`,
    title: section?.title ?? (isAboutBody ? '我们不是做更多 AI 工具，而是在做一支真正能工作的数字营销团队。' : ''),
    subtitle: section?.subtitle ?? (isAboutBody ? '把分散的 AI 能力组织成岗位，让企业可以从“人找工具”转向“任务找能力”。' : ''),
    content: section?.content ?? (isAboutBody ? '围绕内容生产、品牌 IP、AI 获客、AI 引流、客户接待和销售跟进，我们用数字员工的方式重构企业营销执行链路。' : ''),
    imageUrl: section?.imageUrl ?? '',
    videoUrl: section?.videoUrl ?? '',
    dataText: JSON.stringify(data, null, 2),
    sortOrder: Number(section?.sortOrder ?? index),
    enabled: section?.enabled !== false,
  };
}

const systemSectionKeys: Record<string, string[]> = {
  home: ['hero','value','ai-employees','ai-claw','solutions','cases','resources','cta'],
  about: ['hero','body'],
  contact: ['hero','intro','steps','form'],
  'ai-claw': ['hero','process','examples','workforce'],
  products: ['hero','cards','detail','empty','showcase'],
  solutions: ['hero','cards','empty','detail'],
  cases: ['hero','cards','empty','detail'],
  resources: ['hero','resource-hub','cards','empty','detail'],
  skills: ['hero','cards','detail','empty'],
  prompts: ['hero','cards','detail','empty'],
  docs: ['hero','cards','detail','empty'],
  downloads: ['hero','cards','detail','empty'],
  faq: ['hero','empty'],
  changelog: ['hero','empty'],
  articles: ['hero','cards','detail','empty'],
};

// 联系我们页面的表单由 ContactForm 组件直接渲染，数据库中的 contact/form 区块没有用户端消费者，后台不再展示并在保存时清理。
const hiddenSystemSections: Record<string, string[]> = {
  // 联系表单由 ContactForm 组件直接渲染，数据库区块没有前台消费者。
  contact: ['form'],
  // 资源中心已统一由 resource-hub 数据驱动，旧的 hero/cards/empty 区块不再有前台消费者。
  resources: ['hero', 'cards', 'empty'],
  // 下载中心没有详情页，旧 detail 区块也没有前台消费者。
  downloads: ['detail'],
};

const directSectionFields: Record<string, { content?: boolean; image?: boolean; video?: boolean }> = {
  'about:body': { content: true, image: true, video: true },
};

const sectionTextFields: Record<string, { title?: boolean; subtitle?: boolean }> = {
  'home:hero': { title: true, subtitle: true },
  'home:value': { title: true, subtitle: true },
  'home:ai-employees': { title: true, subtitle: true },
  'home:ai-claw': { title: true, subtitle: true },
  'home:solutions': { title: true, subtitle: true },
  'home:cases': { title: true, subtitle: true },
  'home:resources': { title: true, subtitle: true },
  'home:cta': { title: true, subtitle: true },
  'about:hero': { title: true, subtitle: true },
  'about:body': { title: true, subtitle: true },
  'contact:hero': { title: true, subtitle: true },
  'contact:intro': { title: true, subtitle: true },
  'ai-claw:hero': { title: true, subtitle: true },
  'ai-claw:process': { title: true, subtitle: true },
  'ai-claw:examples': { title: true },
  'ai-claw:workforce': { title: true, subtitle: true },
  'products:showcase': { title: true, subtitle: true },
};

const supportedDataKeys: Record<string, string[]> = {
  'home:hero': ['primaryButton', 'secondaryButton', 'floatingStatuses'],
  'home:ai-employees': ['emptyText', 'tagBySlug'],
  'home:ai-claw': ['consoleTitle', 'consoleStatus'],
  'home:solutions': ['kicker', 'emptyText'],
  'home:cases': ['kicker', 'tagFallback', 'descriptionFallback', 'emptyText'],
  'home:resources': ['kicker'],
  'home:cta': ['kicker', 'button', 'secondaryButton'],
  'about:hero': ['kicker', 'button', 'secondary'],
  'about:body': ['kicker', 'principlesKicker', 'principlesTitle', 'principlesDescription', 'statsKicker', 'statsStatus', 'stats', 'principles'],
  'contact:hero': ['kicker', 'secondary'],
  'contact:intro': ['kicker'],
  'contact:steps': ['items'],
  'ai-claw:hero': ['kicker', 'command', 'primary', 'secondary'],
  'ai-claw:process': ['kicker', 'consoleTitle', 'consoleStatus', 'items'],
  'ai-claw:examples': ['kicker', 'items'],
  'ai-claw:workforce': ['kicker', 'items'],
  'products:hero': ['kicker', 'button'],
  'products:cards': ['tag', 'ctaText'],
  'products:empty': ['text'],
  'products:detail': ['kicker', 'primary', 'secondary', 'capabilitiesKicker', 'capabilitiesTitle', 'emptyContent', 'contentTitle'],
  'products:showcase': ['kicker', 'button', 'items'],
  'solutions:hero': ['kicker'],
  'solutions:cards': ['tag', 'description', 'ctaText'],
  'solutions:empty': ['text'],
  'solutions:detail': ['kicker', 'primary', 'emptyContent'],
  'cases:hero': ['kicker'],
  'cases:cards': ['tag', 'description'],
  'cases:empty': ['text'],
  'cases:detail': ['kicker', 'primary', 'emptyContent'],
  'resources:hero': ['kicker'],
  'resources:resource-hub': ['blocks'],
  'resources:empty': ['text'],
  'resources:detail': ['kicker', 'emptyContent'],
  'skills:hero': ['kicker'],
  'skills:cards': ['versionPrefix', 'description', 'ctaText'],
  'skills:empty': ['text'],
  'skills:detail': ['kicker', 'descriptionFallback', 'primary', 'secondary', 'contentTitle', 'versionsTitle', 'latestText', 'versionEmptyText', 'downloadText'],
  'prompts:hero': ['kicker'],
  'prompts:cards': ['label', 'modelFallback', 'description', 'ctaText'],
  'prompts:empty': ['text'],
  'prompts:detail': ['kicker', 'descriptionFallback', 'secondary', 'contentTitle', 'modelFallback', 'emptyContent', 'usageTitle'],
  'docs:hero': ['kicker'],
  'docs:cards': ['label', 'ctaText'],
  'docs:empty': ['text'],
  'docs:detail': ['kicker', 'emptyContent'],
  'downloads:hero': ['kicker'],
  'downloads:cards': ['platformFallback', 'versionFallback', 'description', 'downloadText', 'codePrefix'],
  'downloads:empty': ['text'],
  'faq:hero': ['kicker'],
  'faq:empty': ['text'],
  'changelog:hero': ['kicker'],
  'changelog:empty': ['text'],
  'articles:hero': ['kicker'],
  'articles:cards': ['label', 'ctaText'],
  'articles:empty': ['text'],
};

function getAllowedDataKeys(slug: string, sectionKey: string) {
  const key = `${slug}:${sectionKey}`;
  return supportedDataKeys[key] || null;
}

function sectionFieldMode(slug: string, sectionKey: string) {
  const key = `${slug}:${sectionKey}`;
  const direct = directSectionFields[key];
  const text = sectionTextFields[key];
  if (direct || text) return { isSystem: true, title: text?.title ?? false, subtitle: text?.subtitle ?? false, content: direct?.content ?? false, image: direct?.image ?? false, video: direct?.video ?? false };
  const isSystem = (systemSectionKeys[slug] || []).includes(sectionKey);
  return { isSystem, title: !isSystem, subtitle: !isSystem, content: !isSystem, image: !isSystem, video: !isSystem };
}

export default function PagesAdmin() {
  const [pages, setPages] = useState<any[]>([]);
  const [active, setActive] = useState('home');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const empty = (slug: string) => ({
    slug,
    title: defs.find((x) => x[0] === slug)?.[1] || slug,
    description: '',
    content: '',
    status: 'PUBLISHED',
    sortOrder: defs.findIndex((x) => x[0] === slug),
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    sections: [],
  });

  const rawPage = pages.find((x) => x.slug === active) || empty(active);
  const normalizedSections = (rawPage.sections || []).map((section: any, index: number) => normalizeSection(section, index, active));
  const page = { ...rawPage, sections: active === 'products' && !normalizedSections.some((section: any) => section.sectionKey === 'showcase')
    ? [...normalizedSections, normalizeSection(DEFAULT_EMPLOYEE_SHOWCASE_SECTION, normalizedSections.length, active)]
    : normalizedSections };

  useEffect(() => {
    fetch('/api/admin/pages', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => j.success && setPages(j.data || []))
      .catch(() => setMsg('页面读取失败'));
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('page');
    if (requested && defs.some(([slug]) => slug === requested)) setActive(requested);
  }, []);

  useEffect(() => {
    if (active !== 'products' || window.location.hash !== '#products-showcase-editor') return;
    const timer = window.setTimeout(() => {
      document.getElementById('products-showcase-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [active, pages.length, rawPage.sections?.length]);

  const patch = (value: any) => {
    setPages((old) => {
      const exists = old.some((x) => x.slug === active);
      return exists ? old.map((x) => x.slug === active ? { ...x, ...value } : x) : [...old, { ...page, ...value }];
    });
  };

  const patchSection = (index: number, value: any) => {
    patch({ sections: page.sections.map((section: any, i: number) => i === index ? { ...section, ...value } : section) });
  };

  async function save(): Promise<boolean> {
    setSaving(true);
    setMsg('');
    try {
      const visibleSections = page.sections.filter((section: any) => !hiddenSystemSections[active]?.includes(section.sectionKey));
      const sections = visibleSections.map((section: any) => {
        let data: Record<string, any> | null = null;
        const raw = String(section.dataText || '').trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed;
            else throw new Error('区块数据必须是 JSON 对象');
          } catch {
            throw new Error(`区块「${section.sectionKey}」的数据不是有效 JSON`);
          }
        }
        return { ...section, data };
      });
      const { coverImage: _unusedCoverImage, ...pageFields } = page;
      const payload = { ...pageFields, sections };
      const response = await fetch(`/api/admin/pages/${active}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '保存失败');
      setPages((old) => old.map((item) => item.slug === active ? { ...result.data, sections: (result.data.sections || []).map((section: any, index: number) => normalizeSection(section, index, active)) } : item));
      setMsg('保存成功，前台刷新后立即生效。');
      return true;
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '保存失败，请检查输入');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page page-cms-admin">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">CMS / PAGE CONTENT</div>
          <h1>页面内容</h1>
          <p>后台字段以用户端实际渲染为准：系统页面只开放有前台消费者的字段；自定义扩展区块才提供正文、图片和视频。没有前台入口的数据不会继续堆在这里。</p>
        </div>
        <div className="page-cms-header-actions">
          <button type="button" className="admin-primary-button" onClick={() => { window.history.replaceState(null, '', '/admin/pages?page=products#products-showcase-editor'); setActive('products'); setMsg(''); window.setTimeout(() => document.getElementById('products-showcase-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220); }}>编辑官网数字员工图片 ↗</button>
          <Link href="/admin/site-content" className="admin-secondary-button">全站文案</Link>
          <Link href={active === 'home' ? '/' : active === 'articles' ? '/articles' : active === 'faq' ? '/faq' : active === 'changelog' ? '/changelog' : `/${active}`} target="_blank" className="admin-ghost-button">预览当前页面 ↗</Link>
        </div>
      </div>

      <div className="admin-section-card page-cms-shell">
        <div className="page-cms-tabs">
          {defs.map(([slug, title]) => (
            <button key={slug} className={active === slug ? 'active' : ''} onClick={() => { setActive(slug); setMsg(''); }}>
              <strong>{title}</strong><small>{slug}</small>
            </button>
          ))}
        </div>

        <div className="page-cms-meta">
          <div><span>当前页面</span><strong>{page.title || active}</strong></div>
          <div><span>状态</span><b className={`admin-status ${page.status === 'PUBLISHED' ? 'status-published' : 'status-draft'}`}>{statusLabels[page.status] || page.status}</b></div>
          <div><span>区块</span><strong>{page.sections.filter((section: any) => !hiddenSystemSections[active]?.includes(section.sectionKey)).length}</strong></div>
        </div>

        <details className="page-meta-details">
          <summary><span><strong>页面基础信息与 SEO</strong><small>页面标题、简介、发布状态、搜索引擎标题与描述</small></span><b>展开设置⌄</b></summary>
          <div className="cms-form-grid page-meta-grid">
            <label><span>页面标题</span><input value={page.title || ''} onChange={(e) => patch({ title: e.target.value })} /></label>
            <label><span>页面状态</span><select value={page.status || 'PUBLISHED'} onChange={(e) => patch({ status: e.target.value })}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className="full"><span>页面简介</span><input value={page.description || ''} onChange={(e) => patch({ description: e.target.value })} /></label>
            <label><span>SEO 标题</span><input value={page.seoTitle || ''} onChange={(e) => patch({ seoTitle: e.target.value })} /></label>
            <label><span>SEO 关键词</span><input value={page.seoKeywords || ''} onChange={(e) => patch({ seoKeywords: e.target.value })} /></label>
            <label className="full"><span>SEO 描述</span><textarea rows={3} value={page.seoDescription || ''} onChange={(e) => patch({ seoDescription: e.target.value })} /></label>
            {!['home', 'about', 'contact'].includes(active) && <label className="full"><span>页面正文（会显示在用户端）</span><textarea rows={5} value={page.content || ''} onChange={(e) => patch({ content: e.target.value })} placeholder="这段正文会在用户端页面主体中显示；区块内的字段请放在对应区块 JSON。" /></label>}
          </div>
        </details>

        <div className="page-cms-section-head">
          <div><div className="admin-eyebrow">PAGE SECTIONS</div><h2>页面区块</h2><p>区块编辑只保留前台实际消费的字段。「数字员工工作现场」同时驱动首页精选展示与产品中心融合卡片。可维护场景文字、图片与归属产品；产品中心会把场景图融合进对应岗位卡片，不再重复追加独立截图列表。</p></div>
          <button className="admin-secondary-button" onClick={() => patch({ sections: [...page.sections, normalizeSection({ sectionKey: `section-${page.sections.length + 1}`, enabled: true }, page.sections.length)] })}>＋ 新增区块</button>
        </div>

        {!page.sections.filter((section: any) => !hiddenSystemSections[active]?.includes(section.sectionKey)).length && <div className="page-cms-empty"><strong>当前页面还没有区块</strong><span>点击“新增区块”创建第一个内容模块。</span></div>}

        <div className="page-section-list">
          {page.sections.filter((section: any) => !hiddenSystemSections[active]?.includes(section.sectionKey)).map((section: any, index: number) => {
            const editorKey = `${active}:${section.id ?? section.sectionKey}:${index}`;
            const isOpen = openSections[editorKey] ?? (active === 'products' && section.sectionKey === 'showcase');
            return (
            <article id={active === 'products' && section.sectionKey === 'showcase' ? 'products-showcase-editor' : undefined} className={`page-section-editor ${section.enabled === false ? 'is-disabled' : ''} ${isOpen ? 'is-open' : ''}`} key={`${section.sectionKey}-${index}`}>
              <div className="section-editor-head">
                <div><span className="page-section-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{section.title || section.sectionKey || '未命名区块'}</strong><small>{section.sectionKey}</small></div></div>
                <div className="section-editor-actions"><span className={`admin-status ${section.enabled ? 'status-published' : 'status-draft'}`}>{section.enabled ? '已启用' : '已停用'}</span><button type="button" className="admin-ghost-button section-toggle-button" aria-expanded={isOpen} onClick={() => setOpenSections((old) => ({ ...old, [editorKey]: !isOpen }))}>{isOpen ? '收起编辑 ↑' : '展开编辑 ↓'}</button>{!(active === 'products' && section.sectionKey === 'showcase') && <button type="button" className="admin-ghost-button" onClick={() => { const actualIndex = page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey); patch({ sections: page.sections.filter((_: any, i: number) => i !== actualIndex) }); }}>删除</button>}</div>
              </div>
              {isOpen && <div className="page-section-editor-body"><div className="cms-form-grid section-base-grid">
                {(() => { const mode = sectionFieldMode(active, section.sectionKey); return <>
                  <label><span>区块标识 Key</span><input value={section.sectionKey} readOnly={active === 'products' && section.sectionKey === 'showcase'} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { sectionKey: e.target.value })} /></label>
                  {!(active === 'products' && section.sectionKey === 'showcase') && <label><span>排序</span><input type="number" value={section.sortOrder} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { sortOrder: Number(e.target.value) })} /></label>}
                  {mode.title && <label className="full"><span>区块标题</span><input value={section.title} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { title: e.target.value })} /></label>}
                  {mode.subtitle && <label className="full"><span>区块副标题</span><input value={section.subtitle} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { subtitle: e.target.value })} /></label>}
                </> })()}
                {(() => { const mode = sectionFieldMode(active, section.sectionKey); return mode.isSystem ? <>
                  {mode.content && <label className="full"><span>页面正文</span><textarea rows={4} value={section.content} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { content: e.target.value })} /></label>}
                  {mode.image && <AssetPicker label="区块图片" folder={`pages/${active}/sections/${section.sectionKey}`} accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={50} value={section.imageUrl || ''} onChange={(x) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { imageUrl: x.url })} helper="该图片会直接显示在用户端。" />}
                  {mode.video && <AssetPicker label="区块视频" folder={`pages/${active}/videos/${section.sectionKey}`} accept=".mp4,.webm,.mov,.m4v" type="VIDEO" maxSizeMb={4096} value={section.videoUrl || ''} onChange={(x) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { videoUrl: x.url })} helper="该视频会直接在用户端播放。" />}
                  {!mode.content && !mode.image && !mode.video && <div className="admin-field-note full"><strong>系统区块</strong><span>这个区块的前台只读取“标题 / 副标题”和下方结构化数据 JSON，通用正文、图片和视频不会进入用户端。</span></div>}
                </> : <>
                  <label className="full"><span>扩展区块正文</span><textarea rows={4} value={section.content} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { content: e.target.value })} /></label>
                  <AssetPicker label="扩展区块图片" folder={`pages/${active}/sections/${section.sectionKey}`} accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={50} value={section.imageUrl || ''} onChange={(x) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { imageUrl: x.url })} helper="该区块会直接在用户端渲染。" />
                  <AssetPicker label="扩展区块视频" folder={`pages/${active}/videos/${section.sectionKey}`} accept=".mp4,.webm,.mov,.m4v" type="VIDEO" maxSizeMb={4096} value={section.videoUrl || ''} onChange={(x) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { videoUrl: x.url })} helper="该视频会直接在用户端渲染，并支持浏览器在线播放。" />
                </> })()}
                <label className="admin-check full"><input type="checkbox" checked={section.enabled !== false} onChange={(e) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { enabled: e.target.checked })} /><span>启用此区块</span></label>
              </div>
              <PageDataFields sectionKey={section.sectionKey} dataText={section.dataText || '{}'} allowedKeys={getAllowedDataKeys(active, section.sectionKey)} onChange={(value) => patchSection(page.sections.findIndex((item: any) => item.id === section.id && item.sectionKey === section.sectionKey), { dataText: value })} onSave={save} saving={saving} />
              </div>}
            </article>
          );})}
        </div>

        <div className="page-cms-savebar">
          <div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div>
          <div className="admin-form-actions" style={{ marginTop: 0 }}><button className="admin-primary-button" disabled={saving} onClick={() => void save()}>{saving ? '保存中...' : `保存「${page.title || active}」`}</button></div>
        </div>
      </div>
    </main>
  );
}
