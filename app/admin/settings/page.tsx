'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssetPicker from '@/components/admin/asset-picker';

const fields = [
 ['siteName','网站名称'],['phone','联系电话'],['wechat','微信'],['email','邮箱'],['copyright','版权信息'],['icp','ICP备案'],['seoTitle','SEO 标题'],['seoDescription','SEO 描述'],['seoKeywords','SEO 关键词']
] as const;

export default function SettingsPage(){
 const [form,setForm]=useState<Record<string,any>>({}); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 useEffect(()=>{fetch('/api/admin/settings',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.success&&j.data)setForm(j.data);else setMessage(j.message||'读取失败')}).catch(()=>setMessage('读取失败')).finally(()=>setLoading(false))},[]);
 const save=async()=>{setSaving(true);setMessage('');try{const payload={siteName:form.siteName||'',logo:form.logo||'',favicon:form.favicon||'',phone:form.phone||'',wechat:form.wechat||'',email:form.email||'',copyright:form.copyright||'',icp:form.icp||'',seoTitle:form.seoTitle||'',seoDescription:form.seoDescription||'',seoKeywords:form.seoKeywords||''};const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!j.success)throw new Error(j.message);setMessage('网站设置已保存')}catch(e){setMessage(e instanceof Error?e.message:'保存失败')}finally{setSaving(false)}};
 if(loading)return <main className="admin-page"><div className="admin-loading">正在加载网站设置...</div></main>;
 return <main className="admin-page"><div className="admin-page-header"><div><div className="admin-eyebrow">CMS / SETTINGS</div><h1>网站设置</h1><p>统一管理品牌、联系方式与全站 SEO。</p></div><Link href="/admin" className="admin-back">← 返回后台</Link></div><section className="admin-section-card"><div className="settings-grid"><AssetPicker label="网站 Logo" folder="site/logo" accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={20} value={form.logo||''} onChange={x=>setForm({...form,logo:x.url})} helper="建议使用 SVG 或透明 PNG。"/><AssetPicker label="Favicon" folder="site/favicon" accept=".png,.ico,.jpg,.jpeg,.webp" type="IMAGE" maxSizeMb={10} value={form.favicon||''} onChange={x=>setForm({...form,favicon:x.url})} helper="浏览器标签页图标。"/>{fields.map(([k,l])=><label key={k}><span>{l}</span><input value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><div className="admin-form-actions"><button className="admin-primary-button" onClick={save} disabled={saving}>{saving?'保存中...':'保存设置'}</button>{message&&<span className="admin-save-message">{message}</span>}</div></section></main>
}
