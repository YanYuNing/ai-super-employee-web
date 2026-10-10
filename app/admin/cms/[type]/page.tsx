'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AssetPicker from '@/components/admin/asset-picker';

type FieldConfig = [string, string, string];
type CmsConfig = {
  title: string;
  desc: string;
  statuses?: string[];
  columns: string[];
  fields: FieldConfig[];
};

const configs: Record<string, CmsConfig> = {
  solutions: {
    title: '解决方案', desc: '行业方案内容与 SEO。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['name', 'slug', 'status', 'sortOrder'],
    fields: [['name', '名称', ''], ['slug', 'Slug', ''], ['description', '简介', 'full'], ['icon', '图标 / Icon', 'full'], ['tags', '行业标签 JSON', 'json full'], ['content', '正文', 'textarea full'], ['seoTitle', 'SEO 标题', ''], ['seoDescription', 'SEO 描述', ''], ['status', '状态', 'select'], ['sortOrder', '排序', 'number']],
  },
  cases: {
    title: '客户案例', desc: '案例内容、行业与结果。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['title', 'companyName', 'industry', 'status'],
    fields: [['title', '标题', ''], ['slug', 'Slug', ''], ['companyName', '客户', ''], ['industry', '行业', ''], ['description', '简介', 'full'], ['coverImage', '封面图', 'full'], ['content', '正文', 'textarea full'], ['results', '结果 JSON', 'json full'], ['seoTitle', 'SEO 标题', ''], ['seoDescription', 'SEO 描述', ''], ['status', '状态', 'select'], ['sortOrder', '排序', 'number']],
  },
  tutorials: {
    title: '教程', desc: '产品教程与操作指南。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['title', 'slug', 'status', 'sortOrder'],
    fields: [['title', '标题', ''], ['slug', 'Slug', ''], ['description', '简介', 'full'], ['content', '正文', 'textarea full'], ['coverImage', '封面', 'full'], ['videoUrl', '视频 URL', 'full'], ['duration', '时长(秒)', 'number'], ['tags', 'Tags JSON', 'json full'], ['seoTitle', 'SEO 标题', ''], ['seoDescription', 'SEO 描述', ''], ['status', '状态', 'select'], ['sortOrder', '排序', 'number']],
  },
  resources: {
    title: '资源中心', desc: '教程、工具、资料与下载资源。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['title', 'slug', 'status', 'sortOrder'],
    fields: [['title', '标题', ''], ['slug', 'Slug', ''], ['description', '简介', 'full'], ['content', '正文', 'textarea full'], ['fileUrl', '文件 URL', 'full'], ['videoUrl', '视频 URL', 'full'], ['coverImage', '封面', 'full'], ['tags', 'Tags JSON', 'json full'], ['seoTitle', 'SEO 标题', ''], ['seoDescription', 'SEO 描述', ''], ['status', '状态', 'select'], ['sortOrder', '排序', 'number']],
  },
  articles: {
    title: '文章 / 新闻', desc: '知识库与企业内容。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['title', 'author', 'status', 'publishedAt'],
    fields: [['title', '标题', ''], ['slug', 'Slug', ''], ['summary', '摘要', 'full'], ['content', '正文', 'textarea full'], ['coverImage', '封面', 'full'], ['author', '作者', ''], ['tags', 'Tags JSON', 'json full'], ['seoTitle', 'SEO 标题', ''], ['seoDescription', 'SEO 描述', ''], ['status', '状态', 'select'], ['publishedAt', '发布时间', 'datetime']],
  },
  faqs: {
    title: 'FAQ', desc: '常见问题。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['question', 'category', 'status', 'sortOrder'],
    fields: [['question', '问题', 'full'], ['answer', '答案', 'textarea full'], ['category', '分类', ''], ['status', '状态', 'select'], ['sortOrder', '排序', 'number']],
  },
  changelogs: {
    title: '更新日志', desc: '版本更新记录。', statuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], columns: ['version', 'title', 'releaseDate', 'status'],
    fields: [['version', '版本', ''], ['title', '标题', ''], ['releaseDate', '发布日期', 'date'], ['content', '更新内容', 'textarea full'], ['status', '状态', 'select']],
  },
  leads: {
    title: '销售线索', desc: '线索分配、状态与跟进记录。', statuses: ['NEW', 'CONTACTED', 'FOLLOWING', 'CONVERTED', 'CLOSED'], columns: ['name', 'company', 'phone', 'industry', 'status', 'createdAt'],
    fields: [['name', '姓名', ''], ['company', '公司', ''], ['phone', '电话', ''], ['wechat', '微信', ''], ['industry', '行业', ''], ['source', '来源', 'select'], ['message', '需求', 'textarea full'], ['status', '状态', 'select'], ['assignedTo', '负责人', ''], ['remark', '跟进记录', 'textarea full']],
  },
};

