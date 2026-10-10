'use client';

import { useEffect, useState } from 'react';

const blank = { provider: 'LOCAL', endpoint: '', region: '', bucket: '', accessKeyId: '', secret: '', basePath: '', cdnUrl: '', maxFileSizeMb: 2048, enabled: true, secretConfigured: false, allowedTypes: ['IMAGE','VIDEO','AUDIO','ARCHIVE','PDF','WORD','SPREADSHEET','PRESENTATION','MARKDOWN','TEXT','FILE'] };

function normalizeStorageForm(data: any) {
  return {
    ...blank,
    provider: data?.provider === 'OSS' ? 'OSS' : data?.provider === 'SUPABASE' ? 'SUPABASE' : 'LOCAL',
    endpoint: data?.endpoint ?? '',
    region: data?.region ?? '',
    bucket: data?.bucket ?? '',
    accessKeyId: data?.accessKeyId ?? '',
    secret: '',
    basePath: data?.basePath ?? '',
    cdnUrl: data?.cdnUrl ?? '',
    maxFileSizeMb: Number(data?.maxFileSizeMb ?? 2048),
    enabled: data?.enabled !== false,
    secretConfigured: Boolean(data?.secretConfigured),
    allowedTypes: Array.isArray(data?.allowedTypes) ? data.allowedTypes.map((x: unknown) => String(x).trim()).filter(Boolean) : [],
  };
}


