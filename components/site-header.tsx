import Link from 'next/link';
import { getSiteContent } from '@/lib/site-content';
import { getSiteSetting } from '@/lib/public-site';

export default async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const [setting, content] = await Promise.all([getSiteSetting(), getSiteContent()]);
  const nav = content.nav || {};
  const items = (nav.items || []).filter((x) => x.enabled !== false);
  const siteName = setting?.siteName || nav.brandTitle || '豫辉';
  const brandSubtitle = nav.brandSubtitle || 'AI超级员工';

  return (
    <header className={`public-header${dark ? ' public-header-dark' : ''}`}>
      <div className="container public-header-inner">
        <Link href="/" className="public-brand">
          {setting?.logo ? <img src={setting.logo} alt={siteName} className="public-brand-logo" /> : <span className="public-brand-mark"><i /><i /><i /></span>}
          <span><strong>{siteName}</strong><small>{brandSubtitle}</small></span>
        </Link>
        <nav className="public-nav">
          {items.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-header-actions">
          <Link href="/contact" className="public-header-contact">{nav.contactText || '联系我们'}</Link>
          <Link href="/contact" className="button button-primary button-small">{nav.demoText || '预约演示'}</Link>
        </div>
        <details className="public-mobile-menu">
          <summary>☰</summary>
          <div>{items.map((item) => <Link key={`m-${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}<Link href="/contact">{nav.demoText || '预约演示'}</Link></div>
        </details>
      </div>
    </header>
  );
}