const defaults: Record<string, Record<string, unknown>> = {
  tutorials: { status: 'DRAFT', sortOrder: 0 }, solutions: { status: 'DRAFT', sortOrder: 0 }, cases: { status: 'DRAFT', sortOrder: 0 }, resources: { status: 'DRAFT', sortOrder: 0 },
  articles: { status: 'DRAFT' }, faqs: { status: 'PUBLISHED', sortOrder: 0 }, changelogs: { status: 'PUBLISHED', releaseDate: new Date().toISOString().slice(0, 10) },
  leads: { status: 'NEW', source: 'WEBSITE' }, pages: { status: 'DRAFT', sortOrder: 0 },
};

const labels: Record<string, string> = {
  name: '名称', slug: 'Slug', status: '状态', sortOrder: '排序', title: '标题', companyName: '客户', industry: '行业', question: '问题', category: '分类', author: '作者', publishedAt: '发布时间', version: '版本', releaseDate: '发布日期', coverImage: '封面', seoTitle: 'SEO标题', seoDescription: 'SEO描述', icon: '图标',
  phone: '电话', createdAt: '创建时间', source: '来源', duration: '时长', type: '类型', mimeType: 'MIME', assignedTo: '负责人',
};

function formatValue(value: unknown, key: string) {
  if (value == null || value === '') return '—';
  if (key === 'status') return String(value);
  if (key === 'createdAt' || key === 'publishedAt') return new Date(String(value)).toLocaleString('zh-CN', { hour12: false });
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).slice(0, 100);
}

function inputValue(value: unknown, type: string) {
  if (value == null) return '';
  if (type === 'json') return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (type === 'datetime') return String(value).slice(0, 16);
  if (type === 'date') return String(value).slice(0, 10);
  return value;
}

function statusClass(value: string) {
  if (value === 'PUBLISHED' || value === 'CONVERTED' || value === 'ACTIVE') return 'status-published';
  if (value === 'DRAFT' || value === 'NEW' || value === 'CONTACTED' || value === 'FOLLOWING') return 'status-draft';
  return 'status-archived';
}

