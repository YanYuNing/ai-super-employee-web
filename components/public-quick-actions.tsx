'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PublicQuickActions() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);
  if (pathname.startsWith('/admin')) return null;
  useEffect(() => { const onScroll = () => setShowTop(window.scrollY > 520); window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); return () => window.removeEventListener('scroll', onScroll); }, []);
  return <>
    <div className="public-quick-actions">
      <Link href="/contact" className="quick-action quick-demo"><span>◈</span><b>预约演示</b></Link>
      <Link href="/resources" className="quick-action"><span>⌁</span><b>资源中心</b></Link>
      {showTop && <button className="quick-action quick-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span>↑</span><b>回到顶部</b></button>}
    </div>
    <div className="public-mobile-cta"><Link href="/products">查看AI员工</Link><Link href="/contact">预约演示</Link></div>
  </>;
}