export default function StoragePage() {
  const [form, setForm] = useState<any>(blank);
  const [health, setHealth] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repairing, setRepairing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [configResponse, healthResponse] = await Promise.all([
        fetch('/api/admin/storage/config', { cache: 'no-store' }),
        fetch('/api/admin/storage/health', { cache: 'no-store' }),
      ]);
      const config = await configResponse.json();
      const healthResult = await healthResponse.json();
      if (config.success && config.data) setForm(normalizeStorageForm(config.data));
      setHealth(healthResult.success ? healthResult.data : null);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/admin/storage/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message || '保存失败');
      setMsg('存储配置已保存');
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : '保存失败'); }
    finally { setSaving(false); }
  }

  async function test() {
    setTesting(true); setMsg('正在检测存储服务…');
    try {
      const r = await fetch('/api/admin/storage/health', { cache: 'no-store' });
      const j = await r.json();
      setHealth(j.success ? j.data : null);
      setMsg(j.success ? (j.data?.message || '检测完成') : (j.message || '检测失败'));
    } catch { setMsg('检测请求失败，请检查服务是否启动。'); }
    finally { setTesting(false); }
  }

  async function repairSchema() {
    setRepairing(true);
    setMsg('正在检查并修复存储配置、MediaAsset、Skill 版本与 Prompt 文件结构…');
    try {
      const r = await fetch('/api/admin/storage/repair', { method: 'POST' });
      const j = await r.json();
      if (!j.success) throw new Error(j.message || '修复失败');
      setMsg(j.message || '存储配置表已就绪');
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : '修复失败'); }
    finally { setRepairing(false); }
  }

  const local = form.provider === 'LOCAL';
  const oss = form.provider === 'OSS';
  const supabase = form.provider === 'SUPABASE';
  const providerLabel = local ? '本地存储' : oss ? '阿里云 OSS' : 'Supabase Storage';
  return <main className="admin-page">
    <div className="admin-page-header">
      <div><div className="admin-eyebrow">SYSTEM / STORAGE</div><h1>文件存储</h1><p>本地存储、阿里云 OSS 与 Supabase Storage 是两套不同的上传链路。这里负责配置、检测、切换与故障排查，Skill ZIP、Prompt 文档、图片、视频、PDF、Office 等资源统一走同一个上传服务。</p></div>
    </div>

    <section className="admin-section-card">
      <div className="storage-provider-grid">
        <button type="button" className={local ? 'active' : ''} onClick={() => setForm({ ...form, provider: 'LOCAL' })}><b>本地存储</b><span>写入服务器本地目录，适合本机开发或单机部署。</span></button>
        <button type="button" className={oss ? 'active' : ''} onClick={() => setForm({ ...form, provider: 'OSS' })}><b>阿里云 OSS</b><span>浏览器直传云端，适合正式环境与大文件；正式环境还需要在 OSS 配置跨域 PUT。</span></button>
        <button type="button" className={supabase ? 'active' : ''} onClick={() => setForm({ ...form, provider: 'SUPABASE', endpoint: '', bucket: form.bucket || 'site-assets', accessKeyId: '', secret: '' })}><b>Supabase Storage</b><span>与 Supabase PostgreSQL 配套，适合 Vercel 部署。密钥只从服务端环境变量读取。</span></button>
      </div>

      {loading ? <div className="admin-loading">正在读取存储配置…</div> : <>
        <div className="storage-configuration-summary">
          <div><span>当前模式</span><strong>{providerLabel}</strong></div>
          <div><span>单文件上限</span><strong>{form.maxFileSizeMb || 2048} MB</strong></div>
          <div><span>状态</span><strong>{form.enabled ? '已启用' : '已停用'}</strong></div>
          {oss && <div><span>Secret</span><strong>{form.secretConfigured ? '已配置' : '未配置'}</strong></div>}
          {supabase && <div><span>Service Role Key</span><strong>服务端环境变量</strong></div>}
        </div>

        {local ? <div className="storage-local-panel">
          <div className="storage-panel-icon">LOCAL</div>
          <div><strong>本地文件会写入服务器目录</strong><p>默认目录是 <code>public/uploads</code>。正式单机部署建议使用服务器独立目录，例如 <code>D:\ai-super-employee\uploads</code>；也可以通过环境变量 <code>LOCAL_UPLOAD_ROOT</code> 指定。下方“目录前缀”只负责业务分目录，不是绝对路径。</p></div>
        </div> : supabase ? <div className="storage-local-panel storage-supabase-panel">
          <div className="storage-panel-icon">S3</div>
          <div><strong>Supabase Storage 云端存储</strong><p>服务端从 Vercel 环境变量读取 <code>SUPABASE_URL</code>、<code>SUPABASE_SERVICE_ROLE_KEY</code> 和 <code>SUPABASE_STORAGE_BUCKET</code>。Service Role Key 不会保存在数据库配置或发送给浏览器。Bucket 名称可以在这里指定；正式环境请确认该 Bucket 是公开读取（官网图片/公开资料）并限制上传权限只给后台服务。</p><label className="storage-inline-field"><span>Bucket 名称</span><input value={form.bucket} onChange={e => setForm({ ...form, bucket: e.target.value })} placeholder="site-assets" /></label></div>
        </div> : <div className="cms-form-grid storage-form">
          <label><span>Endpoint</span><input value={form.endpoint} onChange={e => setForm({ ...form, endpoint: e.target.value })} placeholder="oss-cn-hangzhou.aliyuncs.com" /></label>
          <label><span>Region</span><input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="cn-hangzhou" /></label>
          <label><span>Bucket</span><input value={form.bucket} onChange={e => setForm({ ...form, bucket: e.target.value })} /></label>
          <label><span>AccessKey ID</span><input value={form.accessKeyId} onChange={e => setForm({ ...form, accessKeyId: e.target.value })} /></label>
          <label className="full"><span>AccessKey Secret <small>留空表示保持现有密钥</small></span><input type="password" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} /></label>
          <label><span>CDN 域名</span><input value={form.cdnUrl} onChange={e => setForm({ ...form, cdnUrl: e.target.value })} placeholder="https://cdn.example.com" /></label>
        </div>}

        <div className="cms-form-grid storage-form">
          <label><span>存储目录前缀</span><input value={form.basePath} onChange={e => setForm({ ...form, basePath: e.target.value })} placeholder="例如 ai-super-employee" /></label>
          <label><span>单文件上限（MB）</span><input type="number" value={form.maxFileSizeMb} onChange={e => setForm({ ...form, maxFileSizeMb: Number(e.target.value) })} min={1} max={10240} /></label>
          <label><span>存储状态</span><select value={form.enabled ? '1' : '0'} onChange={e => setForm({ ...form, enabled: e.target.value === '1' })}><option value="1">启用</option><option value="0">停用</option></select></label>
          <label><span>允许文件类型（可选）</span><input value={Array.isArray(form.allowedTypes) ? form.allowedTypes.join(',') : (form.allowedTypes || '')} onChange={e => setForm({ ...form, allowedTypes: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} placeholder="IMAGE,VIDEO,AUDIO,ARCHIVE,PDF,WORD,SPREADSHEET,PRESENTATION,MARKDOWN,TEXT,FILE" /></label>
        </div>
      </>}

      {health && <div className={`storage-health ${health.ok ? 'ok' : 'error'}`}><span className="health-dot"/><div><strong>{health.ok ? '存储检测通过' : '存储检测未通过'}</strong><p>{health.message}</p>{health.root && <small>本地目录：{health.root}</small>}{health.endpoint && <small>OSS Endpoint：{health.endpoint} · Bucket：{health.bucket}</small>}</div></div>}
      {msg && <div className={msg.includes('失败') ? 'admin-error-message' : 'admin-save-message'}>{msg}</div>}
      <div className="admin-form-actions"><button className="admin-secondary-button" onClick={() => void test()} disabled={testing}>{testing ? '检测中…' : '检测存储'}</button><button className="admin-primary-button" onClick={() => void save()} disabled={saving}>{saving ? '保存中…' : '保存配置'}</button></div>
    </section>

    {health && !health.ok && /storage_configs|media_assets|skill_versions|prompts|列不存在|does not exist/i.test(String(health.message || '')) && <section className="admin-section-card storage-repair-card">
      <div><h2>存储与文件资源结构尚未完全就绪</h2><p>当前数据库可能缺少部分文件资源结构（存储配置、MediaAsset、Skill 版本文件、Prompt 文件关联）。系统会执行幂等修复，不会删除业务数据。</p></div>
      <button className="admin-primary-button" onClick={() => void repairSchema()} disabled={repairing}>{repairing ? '正在修复…' : '一键修复存储与文件资源结构'}</button>
    </section>}

    <section className="admin-section-card storage-guide-card">
      <div className="admin-section-top"><div><div className="admin-eyebrow">CONFIG GUIDE</div><h2>配置说明</h2><p>本机开发可用本地存储；正式部署到 Vercel 推荐 Supabase Storage 或 OSS。切换存储模式不会自动迁移历史文件，旧资源需要运行迁移脚本。</p></div></div>
      <div className="storage-guide-grid">
        <div><h3>本地存储</h3><p>适合：本机开发、单机部署、内网环境。文件直接写入服务器目录。建议把上传文件放到项目目录之外，例如 <code>D:\ai-super-employee\uploads</code>，这样以后升级代码不会覆盖上传资料。</p><div className="storage-guide-example"><b>推荐</b><code>LOCAL_UPLOAD_ROOT=D:\ai-super-employee\uploads</code></div></div>
        <div><h3>阿里云 OSS</h3><p>适合：正式官网、多服务器、大文件、CDN。需要填写 Endpoint、Bucket、Region、AccessKey ID、AccessKey Secret；正式环境还要在 OSS 控制台给网站域名配置 CORS。</p><div className="storage-guide-example"><b>检测方式</b><span>系统会生成签名地址，并实际执行一次小文件 PUT + DELETE 测试。</span></div></div>
        <div><h3>Supabase Storage</h3><p>适合：本项目迁移到 Supabase + Vercel。Bucket 名称与密钥分别通过配置/环境变量读取，执行 <code>npm.cmd run storage:setup:supabase</code> 创建公开资源 Bucket；官网图片由 Storage CDN 提供，Service Role Key 只用于服务端。</p><div className="storage-guide-example"><b>Vercel 环境变量</b><span>SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、SUPABASE_STORAGE_BUCKET</span></div></div>
      </div>
      <div className="storage-guide-grid storage-guide-grid-compact">
        <div><h3>Skill</h3><p>本体应上传 ZIP / RAR / 7Z / TAR / GZ / TGZ 等压缩包。文字字段只负责介绍、版本说明与更新日志。</p></div>
        <div><h3>Prompt</h3><p>核心提示词可以上传 MD、TXT、PDF、DOC、DOCX、JSON、ZIP 等文件；简介、使用方法等文字字段只做辅助说明。</p></div>
      </div>
    </section>

    <section className="admin-section-card">
      <div className="admin-section-top"><div><h2>统一上传链路</h2><p>产品、Skill、Prompt、资源中心、页面媒体等业务模块不再分别实现存储逻辑。</p></div></div>
      <div className="storage-flow storage-flow-rich"><span>CMS 资源选择器</span><i>→</i><span>统一上传服务</span><i>→</i><span>{local ? '服务器本地目录' : oss ? 'OSS 直传（需 CORS）' : 'Supabase Storage（服务端上传）'}</span><i>→</i><span>MediaAsset 资源记录</span><i>→</i><span>前台在线查看 / 下载</span></div>
      <p className="storage-note">切换存储模式不会自动迁移旧文件；旧文件仍保留在原存储中，迁移应单独执行。</p>
    </section>
  </main>;
}
