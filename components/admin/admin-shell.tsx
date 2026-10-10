'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type NavItem = { label: string; href: string; icon: string; description?: string; permission?: string };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: '核心内容',
    items: [
      { label: '首页管理', href: '/admin/home-config', icon: 'home', description: '首页区块、Hero 与排序', permission: 'home.view' },
      { label: 'AI 产品管理', href: '/admin/products', icon: 'spark', description: '产品内容、SEO 与发布', permission: 'product.view' },
      { label: '解决方案', href: '/admin/cms/solutions', icon: 'layers', description: '行业解决方案', permission: 'content.view' },
      { label: '客户案例', href: '/admin/cms/cases', icon: 'case', description: '客户案例与结果', permission: 'content.view' },
    ],
  },
  {
    title: '内容中心',
    items: [
      { label: '资源中心', href: '/admin/resource-hub', icon: 'resource', description: 'Skill、Prompt、手册与资料的统一入口', permission: 'page.view' },
      { label: '资源资料', href: '/admin/cms/resources', icon: 'resource', description: '资源内容与分类', permission: 'content.view' },
      { label: '教程', href: '/admin/cms/tutorials', icon: 'book', description: '使用教程与指南', permission: 'content.view' },
      { label: '文章 / 新闻', href: '/admin/cms/articles', icon: 'article', description: '知识库与企业内容', permission: 'content.view' },
      { label: 'FAQ', href: '/admin/cms/faqs', icon: 'help', description: '常见问题', permission: 'content.view' },
      { label: '更新日志', href: '/admin/cms/changelogs', icon: 'history', description: '产品版本记录', permission: 'content.view' },
      { label: 'Skill', href: '/admin/skills', icon: 'code', description: 'Skill 内容与版本', permission: 'skill.view' },
      { label: 'Prompt', href: '/admin/prompts', icon: 'prompt', description: '提示词与分类', permission: 'prompt.view' },
    ],
  },
  {
    title: '运营管理',
    items: [
      { label: '销售线索', href: '/admin/cms/leads', icon: 'lead', description: '线索、跟进与转化', permission: 'lead.view' },
      { label: '文件资产', href: '/admin/files', icon: 'media', description: '图片、视频、文档、ZIP 与预览', permission: 'file.view' },
      { label: '页面管理', href: '/admin/pages', icon: 'page', description: '页面文案、区块与 SEO', permission: 'page.view' },
      { label: '下载管理', href: '/admin/downloads', icon: 'download', description: '下载产品与版本', permission: 'download.view' },
      { label: '全站内容', href: '/admin/site-content', icon: 'article', description: '导航、页脚与首页运行文案', permission: 'home.view' },
      { label: '网站设置', href: '/admin/settings', icon: 'settings', description: '品牌、联系与 SEO', permission: 'settings.view' },
      { label: '管理员', href: '/admin/admins', icon: 'admin', description: '管理员账号与角色', permission: 'admin.view' },
      { label: '角色权限', href: '/admin/roles', icon: 'shield', description: '角色与权限矩阵', permission: 'role.view' },
      { label: '权限目录', href: '/admin/permissions', icon: 'shield', description: '系统权限能力清单', permission: 'role.view' },
      { label: '文件存储', href: '/admin/storage', icon: 'cloud', description: '本地 / OSS / CDN 配置', permission: 'storage.view' },
    ],
  },
];

