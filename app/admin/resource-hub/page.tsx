'use client';

import { useEffect, useState } from 'react';

const labels: Record<string, string> = { skills: 'Skills', prompts: 'Prompt', guides: '教程与使用手册', downloads: '产品下载', materials: '行业资料与资源' };

export default function ResourceHubAdmin() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/resource-hub', { cache: 'no-store' });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || '读取失败');
      setBlocks(result.data?.blocks || []);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '读取资源中心配置失败');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);
  function update(index: number, key: string, value: unknown) { setBlocks((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  function move(index: number, direction: -1 | 1) { const next = index + direction; if (next < 0 || next >= blocks.length) return; setBlocks((items) => { const copy = [...items]; const [item] = copy.splice(index, 1); copy.splice(next, 0, item); return copy; }); }
  async function save() {
    setSaving(true); setMsg('');
    try {
      const response = await fetch('/api/admin/resource-hub', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '保存失败');
      setBlocks(result.data.blocks || []); setMsg('已保存：首页资源中心和资源中心页面会同步使用这套模块结构。');
    } catch (error) { setMsg(error instanceof Error ? error.message : '保存失败'); }
    finally { setSaving(false); }
  }
  return (
    <main className="admin-page resource-hub-admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">CONTENT / RESOURCE HUB</div>
          <h1>资源中心编排</h1>
          <p>只管理资源中心的“功能入口”，不重复管理具体 Skill、Prompt 或资料。首页和官网资源中心都会同步使用这里的顺序、标题、说明与入口。</p>
        </div>
        <div className="resource-hub-admin-header-status"><span>5 个功能区块</span><small>前台统一导航</small></div>
      </div>

      <section className="resource-hub-admin-summary">
        <div><span>能力库</span><strong>Skills</strong><small>独立维护 · /skills</small></div>
        <div><span>表达库</span><strong>Prompt</strong><small>独立维护 · /prompts</small></div>
        <div><span>上手区</span><strong>教程 / 手册</strong><small>统一指南入口 · /docs</small></div>
        <div><span>交付区</span><strong>下载 / 资料</strong><small>文件与行业资料</small></div>
      </section>

      <section className="admin-section-card resource-hub-admin-card">
        <div className="resource-hub-admin-card-head">
          <div><span className="admin-section-key">NAVIGATION STRUCTURE</span><h2>资源中心导航结构</h2><p>调整顺序、文案或显示状态后，点击底部保存。每个区块右侧都提供一个轻量预览标识。</p></div>
          <span className="resource-hub-admin-structure">Skills · Prompt · 指南 · 下载 · 资料</span>
        </div>
        {loading ? <div className="admin-loading">加载中...</div> : <>
          <div className="resource-hub-admin-live-preview">
            <div className="resource-hub-admin-live-head"><div><span>LIVE PREVIEW</span><strong>前台资源中心导航</strong></div><small>保存后首页与官网资源中心同步</small></div>
            <div className="resource-hub-admin-live-grid">
              {blocks.map((block, index) => <div className={`resource-hub-admin-live-card ${block.enabled === false ? 'is-disabled' : ''}`} key={block.key}><span>{String(index + 1).padStart(2, '0')}</span><b>{labels[block.key] || block.key}</b><strong>{block.title}</strong><small>{block.href}</small></div>)}
            </div>
          </div>
          <div className="resource-hub-admin-list">
            {blocks.map((block, index) => (
              <article className={`resource-hub-admin-item-v2 ${block.enabled === false ? 'is-disabled' : ''}`} key={block.key}>
                <div className="resource-hub-admin-index-v2">{String(index + 1).padStart(2, '0')}</div>
                <div className="resource-hub-admin-preview"><strong>{labels[block.key] || block.key}</strong><span>{block.key}</span><em className={block.enabled === false ? 'off' : ''}>{block.enabled === false ? '已隐藏' : '前台显示'}</em></div>
                <div className="resource-hub-admin-main-v2">
                  <div className="resource-hub-admin-title-v2"><div><strong>{block.title}</strong><small>{block.description || '给这个资源模块补充一句用户能理解的说明。'}</small></div><code>{block.href}</code></div>
                  {editingKey === block.key ? <div className="resource-hub-admin-fields">
                    <label><span>导航标签</span><input value={block.label || ''} onChange={(e) => update(index, 'label', e.target.value)} placeholder="例如 SKILLS" /></label>
                    <label><span>模块标题</span><input value={block.title || ''} onChange={(e) => update(index, 'title', e.target.value)} placeholder="前台显示名称" /></label>
                    <label className="full"><span>模块说明</span><textarea rows={2} value={block.description || ''} onChange={(e) => update(index, 'description', e.target.value)} placeholder="一句话说明这个资源区块解决什么问题" /></label>
                    <label className="full"><span>入口地址</span><input value={block.href || ''} onChange={(e) => update(index, 'href', e.target.value)} placeholder="/skills" /></label>
                  </div> : <div className="resource-hub-admin-collapsed-copy"><span>{block.description || '暂无模块说明'}</span><code>{block.href}</code></div>}
                </div>
                <div className="resource-hub-admin-actions-v2">
                  <div><button onClick={() => move(index, -1)} disabled={index === 0} aria-label="上移">↑</button><button onClick={() => move(index, 1)} disabled={index === blocks.length - 1} aria-label="下移">↓</button></div>
                  <div className="resource-hub-admin-edit-actions"><button className="resource-hub-admin-edit-button" onClick={() => setEditingKey(editingKey === block.key ? null : block.key)}>{editingKey === block.key ? '收起' : '编辑'}</button><label className="admin-check"><input type="checkbox" checked={block.enabled !== false} onChange={(e) => update(index, 'enabled', e.target.checked)} /><span>{block.enabled === false ? '隐藏' : '显示'}</span></label></div>
                </div>
              </article>
            ))}
          </div>
        </>}
        <div className="page-cms-savebar"><div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div><button className="admin-primary-button" disabled={saving || loading} onClick={() => void save()}>{saving ? '保存中...' : '保存资源中心结构'}</button></div>
      </section>
    </main>
  );
}
