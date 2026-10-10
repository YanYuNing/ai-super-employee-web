'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const cards = [
  ['首页可视化', '/admin/home-config', 'home', 'Hero、首页区块、排序、启停与媒体', 'home.view'],
  ['AI 产品管理', '/admin/products', 'spark', '产品介绍、媒体、排序、启停与 SEO', 'product.view'],
  ['解决方案', '/admin/cms/solutions', 'layers', '行业方案、正文与发布状态', 'content.view'],
  ['客户案例', '/admin/cms/cases', 'case', '案例、行业、结果与展示内容', 'content.view'],
  ['资源中心', '/admin/cms/resources', 'resource', '资料、教程、工具与下载资源', 'content.view'],
  ['文章 / 新闻', '/admin/cms/articles', 'article', '知识库、新闻和企业内容', 'content.view'],
  ['Skills', '/admin/skills', 'code', 'Skill 内容、版本与发布', 'skill.view'],
  ['Prompt', '/admin/prompts', 'prompt', '提示词、分类、模型与使用方法', 'prompt.view'],
  ['下载与版本', '/admin/downloads', 'download', '客户端、Skill、模板和资源版本', 'download.view'],
  ['文件资产', '/admin/files', 'media', '图片、视频、文档、ZIP 上传与复用', 'file.view'],
  ['全站内容', '/admin/site-content', 'article', '导航、页脚与首页固定文案', 'home.view'],
  ['销售线索', '/admin/cms/leads', 'lead', '状态、负责人、需求与跟进', 'lead.view'],
  ['FAQ', '/admin/cms/faqs', 'help', '常见问题', 'content.view'],
  ['独立页面 / SEO', '/admin/pages', 'page', '页面正文、区块与 SEO', 'page.view'],
  ['网站设置', '/admin/settings', 'settings', '品牌、联系方式和全站 SEO', 'settings.view'],
] as const;

const iconPaths: Record<string, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
  spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
  case: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3h8v2M3 11h18M10 11v3h4v-3"/></>,
  resource: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M8 7h8M8 11h7"/></>,
  article: <><path d="M5 3h11l3 3v15H5z"/><path d="M16 3v4h4M8 11h8M8 15h8M8 19h5"/></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/></>,
  prompt: <><path d="M4 5h16v14H4z"/><path d="m8 10 2 2-2 2M12 15h4"/></>,
  download: <><path d="M12 3v11M8 10l4 4 4-4M4 19h16"/></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.4"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
  lead: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.3 2.5-5 6-5s5.5 1.7 6 5M17 12l2 2 3-4"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9 1-1.9 1.2-1.9 2.8M12 17h.01"/></>,
  page: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.6-1H6v-2.4h.8a1.7 1.7 0 0 0 1.6-1A1.7 1.7 0 0 0 8.1 8.7L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5H15v.7a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
};

function CardIcon({ name }: { name: string }) {
  return <span className="card-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg></span>;
}

export default function AdminDashboard() {
  const [permissions,setPermissions]=useState<string[]>([]);
  const [superAdmin,setSuperAdmin]=useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);
  useEffect(()=>{
    fetch('/api/admin/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j?.success){setPermissions(j.data.permissions||[]);setSuperAdmin(!!j.data.superAdmin)}}).catch(()=>{});
    // Use the same API and counting rule as /admin/products: all product records, including inactive ones.
    fetch('/api/admin/products',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j?.success && Array.isArray(j.data)) setProductCount(j.data.length)}).catch(()=>{});
  },[]);
  const visibleCards=useMemo(()=>cards.filter(([, , , , permission])=>superAdmin||!permission||permissions.includes(permission)||permissions.some(p=>permission.startsWith(`${p}.`))),[permissions,superAdmin]);
  return (
    <main className="admin-page">
      <section className="dashboard-hero">
        <div className="admin-eyebrow">YU HUI AI SUPER EMPLOYEE / CMS</div>
        <h1>企业官网内容中枢</h1>
        <p>这里是豫辉 AI 超级员工官网的统一运营工作台。内容、产品、资源、线索、素材和 SEO 都从这里管理，修改后前台按 CMS 数据实时展示。</p>
        <div className="dashboard-actions">
          <Link className="admin-primary-button" href="/admin/products">{productCount === null ? '管理 AI 产品' : `管理 ${productCount} 大 AI 产品`}</Link>
          <Link className="admin-secondary-button" href="/admin/home-config">编辑首页</Link>
          <Link className="admin-ghost-button" href="/" target="_blank">预览官网 ↗</Link>
        </div>
      </section>

      <div className="dashboard-metrics">
        <div className="dashboard-metric"><span>产品总数</span><strong>{productCount ?? '—'}</strong><em>与产品列表总数同步</em></div>
        <div className="dashboard-metric"><span>内容模块</span><strong>14</strong><em>可独立维护</em></div>
        <div className="dashboard-metric"><span>运营能力</span><strong>24×7</strong><em>官网内容持续运营</em></div>
        <div className="dashboard-metric"><span>数据方式</span><strong>CMS</strong><em>前后台统一</em></div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-top">
          <div><span className="admin-section-key">CONTENT OPERATIONS</span><h2>全部管理模块</h2><p>点击进入对应模块。左侧菜单也可以按名称搜索。</p></div>
        </div>
        <div className="dashboard-grid">
          {visibleCards.map(([name, href, icon, desc]) => {
            const displayName = href === '/admin/products'
              ? (productCount === null ? 'AI 产品管理' : `${productCount} 大 AI 产品`)
              : name;
            return (
              <Link className="dashboard-card" href={href} key={href}>
                <CardIcon name={icon} />
                <strong>{displayName}</strong>
                <span>{desc}</span>
                <em>进入管理 →</em>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
