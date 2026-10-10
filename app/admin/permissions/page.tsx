'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
type Permission={id:number;code:string;name:string;group:string;groupName:string;description:string;action:string};
export default function PermissionsPage(){
 const [items,setItems]=useState<Permission[]>([]),[q,setQ]=useState(''),[loading,setLoading]=useState(true),[msg,setMsg]=useState('');
 async function load(){setLoading(true);try{const r=await fetch('/api/admin/permissions',{cache:'no-store'});const j=await r.json();if(j.success)setItems(j.data||[]);else setMsg(j.message||'读取失败')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 const grouped=useMemo(()=>{const m:Record<string,Permission[]>={};for(const p of items){if(q.trim()&&!`${p.name} ${p.code} ${p.description}`.toLowerCase().includes(q.trim().toLowerCase()))continue;(m[p.group] ||= []).push(p)}return m},[items,q]);
 return <main className="admin-page"><div className="admin-page-header"><div><div className="admin-eyebrow">SYSTEM / PERMISSIONS</div><h1>权限目录</h1><p>这里定义 CMS 当前实际使用的系统能力。权限项由系统维护，角色负责组合这些能力。</p></div><Link className="admin-ghost-button" href="/admin/roles">返回角色管理</Link></div>
 <div className="admin-stat-grid compact"><div className="admin-stat-card"><span>权限总数</span><strong>{items.length}</strong><small>系统能力项</small></div><div className="admin-stat-card"><span>模块</span><strong>{new Set(items.map(x=>x.group)).size}</strong><small>按业务域分组</small></div><div className="admin-stat-card"><span>查看类</span><strong>{items.filter(x=>x.action==='查看').length}</strong><small>只读能力</small></div><div className="admin-stat-card"><span>写入类</span><strong>{items.filter(x=>x.action!=='查看').length}</strong><small>新增 / 编辑 / 删除 / 上传</small></div></div>
 <section className="admin-section-card compact"><div className="cms-toolbar"><div><strong>系统权限</strong><span>{items.length} 项</span></div><div className="cms-filters"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索权限名称、code、说明..."/><button onClick={()=>void load()}>同步权限目录</button></div></div>
 {loading?<div className="admin-loading">正在读取权限目录...</div>:<div className="permission-catalog">{(Object.entries(grouped) as [string,Permission[]][]).map(([group,ps])=><section key={group}><div className="permission-catalog-head"><div><span>MODULE</span><h2>{ps[0]?.groupName||group}</h2></div><strong>{ps.length} 项</strong></div><div className="permission-catalog-list">{ps.map(p=><div className="permission-catalog-item" key={p.code}><div className="permission-catalog-main"><strong>{p.name}</strong><code>{p.code}</code></div><span className="admin-status">{p.action}</span><p>{p.description}</p></div>)}</div></section>)}</div>}
 {msg&&<div className="admin-error-message">{msg}</div>}</section></main>
}
