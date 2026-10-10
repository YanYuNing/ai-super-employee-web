import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { prisma } from '@/lib/prisma';
import { getPage } from '@/lib/public-site';
import { getPageData } from '@/lib/public-page';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const x = await prisma.solution.findFirst({ where: { slug, status: 'PUBLISHED' } }); return { title: x?.seoTitle || `${x?.name || '解决方案'}｜豫辉 AI超级员工`, description: x?.seoDescription || x?.description || '豫辉 AI超级员工行业解决方案。' }; }

export default async function SolutionDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const [x, cms] = await Promise.all([prisma.solution.findFirst({ where: { slug, status: 'PUBLISHED' } }), getPage('solutions')]); if (!x) notFound(); const detail = getPageData(cms, 'detail'); return <main className="public-page solution-detail-page"><SiteHeader dark/><section className="inner-hero inner-hero-light"><div className="inner-hero-grid"/><div className="container inner-hero-inner"><Link href="/solutions" className="solution-detail-back">← 返回行业解决方案</Link><span className="section-kicker">{detail.kicker || 'SOLUTION'}</span><h1>{x.name}</h1><p>{x.description}</p><div className="solution-detail-actions"><Link href={detail.primary?.url || '/contact'} className="button button-primary">{detail.primary?.text || '咨询方案'}<span>→</span></Link><Link href="/solutions" className="button button-secondary">继续浏览行业方案</Link></div></div></section><section className="public-section"><div className="container solution-detail-content"><div className="solution-detail-main"><span className="section-kicker">{detail.bodyKicker || 'INDUSTRY PLAYBOOK'}</span><h2>{detail.contentTitle || '营销作战方案'}</h2><div className="rich-content">{x.content||detail.emptyContent||'该方案的详细内容正在持续完善。'}</div></div><aside className="solution-detail-aside"><span>AI DIGITAL WORKFORCE</span><strong>按行业调度数字员工</strong><p>把内容生产、获客、引流、客户接待与销售跟进组合成可执行链路。</p><Link href="/products">查看数字员工 →</Link></aside></div></section><SiteFooter/></main>; }
