'use client';

import { useEffect, useState } from 'react';
import AssetPicker from '@/components/admin/asset-picker';

const blank = { name: '', type: 'CLIENT', platform: 'WINDOWS', status: 'ACTIVE', description: '', sortOrder: 0 };
const versionBlank = { version: '', url: '', extractionCode: '', sourceType: 'baidu', releaseNotes: '', fileAssetId: null as number | null, fileName: '', isLatest: true };

type DrawerMode = 'product' | 'version' | null;

export default function DownloadsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [versionForm, setVersionForm] = useState<any>(versionBlank);
  const [selected, setSelected] = useState<any>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/downloads', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || '读取下载列表失败');
    setItems(result.data || []);
  }

  useEffect(() => { void load().catch((error) => setMsg(error instanceof Error ? error.message : '读取下载列表失败')); }, []);

  function openCreateProduct() {
    setForm({ ...blank });
    setEditingProductId(null);
    setMsg('');
    setDrawer('product');
  }

  function openEditProduct(item: any) {
    setForm({
      name: item.name || '',
      type: item.type || 'CLIENT',
      platform: item.platform || '',
      status: item.status || 'ACTIVE',
      description: item.description || '',
      sortOrder: Number(item.sortOrder || 0),
    });
    setEditingProductId(Number(item.id));
    setSelected(item);
    setMsg('');
    setDrawer('product');
  }

  function openAddVersion(item: any) {
    setSelected(item);
    setEditingVersionId(null);
    setVersionForm({ ...versionBlank, isLatest: true });
    setMsg('');
    setDrawer('version');
  }

  function openEditVersion(item: any, version: any) {
    setSelected(item);
    setEditingVersionId(Number(version.id));
    setVersionForm({
      ...versionBlank,
      version: version.version || '',
      url: version.url || '',
      extractionCode: version.extractionCode || '',
      sourceType: version.sourceType || 'baidu',
      releaseNotes: version.releaseNotes || '',
      isLatest: Boolean(version.isLatest),
      fileAssetId: null,
      fileName: '',
    });
    setMsg('');
    setDrawer('version');
  }

  async function saveProduct() {
    if (!form.name.trim()) { setMsg('下载项名称不能为空'); return; }
    setSaving(true); setMsg('');
    try {
      const isEditing = editingProductId !== null;
      const endpoint = isEditing ? `/api/admin/downloads/${editingProductId}` : '/api/admin/downloads';
      const result = await (await fetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })).json();
      if (!result.success) throw new Error(result.message || (isEditing ? '更新失败' : '创建失败'));
      setMsg(isEditing ? '下载项已更新' : '下载项已创建');
      setDrawer(null); setEditingProductId(null); setForm({ ...blank });
      await load();
    } catch (error) { setMsg(error instanceof Error ? error.message : '保存下载项失败'); }
    finally { setSaving(false); }
  }

  async function saveVersion() {
    if (!selected) return;
    if (!String(versionForm.version || '').trim() || !String(versionForm.url || '').trim()) { setMsg('版本号和下载文件不能为空'); return; }
    setSaving(true); setMsg('');
    try {
      const isEditing = editingVersionId !== null;
      const payload = { ...versionForm, isLatest: Boolean(versionForm.isLatest), ...(isEditing ? { versionId: editingVersionId } : { isLatest: true }) };
      const result = await (await fetch(`/api/admin/downloads/${selected.id}/versions`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })).json();
      if (!result.success) throw new Error(result.message || (isEditing ? '版本更新失败' : '版本添加失败'));
      setMsg(isEditing ? '版本已更新' : '版本已添加'); setDrawer(null); setEditingVersionId(null); setVersionForm({ ...versionBlank }); await load();
    } catch (error) { setMsg(error instanceof Error ? error.message : '保存版本失败'); }
    finally { setSaving(false); }
  }

  return (
    <main className="admin-page downloads-admin-page">
      <div className="admin-page-header">
        <div><div className="admin-eyebrow">OPERATIONS / DOWNLOADS</div><h1>下载与版本管理</h1><p>下载产品描述“是什么”，版本记录决定“下载哪个版本”。可以随时编辑名称、平台、状态、下载地址和更新说明。</p></div>
      </div>
      <section className="admin-section-card compact">
        <div className="cms-toolbar"><div><strong>下载产品</strong><span>{items.length} 个</span></div><div className="cms-filters"><button type="button" onClick={() => { setMsg(''); void load().catch((error) => setMsg(error instanceof Error ? error.message : '刷新失败')); }}>刷新</button><button type="button" className="admin-primary-button" onClick={openCreateProduct}>＋ 新增下载项</button></div></div>
        {msg && !drawer && <div className={`admin-save-message${/失败|无权限|不能为空/.test(msg) ? ' admin-error-message' : ''}`} style={{ marginBottom: 12 }}>{msg}</div>}
        <div className="cms-table-wrap"><table><thead><tr><th>名称</th><th>类型</th><th>平台</th><th>状态</th><th>版本 / 下载地址</th><th>操作</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}>
            <td><strong>{item.name}</strong><div style={{ color: '#94a0b2', marginTop: 3 }}>{item.description || '暂无描述'}</div></td>
            <td>{item.type}</td><td>{item.platform || '—'}</td>
            <td><span className={`admin-status ${item.status === 'ACTIVE' ? 'status-published' : 'status-inactive'}`}>{item.status}</span></td>
            <td><div className="download-version-list">{item.versions?.length ? item.versions.map((version: any) => <div className="download-version-row" key={version.id}>
              <div className="download-version-info"><strong>{version.version}{version.isLatest ? ' · 最新' : ''}</strong><small title={version.url}>{version.url}</small></div>
              <button type="button" onClick={() => openEditVersion(item, version)}>编辑版本</button>
            </div>) : <span className="download-no-version">暂无版本</span>}</div></td>
            <td><div className="cms-actions download-product-actions"><button type="button" onClick={() => openEditProduct(item)}>编辑下载项</button><button type="button" onClick={() => openAddVersion(item)}>添加版本</button></div></td>
          </tr>)}
          {!items.length && <tr><td colSpan={6}><div className="empty">暂无下载产品，点击“新增下载项”开始配置。</div></td></tr>}
        </tbody></table></div>
      </section>

      {drawer && <div className="admin-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDrawer(null); }}><aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer-head"><div>
          <div className="admin-eyebrow">{drawer === 'product' ? (editingProductId ? 'EDIT / DOWNLOAD' : 'NEW / DOWNLOAD') : (editingVersionId ? 'EDIT / VERSION' : 'NEW / VERSION')}</div>
          <h2>{drawer === 'product' ? (editingProductId ? `编辑「${selected?.name || form.name}」` : '新增下载产品') : `${editingVersionId ? '编辑' : '为'}「${selected?.name}」${editingVersionId ? '的版本' : '添加版本'}`}</h2>
          <p>{drawer === 'product' ? '维护下载项名称、分类、平台、展示状态和排序；具体文件地址在版本记录中管理。' : '编辑版本号、文件地址、提取码、更新说明和最新版本状态。'}</p>
        </div><button type="button" className="admin-drawer-close" onClick={() => !saving && setDrawer(null)} aria-label="关闭">×</button></div>
        <div className="downloads-drawer-content">
          {drawer === 'product' ? <div className="cms-form-grid">
            <label><span>名称 *</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label><span>类型</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{['CLIENT', 'AGENT', 'SKILL', 'TEMPLATE', 'RESOURCE', 'OTHER'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>平台</span><select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}><option value="">不指定</option>{['WINDOWS', 'MACOS', 'LINUX', 'WEB', 'ANDROID', 'IOS', 'OTHER'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>状态</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">启用</option><option value="INACTIVE">停用</option></select></label>
            <label><span>排序</span><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label>
            <label className="full"><span>描述</span><textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          </div> : <div className="cms-form-grid">
            <label><span>版本号 *</span><input value={versionForm.version} onChange={(event) => setVersionForm({ ...versionForm, version: event.target.value })} placeholder="例如：3.0.1" /></label>
            <label><span>来源类型</span><select value={versionForm.sourceType} onChange={(event) => setVersionForm({ ...versionForm, sourceType: event.target.value })}><option value="baidu">百度网盘</option><option value="oss">OSS / COS</option><option value="server">服务器</option><option value="github">GitHub</option><option value="other">其他</option></select></label>
            <AssetPicker label="下载文件 / 资源 *" folder="downloads" accept=".zip,.rar,.7z,.exe,.dmg,.pkg,.tar,.gz,.pdf,.doc,.docx,.mp4" maxSizeMb={8192} value={versionForm.url} assetId={versionForm.fileAssetId} onChange={(value) => setVersionForm({ ...versionForm, url: value.url, fileAssetId: value.assetId ?? null, fileName: value.fileName ?? '' })} helper="可以选择文件资产，也可以把百度网盘等外部下载链接粘贴到地址字段。" />
            <label><span>外部下载地址 / URL</span><input value={versionForm.url} onChange={(event) => setVersionForm({ ...versionForm, url: event.target.value })} placeholder="https://..." /></label>
            <label><span>提取码</span><input value={versionForm.extractionCode} onChange={(event) => setVersionForm({ ...versionForm, extractionCode: event.target.value })} /></label>
            <label><span>更新说明</span><input value={versionForm.releaseNotes} onChange={(event) => setVersionForm({ ...versionForm, releaseNotes: event.target.value })} /></label>
            <label className="downloads-latest-toggle"><input type="checkbox" checked={Boolean(versionForm.isLatest)} onChange={(event) => setVersionForm({ ...versionForm, isLatest: event.target.checked })} /><span>设为最新版本（会取消该下载项其他版本的“最新”状态）</span></label>
          </div>}
        </div>
        <div className="admin-drawer-footer"><div>{msg && <span className={/失败|不能为空|无效|不存在|权限/.test(msg) ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div><div className="admin-form-actions" style={{ marginTop: 0 }}><button type="button" className="admin-ghost-button" disabled={saving} onClick={() => setDrawer(null)}>取消</button><button type="button" className="admin-primary-button" disabled={saving} onClick={() => void (drawer === 'product' ? saveProduct() : saveVersion())}>{saving ? '保存中...' : drawer === 'product' ? (editingProductId ? '保存修改' : '创建下载项') : (editingVersionId ? '保存版本修改' : '添加版本')}</button></div></div>
      </aside></div>}
    </main>
  );
}
