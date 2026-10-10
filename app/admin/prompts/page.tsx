'use client';

import { useEffect, useState } from 'react';
import AssetPicker from '@/components/admin/asset-picker';
import FileUploader from '@/components/admin/file-uploader';

const blank = { title: '', slug: '', description: '', content: '', usage: '', model: '', categoryId: '', status: 'DRAFT', tags: '', fileAssetId: null as number | null, fileName: '', fileType: '', fileUrl: '' };
const statusLabels: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' };

export default function PromptAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [id, setId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const [a, b] = await Promise.all([fetch('/api/admin/prompts', { cache: 'no-store' }), fetch('/api/admin/prompt-categories', { cache: 'no-store' })]);
    setItems((await a.json()).data || []);
    setCats((await b.json()).data || []);
  }
  useEffect(() => { void load(); }, []);

  function edit(item: any) {
    setId(item.id);
    setForm({
      title: item.title ?? '',
      slug: item.slug ?? '',
      description: item.description ?? '',
      content: item.content ?? '',
      usage: item.usage ?? '',
      model: item.model ?? '',
      categoryId: item.categoryId ?? '',
      status: item.status ?? 'DRAFT',
      tags: item.tags ? JSON.stringify(item.tags, null, 2) : '',
      fileAssetId: item.fileAssetId ?? null, fileName: item.fileName ?? '', fileType: item.fileType ?? '', fileUrl: item.fileAsset?.url ?? item.fileUrl ?? '',
    });
    setMsg(''); setDrawerOpen(true);
  }
  function create() { setId(null); setForm({ ...blank }); setMsg(''); setDrawerOpen(true); }
  function close() { setDrawerOpen(false); setId(null); setForm({ ...blank }); setMsg(''); }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const payload = { ...form, categoryId: form.categoryId || null, tags: form.tags ? JSON.parse(form.tags) : null };
      const response = await fetch(id ? `/api/admin/prompts/${id}` : '/api/admin/prompts', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || '保存失败');
      setMsg('保存成功'); await load();
    } catch (error) { setMsg(error instanceof Error ? error.message : '保存失败，请检查 JSON'); }
    finally { setSaving(false); }
  }

  async function remove(item: any) {
    if (!window.confirm(`确定删除提示词「${item.title}」吗？此操作不可恢复。`)) return;
    setMsg('');
    try {
      const response = await fetch(`/api/admin/prompts/${item.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '删除提示词失败');
      setMsg(`已删除提示词：${item.title}`);
      if (id === item.id) close();
      await load();
    } catch (error) { setMsg(error instanceof Error ? error.message : '删除提示词失败'); }
  }

  async function newCat() {
    const name = window.prompt('分类名称'); if (!name) return;
    const slug = window.prompt('分类 Slug', name.toLowerCase().replace(/\s+/g, '-')); if (!slug) return;
    const response = await fetch('/api/admin/prompt-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug }) });
    const result = await response.json(); setMsg(result.success ? '分类已创建' : result.message || '分类创建失败'); await load();
  }

  const visible = items.filter(item => !search.trim() || `${item.title} ${item.slug} ${item.model}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <main className="admin-page">
      <div className="admin-page-header"><div><div className="admin-eyebrow">CONTENT / PROMPTS</div><h1>Prompt 提示词中心</h1><p>管理提示词、分类、模型、使用方法与发布状态。采用列表优先的工作方式，编辑时才展开完整内容。</p></div></div>
      <section className="admin-section-card compact">
        <div className="cms-toolbar"><div><strong>Prompt 列表</strong><span>{visible.length} / {items.length} 条</span></div><div className="cms-filters"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标题、Slug、模型..." /><button onClick={() => void load()}>刷新</button><button onClick={() => void newCat()}>管理分类</button><button className="admin-primary-button" onClick={create}>＋ 新增 Prompt</button></div></div>
        {msg && !drawerOpen && <div className="admin-save-message" style={{ marginBottom: 12 }}>{msg}</div>}
        <div className="cms-table-wrap"><table><thead><tr><th>标题</th><th>分类</th><th>模型</th><th>状态</th><th>操作</th></tr></thead><tbody>
          {visible.map(item => <tr key={item.id}><td><strong>{item.title}</strong><div style={{ color: '#94a0b2', marginTop: 3 }}>{item.slug}</div></td><td>{item.category?.name || '未分类'}</td><td>{item.model || '—'}</td><td><span className={`admin-status ${item.status === 'PUBLISHED' ? 'status-published' : 'status-draft'}`}>{statusLabels[item.status] || item.status}</span></td><td><div className="cms-actions"><button onClick={() => edit(item)}>编辑</button><button onClick={() => void remove(item)} style={{ color: "#b42318" }}>删除</button></div></td></tr>)}
          {!visible.length && <tr><td colSpan={5}><div className="empty">暂无 Prompt</div></td></tr>}
        </tbody></table></div>
      </section>

      {drawerOpen && <div className="admin-drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer-head"><div><div className="admin-eyebrow">{id ? `EDIT / #${id}` : 'NEW / PROMPT'}</div><h2>{id ? '编辑 Prompt' : '创建 Prompt'}</h2><p>提示词正文和使用方法可以在这里集中维护。</p></div><button className="admin-drawer-close" onClick={close} aria-label="关闭">×</button></div>
        <div className="cms-form-grid">
          <label><span>标题</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></label>
          <label><span>分类</span><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">未分类</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label><span>模型</span><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="例如：GPT / Claude / Gemini" /></label>
          <label><span>状态</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="DRAFT">草稿</option><option value="PUBLISHED">已发布</option><option value="ARCHIVED">已归档</option></select></label>
          <label><span>分类操作</span><button className="admin-secondary-button" type="button" onClick={() => void newCat()}>＋ 新建分类</button></label>
          <label className="full"><span>简介</span><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label className="full"><span>文字说明（可选）</span><textarea rows={7} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="这里用于介绍、摘要、适用场景；核心 Prompt 建议以文件形式上传。" /></label>
          <label className="full"><span>使用方法</span><textarea rows={7} value={form.usage} onChange={e => setForm({ ...form, usage: e.target.value })} /></label>
          <section className="full" style={{ border: '1px solid #dbe5f2', borderRadius: 16, padding: 14, background: '#fbfdff' }}>
            <div style={{ marginBottom: 10 }}><strong>Prompt 核心文件</strong><div style={{ color: '#70809a', fontSize: 13, marginTop: 4 }}>Prompt 的核心交付物是文件；文字说明只负责简介、适用场景和使用方法。支持 MD / TXT / DOC / DOCX / PDF / JSON / ZIP。</div></div>
            <FileUploader folder="prompts" accept=".md,.txt,.doc,.docx,.pdf,.zip,.json" type={['MARKDOWN','TEXT','WORD','PDF','ARCHIVE','FILE']} maxSizeMb={2048} multiple={false} onUploaded={(result) => setForm((f:any) => ({ ...f, fileAssetId: result.assetId ?? null, fileName: result.file.name, fileType: result.mimeType || result.file.type, fileUrl: result.url }))} />
            {form.fileAssetId ? <div className="admin-save-message" style={{ marginTop: 10 }}>已选择：{form.fileName || 'Prompt 文件'}（资源 #{form.fileAssetId}）</div> : <div className="storage-note" style={{ marginTop: 10 }}>也可以使用下面的资源选择器，从已经上传过的文件中复用。</div>}
            <div style={{ marginTop: 10 }}><AssetPicker label="从文件素材库选择已有 Prompt 文件" folder="prompts" accept=".md,.txt,.doc,.docx,.pdf,.zip,.json" maxSizeMb={2048} value={form.fileUrl} assetId={form.fileAssetId} onChange={(x) => setForm((f:any) => ({ ...f, fileAssetId: x.assetId ?? null, fileName: x.fileName ?? '', fileType: x.fileType ?? '', fileUrl: x.url }))} helper="文件会进入统一文件素材库供复用；不会在资源中心内容列表中新增一条 Prompt 记录。" /></div>
          </section>
          <label className="full"><span>Tags JSON</span><textarea rows={4} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder='["视频","营销"]' /></label>
        </div>
        <div className="admin-drawer-footer"><div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div><div className="admin-form-actions" style={{ marginTop: 0 }}><button className="admin-ghost-button" onClick={close}>取消</button><button className="admin-primary-button" onClick={() => void save()} disabled={saving}>{saving ? '保存中...' : '保存 Prompt'}</button></div></div>
      </aside></div>}
    </main>
  );
}