export default function CmsAdminPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const type = params?.type || '';
  const config = configs[type];
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [id, setId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [followupText, setFollowupText] = useState('');
  const [saving, setSaving] = useState(false);

  const createBlank = useCallback(() => {
    const next: Record<string, any> = { ...(defaults[type] || {}) };
    config?.fields.forEach(([key, , fieldType]) => {
      if (next[key] === undefined) next[key] = fieldType.includes('number') ? 0 : '';
    });
    return next;
  }, [config, type]);

  const load = useCallback(async () => {
    if (!type || !config) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const response = await fetch(`/api/admin/cms/${type}?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || '读取失败');
      setItems(result.data || []);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '读取失败');
    } finally {
      setLoading(false);
    }
  }, [config, q, status, type]);

  useEffect(() => { if (type === 'media') { router.replace('/admin/files'); return; } if (type === 'pages') { router.replace('/admin/pages'); return; } void load(); }, [load, router, type]);
  useEffect(() => { if (config && !drawerOpen) setForm(createBlank()); }, [config, createBlank, drawerOpen]);

  const filteredCount = items.length;
  const columnLabels = useMemo(() => config?.columns.map(key => labels[key] || key) || [], [config]);

  if (!config) return <main className="admin-page"><div className="admin-loading">正在加载 CMS 模块...</div></main>;

  function newItem() {
    setId(null);
    setForm(createBlank());
    setFollowupText('');
    setMsg('');
    setDrawerOpen(true);
  }

  function edit(item: any) {
    const next: Record<string, any> = {};
    config.fields.forEach(([key, , fieldType]) => { next[key] = inputValue(item[key], fieldType); });
    setId(item.id);
    setForm(next);
    setFollowupText('');
    setMsg('');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setId(null);
    setFollowupText('');
    setMsg('');
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const payload: Record<string, any> = { ...form };
      config.fields.forEach(([key, , fieldType]) => {
        if (fieldType.includes('json') && typeof payload[key] === 'string' && payload[key]) payload[key] = JSON.parse(payload[key]);
        if (fieldType === 'number') payload[key] = Number(payload[key] || 0);
      });
      const response = await fetch(id ? `/api/admin/cms/${type}/${id}` : `/api/admin/cms/${type}`, {
        method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || '保存失败');
      setMsg('保存成功');
      setId(result.data.id);
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '保存失败，请检查 JSON 格式');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: any) {
    if (!window.confirm(`确定删除「${item.title || item.name || item.question || `#${item.id}`}」吗？删除后不可恢复。`)) return;
    const response = await fetch(`/api/admin/cms/${type}/${item.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!result.success) setMsg(result.message || '删除失败');
    else { setMsg('已删除'); if (id === item.id) closeDrawer(); await load(); }
  }

  async function addFollowup() {
    if (type !== 'leads' || !id || !followupText.trim()) return;
    const response = await fetch(`/api/admin/leads/${id}/followups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: followupText.trim() }) });
    const result = await response.json();
    if (!result.success) { setMsg(result.message || '跟进记录失败'); return; }
    setFollowupText('');
    setMsg('跟进已记录');
    await load();
  }

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div><div className="admin-eyebrow">CMS / {type.toUpperCase()}</div><h1>{config.title}</h1><p>{config.desc} 采用“列表 + 编辑抽屉”，减少页面滚动，让日常录入更快。</p></div>
        <Link href="/admin" className="admin-back">← 返回工作台</Link>
      </div>

      <section className="admin-section-card compact">
        <div className="cms-toolbar">
          <div><strong>{config.title}列表</strong><span>共 {filteredCount} 条</span></div>
          <div className="cms-filters">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={`搜索${config.title}...`} />
            {config.statuses && <select value={status} onChange={e => setStatus(e.target.value)}><option value="">全部状态</option>{config.statuses.map(item => <option key={item} value={item}>{item}</option>)}</select>}
            <button onClick={() => void load()}>刷新</button>
            <button className="admin-primary-button" onClick={newItem}>＋ 新增</button>
          </div>
        </div>
        {loading ? <div className="admin-loading">加载中...</div> : (
          <div className="cms-table-wrap">
            <table>
              <thead><tr>{columnLabels.map((label, index) => <th key={config.columns[index]}>{label}</th>)}<th>操作</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    {config.columns.map(key => <td key={key}>{key === 'status' ? <span className={`admin-status ${statusClass(String(item[key]))}`}>{formatValue(item[key], key)}</span> : formatValue(item[key], key)}</td>)}
                    <td><div className="cms-actions"><button onClick={() => edit(item)}>编辑</button>{type === 'leads' && <button onClick={() => edit(item)}>跟进</button>}<button className="danger" onClick={() => void remove(item)}>删除</button></div></td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={config.columns.length + 1}><div className="empty">暂无内容，点击右上角“新增”开始创建。</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drawerOpen && (
        <div className="admin-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeDrawer(); }}>
          <aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={id ? `编辑${config.title}` : `新增${config.title}`}>
            <div className="admin-drawer-head">
              <div><div className="admin-eyebrow">{id ? `EDIT / #${id}` : `NEW / ${type.toUpperCase()}`}</div><h2>{id ? `编辑${config.title}` : `新增${config.title}`}</h2><p>内容保存后会进入对应前台页面。发布状态决定前台是否展示。</p></div>
              <button className="admin-drawer-close" onClick={closeDrawer} aria-label="关闭">×</button>
            </div>

            <div className="cms-form-grid">
              {config.fields.map(([key, label, fieldType]) => {
                if (key === 'coverImage') return <AssetPicker key={key} label={label} folder={`${type}/cover`} accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={50} value={form[key] ?? ''} onChange={x => setForm({ ...form, [key]: x.url })} helper="统一从文件资产中心选择或上传图片。" />;
                if (key === 'thumbnail') return <AssetPicker key={key} label={label} folder={`${type}/thumbnail`} accept=".png,.jpg,.jpeg,.webp" type="IMAGE" maxSizeMb={30} value={form[key] ?? ''} onChange={x => setForm({ ...form, [key]: x.url })} helper="用于资源卡片或媒体缩略图。" />;
                if (key === 'videoUrl') return <AssetPicker key={key} label={label} folder={`${type}/video`} accept=".mp4,.webm,.mov,.m4v" type="VIDEO" maxSizeMb={4096} value={form[key] ?? ''} onChange={x => setForm({ ...form, [key]: x.url })} helper="优先上传 MP4（H.264 / AAC）；MOV / HEVC 仅作为兼容存档。" />;
                if (key === 'fileUrl') return <AssetPicker key={key} label={label} folder={`${type}/files`} accept=".mp4,.webm,.mov,.m4v,.md,.txt,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.json" maxSizeMb={8192} value={form[key] ?? ''} onChange={x => setForm({ ...form, [key]: x.url })} helper="文档、视频与压缩包均可；视频优先使用 MP4（H.264 / AAC）。" />;
                if (key === 'url' && type === 'media') return <AssetPicker key={key} label={label} folder="media" accept=".png,.jpg,.jpeg,.webp,.svg,.mp4,.webm,.mov,.mp3,.wav,.pdf,.md,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.json" maxSizeMb={8192} value={form[key] ?? ''} onChange={x => setForm({ ...form, [key]: x.url })} helper="媒体资源统一入口。" />;
                return <label key={key} className={fieldType.includes('full') ? 'full' : ''}>
                  <span>{label}</span>
                  {fieldType.includes('textarea') || fieldType.includes('json') ? (
                    <textarea rows={fieldType.includes('json') ? 6 : 8} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={fieldType.includes('json') ? '请输入合法 JSON' : ''} />
                  ) : fieldType === 'select' ? (
                    <select value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })}>
                      {(key === 'status' ? config.statuses || [] : key === 'source' ? ['WEBSITE', 'DOWNLOAD', 'DEMO', 'PRODUCT', 'SKILL', 'PROMPT', 'CASE', 'CONTACT', 'OTHER'] : key === 'type' ? ['IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'] : ['ACTIVE']).map(option => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : fieldType === 'datetime' ? 'datetime-local' : 'text'} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: fieldType === 'number' ? Number(e.target.value) : e.target.value })} />
                  )}
                </label>;
              })}
            </div>

            {type === 'leads' && id && (
              <div className="followup-box">
                <div><strong>快速跟进</strong><span>把本次沟通记录追加到线索跟进历史。</span></div>
                <textarea rows={4} value={followupText} onChange={e => setFollowupText(e.target.value)} placeholder="例如：已电话沟通，客户关注 AI 短视频私有部署..." />
                <button className="admin-secondary-button" onClick={() => void addFollowup()} disabled={!followupText.trim()}>＋ 记录本次跟进</button>
              </div>
            )}

            <div className="admin-drawer-footer">
              <div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div>
              <div className="admin-form-actions" style={{ marginTop: 0 }}><button className="admin-ghost-button" onClick={closeDrawer}>取消</button><button className="admin-primary-button" onClick={() => void save()} disabled={saving}>{saving ? '保存中...' : '保存内容'}</button></div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
