import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";
import { getSiteSetting } from "@/lib/public-site";

export default async function SiteFooter() {
  const [setting, content] = await Promise.all([getSiteSetting(), getSiteContent()]);
  const footer = content.footer || {};
  const nav = content.nav || {};
  const productLinks = (footer.productLinks || []).filter((item) => item.enabled !== false);
  const resourceLinks = (footer.resourceLinks || []).filter((item) => item.enabled !== false);
  const knowledgeLinks = (footer.knowledgeLinks || []).filter((item) => item.enabled !== false);
  return (
    <footer className="public-footer">
      <div className="container public-footer-main">
        <div className="public-footer-brand">
          <Link href="/" className="public-brand public-brand-footer">
            {setting?.logo ? <img src={setting.logo} alt={setting.siteName || '豫辉'} className="public-brand-logo" /> : <span className="public-brand-mark"><i /><i /><i /></span>}
            <span><strong>{setting?.siteName || nav.brandTitle || "豫辉"}</strong><small>{nav.brandSubtitle || 'AI超级员工'}</small></span>
          </Link>
          <p>{footer.description || "AI获客 + AI引流 + AI销售，让企业拥有一支持续工作的AI营销团队。"}</p>
        </div>
        <div><strong>{footer.productTitle || "产品"}</strong>{productLinks.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>{footer.resourceTitle || "资源"}</strong>{resourceLinks.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>{footer.knowledgeTitle || "知识中心"}</strong>{knowledgeLinks.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}</div>
        <div><strong>{footer.contactTitle || "联系"}</strong><Link href="/contact">{nav.demoText || "预约演示"}</Link>{setting?.phone && <span>{setting.phone}</span>}{setting?.wechat && <span>{setting.wechat}</span>}{setting?.email && <span>{setting.email}</span>}</div>
      </div>
      <div className="container public-footer-bottom">
        <span>{footer.copyright || setting?.copyright || `© ${new Date().getFullYear()} 豫辉 AI超级员工`}</span>
        <span>{footer.icp || setting?.icp || ""}</span>
      </div>
    </footer>
  );
}