function activeFor(pathname: string, href: string) {
  if (href === '/admin/home-config') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    case: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3h8v2"/><path d="M3 11h18"/><path d="M10 11v3h4v-3"/></>,
    resource: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 5.5V20"/><path d="M8 7h8M8 11h7"/></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M4 4.5V21"/><path d="M8 6h7M8 10h7"/></>,
    article: <><path d="M5 3h11l3 3v15H5z"/><path d="M16 3v4h4"/><path d="M8 11h8M8 15h8M8 19h5"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9 1-1.9 1.2-1.9 2.8"/><path d="M12 17h.01"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l3 2"/></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/></>,
    prompt: <><path d="M4 5h16v14H4z"/><path d="m8 10 2 2-2 2M12 15h4"/></>,
    admin: <><circle cx="12" cy="8" r="3"/><path d="M5 21c.5-4 2.8-6 7-6s6.5 2 7 6"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    cloud: <><path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 8.8 4.5 4.5 0 0 0 7 18Z"/></>,
    lead: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.3 2.5-5 6-5s5.5 1.7 6 5"/><path d="m17 12 2 2 3-4"/></>,
    media: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.4"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
    page: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></>,
    download: <><path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M4 19h16"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.6-1H6v-2.4h.8a1.7 1.7 0 0 0 1.6-1A1.7 1.7 0 0 0 8.1 8.7L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5H15v.7a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5H5V5h5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg {...common} aria-hidden="true">{paths[name] ?? paths.page}</svg>;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('admin-sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('admin-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (isLogin) return;
    fetch('/api/admin/me', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
          window.location.replace('/admin/login?reason=session-expired');
          return;
        }
        if (payload?.success) {
          setAuthError('');
          setPermissions(payload.data?.permissions || []);
          setSuperAdmin(!!payload.data?.superAdmin);
          return;
        }

        // 当前页面已经通过 Proxy 的签名会话校验，因此 /api/admin/me 临时异常时，
        // 不能把唯一管理员错误地渲染成“没有权限”。UI 菜单显示不属于安全边界，
        // 所有真实 CRUD 请求仍由服务端 requirePermission 再次校验。
        setAuthError(payload?.message || '管理员权限接口暂时不可用');
        setPermissions(['*']);
        setSuperAdmin(true);
      })
      .catch(() => {
        setAuthError('管理员权限接口暂时不可用');
        setPermissions(['*']);
        setSuperAdmin(true);
      })
      .finally(() => setAccessChecked(true));
  }, [isLogin]);

  const can = (permission?: string) =>
    superAdmin ||
    permissions.includes('*') ||
    !permission ||
    permissions.includes(permission) ||
    permissions.some(p => permission.startsWith(`${p}.`));
  const visibleGroups = useMemo(() => groups.map(group => ({ ...group, items: group.items.filter(item => can(item.permission)) })).filter(group => group.items.length), [permissions, superAdmin]);
  const matchedRoute = useMemo(() => {
    for (const group of groups) for (const item of group.items) if (activeFor(pathname, item.href)) return item;
    return null;
  }, [pathname]);
  const routeAllowed = !matchedRoute?.permission || superAdmin || can(matchedRoute.permission);

  const filteredGroups = useMemo(() => {
    const keyword = navSearch.trim().toLowerCase();
    if (!keyword) return visibleGroups;
    return visibleGroups.map(group => ({ ...group, items: group.items.filter(item => `${item.label} ${item.description}`.toLowerCase().includes(keyword)) })).filter(group => group.items.length);
  }, [navSearch, visibleGroups]);

  const current = useMemo(() => {
    for (const group of visibleGroups) for (const item of group.items) if (activeFor(pathname, item.href)) return item;
    return { label: pathname === '/admin' ? '运营工作台' : '后台管理', href: '/admin', icon: 'home' } as NavItem;
  }, [pathname, visibleGroups]);

  if (isLogin) return <>{children}</>;

  if (!accessChecked) return <div className="admin-access-loading">正在校验后台权限…</div>;
  if (!routeAllowed) return <div className="admin-access-denied"><div><span>403 / FORBIDDEN</span><h1>没有访问权限</h1><p>当前管理员没有进入“{matchedRoute?.label || '该功能'}”的权限。请联系超级管理员分配对应角色。</p><Link href="/admin" className="admin-primary-button">返回工作台</Link></div></div>;

  return (
    <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {mobileOpen && <button className="admin-overlay" aria-label="关闭菜单" onClick={() => setMobileOpen(false)} />}
      <aside className="admin-sidebar">
        <div className="admin-brand-row">
          <Link href="/admin" className="admin-brand">
            <span className="admin-brand-mark"><span>AI</span></span>
            <span className="admin-brand-copy"><b>豫辉 AI</b><strong>超级员工 CMS</strong></span>
          </Link>
          <button className="admin-collapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>{collapsed ? <Icon name="chevron" /> : '‹'}</button>
        </div>

        <div className="admin-sidebar-search">
          <Icon name="search" size={16} />
          <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="搜索管理功能" aria-label="搜索管理功能" />
          {navSearch && <button onClick={() => setNavSearch('')} aria-label="清除搜索">×</button>}
        </div>

        {authError && (
          <div className="admin-auth-warning" role="status">
            权限服务暂时异常，已显示完整管理菜单；保存、删除等操作仍由服务器权限校验。
          </div>
        )}

        <div className="admin-nav-scroll">
          {filteredGroups.map(group => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>
              {group.items.map(item => (
                <Link className={activeFor(pathname, item.href) ? 'is-active' : ''} href={item.href} key={item.href} title={collapsed ? item.label : undefined}>
                  <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
                  <span className="nav-copy"><span className="nav-label">{item.label}</span><small>{item.description}</small></span>
                  {activeFor(pathname, item.href) && <span className="nav-active-dot" />}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <Link className="site-link" href="/" target="_blank"><span className="nav-icon"><Icon name="external" size={17} /></span><span className="nav-label">查看官网</span></Link>
          <div className="admin-sidebar-meta"><span className="online-dot" /><span className="nav-label">CMS 服务正常</span></div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="打开菜单"><Icon name="menu" /></button>
            <div className="admin-breadcrumbs"><Link href="/admin">工作台</Link><span>/</span><strong>{current.label}</strong></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-topbar-status"><i /> 数据库已连接</span>
            <Link className="admin-open-site" href="/" target="_blank"><span>打开官网</span><Icon name="external" size={15} /></Link><button className="admin-open-site" onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.href='/admin/login';}}>退出登录</button>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
