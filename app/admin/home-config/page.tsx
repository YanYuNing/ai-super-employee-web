'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AssetPicker from '@/components/admin/asset-picker';

type Section = {
  id: number;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  data?: unknown;
  sortOrder: number;
  enabled: boolean;
};

const blank = { sectionKey: '', title: '', subtitle: '', sortOrder: 0, enabled: true, data: '' };

function parseData(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === 'string') { try { const parsed = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } }
  return {};
}

export default function HomeConfig() {
  const [page, setPage] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await (await fetch('/api/admin/home-config', { cache: 'no-store' })).json();
      if (!result.success) throw new Error(result.message || '读取失败');
      setPage(result.data);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '读取首页配置失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function edit(section: Section) {
    setMsg('');
    setEditing({ ...section, data: section.data ? JSON.stringify(section.data, null, 2) : '' });
  }

  function getHeroDataValue(data: Record<string, any>, key: string) {
    if (key.startsWith('task')) {
      const task = parseData(data.task);
      const field = key.slice(4);
      const nestedKey = field ? field.charAt(0).toLowerCase() + field.slice(1) : key;
      return task[nestedKey];
    }
    return data[key];
  }

  function updateEditingData(key: string, value: any) {
    const data = parseData(editing?.data);
    if (key.startsWith('task')) {
      const task = parseData(data.task);
      const field = key.slice(4);
      const nestedKey = field ? field.charAt(0).toLowerCase() + field.slice(1) : key;
      const nextData = { ...data, task: { ...task, [nestedKey]: value } };
      setEditing((current: any) => ({ ...current, data: JSON.stringify(nextData, null, 2) }));
      return;
    }
    setEditing((current: any) => ({ ...current, data: JSON.stringify({ ...data, [key]: value }, null, 2) }));
  }

  function create() {
    setMsg('');
    setEditing({ ...blank, sectionKey: `section-${(page?.sections?.length || 0) + 1}` });
  }

  async function save() {
    if (!editing?.sectionKey?.trim()) { setMsg('区块 Key 不能为空'); return; }
    setSaving(true); setMsg('');
    try {
      let data: unknown = null;
      if (editing.data?.trim()) data = JSON.parse(editing.data);
      const payload = { id: editing.id, sectionKey: editing.sectionKey, title: editing.title, subtitle: editing.subtitle, sortOrder: editing.sortOrder, enabled: editing.enabled, data };
      const result = await (await fetch('/api/admin/home-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (!result.success) throw new Error(result.message || '保存失败');
      setMsg('保存成功');
      setEditing(null);
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : '保存失败，请检查 JSON 格式');
    } finally { setSaving(false); }
  }

  async function toggle(section: Section) {
    const result = await (await fetch(`/api/admin/home-config/sections/${section.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...section, enabled: !section.enabled }) })).json();
    if (!result.success) setMsg(result.message || '状态更新失败');
    await load();
  }

  if (loading || !page) return <main className="admin-page"><div className="admin-loading">加载首页配置...</div></main>;

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div><div className="admin-eyebrow">HOME / VISUAL CMS</div><h1>首页可视化编辑</h1><p>首页现在采用区块化管理。日常修改只需要打开一个区块，不再把整个首页内容堆在同一张长表单里。</p></div>
        <Link href="/" target="_blank" className="admin-back">预览官网 ↗</Link>
      </div>

      <section className="admin-section-card compact">
        <div className="cms-toolbar">
          <div><strong>首页区块</strong><span>共 {page.sections?.length || 0} 个</span></div>
          <div className="cms-filters"><button onClick={() => void load()}>刷新</button><button className="admin-primary-button" onClick={create}>＋ 新增区块</button></div>
        </div>
        {msg && !editing && <div className="admin-save-message" style={{ marginBottom: 12 }}>{msg}</div>}
        <div className="home-section-list">
          {(page.sections || []).map((section: Section) => (
            <div className="home-section-row" key={section.id}>
              <div>
                <span>{section.sectionKey} · 排序 {section.sortOrder}</span>
                <strong>{section.title || '未设置标题'}</strong>
                <span>{section.subtitle || '暂无副标题'}</span>
              </div>
              <div className="cms-actions">
                <span className={`admin-status ${section.enabled ? 'active' : 'status-inactive'}`}>{section.enabled ? '已启用' : '已停用'}</span>
                <button onClick={() => edit(section)}>编辑</button>
                <button onClick={() => void toggle(section)}>{section.enabled ? '停用' : '启用'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <div className="admin-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
          <aside className="admin-drawer" role="dialog" aria-modal="true">
            <div className="admin-drawer-head">
              <div><div className="admin-eyebrow">HOME SECTION</div><h2>{editing.id ? `编辑 ${editing.sectionKey}` : '新增首页区块'}</h2><p>区块 Key 用于前台识别，请不要随意修改已有区块 Key。</p></div>
              <button className="admin-drawer-close" onClick={() => setEditing(null)} aria-label="关闭">×</button>
            </div>
            <div className="cms-form-grid">
              <label><span>区块 Key</span><input value={editing.sectionKey || ''} onChange={e => setEditing({ ...editing, sectionKey: e.target.value })} /></label>
              <label><span>排序</span><input type="number" value={editing.sortOrder ?? 0} onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></label>
              <label className="full"><span>标题</span><input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
              <label className="full"><span>副标题</span><input value={editing.subtitle || ''} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} /></label>
              <div className="admin-field-note full"><strong>首页区块采用“专用字段 + 结构化数据”管理。</strong><span>这里不再提供通用“正文 / 区块图片 / 区块视频”字段，因为首页前台不会读取这些字段，避免后台出现保存了但用户看不到的内容。</span></div>
              <label className="full"><span>结构化数据 JSON</span><textarea rows={8} value={editing.data || ''} onChange={e => setEditing({ ...editing, data: e.target.value })} placeholder='例如：{"primaryButton":{"text":"立即体验","url":"/contact"}}' /></label>
              {editing.sectionKey === 'hero' && <div className="home-hero-task-editor full">
                <div className="home-hero-task-head"><div><strong>Hero · AI Claw 执行卡</strong><small>这张卡片会直接显示在官网首屏右侧。修改后无需改代码。</small></div><span>LIVE UI</span></div>
                <div className="cms-form-grid home-hero-task-grid">
                  {([
                    ['taskStatus','执行状态','EXECUTING'],['taskAgent','执行引擎','AI Claw 3.0'],['taskTitle','当前任务','正在执行：装修行业关键词曝光任务'],['taskMode','任务模式','关键词曝光 · 自动执行'],['taskMeta','进度说明','自动拆解任务'],['taskProgress','进度百分比','82'],
                  ] as Array<[string,string,string]>).map(([key,label,placeholder]) => <label key={key} className={key==='taskTitle'?'full':''}><span>{label}</span><input value={String(getHeroDataValue(parseData(editing.data), key) ?? '')} onChange={e => updateEditingData(key, e.target.value)} placeholder={placeholder} /></label>)}
                </div>
                <div className="home-hero-floating-row">
                  {[0,1,2].map((index) => <label key={index}><span>浮动卡片 {index+1} 状态</span><input value={String((parseData(editing.data).floatingStatuses || [])[index] ?? '')} onChange={e => { const d=parseData(editing.data); const next=Array.isArray(d.floatingStatuses)?[...d.floatingStatuses]:[]; while(next.length<3) next.push(''); next[index]=e.target.value; updateEditingData('floatingStatuses', next); }} placeholder={['内容生成中','关键词策略已生成','正在接待客户'][index]} /></label>)}
                </div>
              </div>}
            </div>
            <div className="admin-drawer-footer">
              <div>{msg && <span className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</span>}</div>
              <div className="admin-form-actions" style={{ marginTop: 0 }}><button className="admin-ghost-button" onClick={() => setEditing(null)}>取消</button><button className="admin-primary-button" onClick={() => void save()} disabled={saving}>{saving ? '保存中...' : '保存区块'}</button></div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
