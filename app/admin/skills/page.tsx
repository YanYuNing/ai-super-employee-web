'use client';

import { useEffect, useState } from 'react';
import FileUploader, { type UploadedResult } from '@/components/admin/file-uploader';
import AssetPicker from '@/components/admin/asset-picker';

const statusLabels: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' };

const blank = {
  name: '', slug: '', description: '', content: '', version: '', status: 'DRAFT', sortOrder: 0,
  tags: '', seoTitle: '', seoDescription: '', coverImage: '', icon: '',
};

export default function SkillsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [id, setId] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionDraft, setVersionDraft] = useState('');
  const [releaseNotesDraft, setReleaseNotesDraft] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await (await fetch('/api/admin/skills', { cache: 'no-store' })).json();
      setItems(result.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function edit(item: any) {
    setId(item.id);
    setForm({
      ...blank,
      ...item,
      name: item.name ?? '', slug: item.slug ?? '', description: item.description ?? '', content: item.content ?? '',
      version: item.version ?? '', status: item.status ?? 'DRAFT', sortOrder: item.sortOrder ?? 0,
      tags: item.tags ? JSON.stringify(item.tags, null, 2) : '', seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '', coverImage: item.coverImage ?? '', icon: item.icon ?? '',
    });
    setVersions(item.versions || []);
    setVersionDraft('');
    setReleaseNotesDraft('');
    setMsg('');
    setDrawer(true);
  }

  function create() {
    setId(null);
    setForm({ ...blank });
    setVersions([]);
    setVersionDraft('');
    setReleaseNotesDraft('');
    setMsg('');
    setDrawer(true);
  }

  function close() {
    setDrawer(false);
    setId(null);
    setVersions([]);
    setForm({ ...blank });
    setVersionDraft('');
    setReleaseNotesDraft('');
    setMsg('');
  }

  async function saveBasic(showMessage = true): Promise<number | null> {
    if (!form.name.trim() || !form.slug.trim()) {
      if (showMessage) setMsg('名称和 Slug 为必填项');
      return null;
    }
    const payload = { ...form, tags: form.tags ? JSON.parse(form.tags) : null };
    const response = await fetch(id ? `/api/admin/skills/${id}` : '/api/admin/skills', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || '保存 Skill 失败');
    const savedId = Number(result.data.id);
    setId(savedId);
    if (showMessage) setMsg('Skill 基础信息已保存');
    await load();
    return savedId;
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await saveBasic(true);
      setMsg('保存成功');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '保存失败，请检查 JSON');
    } finally {
      setSaving(false);
    }
  }

  async function bindVersion(result: UploadedResult) {
    if (!result.assetId) {
      setMsg('文件已经上传，但没有生成资源编号，请检查文件素材库与数据库结构。');
      return;
    }
    if (!versionDraft.trim()) {
      setMsg('请先填写版本号，再上传 Skill 压缩包。');
      return;
    }

    setUploadingVersion(true);
    setMsg('正在绑定 Skill 版本…');
    try {
      const skillId = id ?? await saveBasic(false);
      if (!skillId) throw new Error('无法保存 Skill 基础信息');
      const response = await (await fetch(`/api/admin/skills/${skillId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionDraft.trim(),
          releaseNotes: releaseNotesDraft,
          fileUrl: result.url,
          fileSize: result.file.size,
          fileAssetId: result.assetId,
          fileName: result.file.name,
          mimeType: result.mimeType || result.file.type,
          isLatest: true,
        }),
      })).json();
      if (!response.success) throw new Error(response.message || '版本绑定失败');
      setVersions(prev => [response.data, ...prev]);
      setForm((prev: any) => ({ ...prev, version: versionDraft.trim() }));
      setVersionDraft('');
      setReleaseNotesDraft('');
      setMsg(`Skill ${String(response.data.version || versionDraft).trim()} 已上传并成为当前版本`);
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Skill 版本上传失败');
    } finally {
      setUploadingVersion(false);
    }
  }

  async function remove(item: any) {
    if (!window.confirm(`确定删除 Skill「${item.name}」吗？其版本记录也会一并删除，此操作不可恢复。`)) return;
    setMsg('');
    try {
      const response = await fetch(`/api/admin/skills/${item.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '删除 Skill 失败');
      setMsg(`已删除 Skill：${item.name}`);
      if (id === item.id) close();
      await load();
    } catch (error) { setMsg(error instanceof Error ? error.message : '删除 Skill 失败'); }
  }

  const visible = items.filter(item => !search.trim() || `${item.name} ${item.slug} ${item.version}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">CONTENT / SKILLS</div>
          <h1>Skills 技能中心</h1>
          <p>管理 Skill 简介、封面、版本包、发布状态与 SEO。Skill 本体以压缩包文件交付，文字字段只负责说明。</p>
        </div>
      </div>

      <section className="admin-section-card compact">
        <div className="cms-toolbar">
          <div><strong>Skill 列表</strong><span>{visible.length} / {items.length} 个</span></div>
          <div className="cms-filters">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 Skill..." />
            <button onClick={() => void load()}>刷新</button>
            <button className="admin-primary-button" onClick={create}>＋ 新增 Skill</button>
          </div>
        </div>
        {msg && !drawer && <div className="admin-save-message" style={{ marginBottom: 12 }}>{msg}</div>}
        {loading ? <div className="admin-loading">加载中...</div> : <div className="cms-table-wrap"><table><thead><tr><th>名称</th><th>Slug</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody>
          {visible.map(item => <tr key={item.id}><td><strong>{item.name}</strong><div style={{ color: '#94a0b2', marginTop: 3 }}>{item.description || '暂无简介'}</div></td><td>{item.slug}</td><td>{item.version || '—'}</td><td><span className={`admin-status ${item.status === 'PUBLISHED' ? 'status-published' : 'status-draft'}`}>{statusLabels[item.status] || item.status}</span></td><td><div className="cms-actions"><button onClick={() => edit(item)}>编辑</button><button onClick={() => void remove(item)} style={{ color: "#b42318" }}>删除</button></div></td></tr>)}
          {!visible.length && <tr><td colSpan={5}><div className="empty">暂无 Skill</div></td></tr>}
        </tbody></table></div>}
      </section>

      {drawer && <div className="admin-drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer-head"><div><div className="admin-eyebrow">{id ? `EDIT / #${id}` : 'NEW / SKILL'}</div><h2>{id ? '编辑 Skill' : '创建 Skill'}</h2><p>先维护 Skill 基础信息，再上传核心压缩包；新建时上传会自动先保存基础信息。</p></div><button className="admin-drawer-close" onClick={close} aria-label="关闭">×</button></div>
        <div className="cms-form-grid">
          <label><span>名称</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></label>
          <label><span>当前版本</span><input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></label>
          <label><span>排序</span><input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
          <label><span>状态</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="DRAFT">草稿</option><option value="PUBLISHED">已发布</option><option value="ARCHIVED">已归档</option></select></label>
          <AssetPicker label="Skill 图标" folder="skills/icon" accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={20} value={form.icon} onChange={x => setForm({ ...form, icon: x.url })} helper="上传后可在其他内容中复用。" />
          <label className="full"><span>简介</span><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label className="full"><span>内容说明（可选）</span><textarea rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="这里填写 Skill 的介绍、适用场景和使用说明；Skill 本体不要粘贴到这里。" /></label>
          <label className="full"><span>Tags JSON</span><textarea rows={4} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder='["视频","营销"]' /></label>
          <label><span>SEO 标题</span><input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} /></label>
          <label><span>SEO 描述</span><input value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} /></label>
          <AssetPicker label="Skill 封面" folder="skills/cover" accept=".png,.jpg,.jpeg,.webp" type="IMAGE" maxSizeMb={50} value={form.coverImage} onChange={x => setForm({ ...form, coverImage: x.url })} helper="用于 Skill 详情页和资源卡片。" />
        </div>

        <section className="version-panel">
          <div className="version-upload-heading">
            <div><h3>Skill 核心版本包</h3><p>这里上传真正可交付的 Skill 压缩包，不需要把文件内容复制到“内容说明”里。支持 ZIP / RAR / 7Z / TAR / GZ / TGZ。</p></div>
          </div>
          <div className="cms-form-grid" style={{ marginBottom: 12 }}>
            <label><span>上传版本号</span><input value={versionDraft} onChange={e => setVersionDraft(e.target.value)} placeholder="例如 V13 / 1.0.1" /></label>
            <label><span>版本更新说明</span><input value={releaseNotesDraft} onChange={e => setReleaseNotesDraft(e.target.value)} placeholder="本版本做了哪些更新" /></label>
          </div>
          <FileUploader folder="skills" type="ARCHIVE" accept=".zip,.rar,.7z,.tar,.gz,.tgz" multiple={false} maxSizeMb={4096} onUploaded={(result) => { void bindVersion(result); }} />
          {!id && <p className="storage-note">新建 Skill 时这里仍然可以直接上传；系统会先自动保存名称、Slug 等基础信息，再把压缩包写入版本记录。</p>}
          {uploadingVersion && <div className="admin-save-message">正在绑定版本记录，请稍候…</div>}
          {versions.length ? <div className="version-list">{versions.map(v => <div key={v.id}><strong>{v.version}</strong><span>{v.isLatest ? '当前版本' : '历史版本'}</span><small>{v.fileName || 'Skill 压缩包'}</small><a href={v.fileUrl} target="_blank" rel="noreferrer">打开/下载</a></div>)}</div> : <div className="empty" style={{ padding: 20 }}>暂无版本，请上传第一个 Skill 包。</div>}
        </section>

        <div className="admin-drawer-footer"><div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div><div className="admin-form-actions" style={{ marginTop: 0 }}><button className="admin-ghost-button" onClick={close}>取消</button><button className="admin-primary-button" onClick={() => void save()} disabled={saving}>{saving ? '保存中...' : '保存 Skill'}</button></div></div>
      </aside></div>}
    </main>
  );
}
