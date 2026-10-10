import type { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceHub from '@/components/resource-hub';
import { getPage, getSiteSetting, jsonObject } from '@/lib/public-site';
import { getResourceHubData, resolveResourceHubBlocks } from '@/lib/resource-hub';
import Link from 'next/link';
import PublicExtraSections from '@/components/public/page-extra-sections';

export async function generateMetadata(): Promise<Metadata> {
  const [page, setting] = await Promise.all([getPage('resources'), getSiteSetting()]);
  return {
    title: page?.seoTitle || `资源中心｜${setting?.siteName || '豫辉 AI超级员工'}`,
    description: page?.seoDescription || page?.description || '豫辉 AI超级员工资源中心，统一沉淀 Skills、Prompt、使用手册、教程与公开资料。',
  };
}

export default async function Resources() {
  const [page, blocks] = await Promise.all([getPage('resources'), getResourceHubData(4)]);
  const resourceHubSection = page?.sections.find((section) => section.sectionKey === 'resource-hub');
  const configured = resolveResourceHubBlocks(jsonObject(resourceHubSection?.data), blocks);

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light resource-center-hero">
        <div className="inner-hero-grid" />
        <div className="container inner-hero-inner">
          <span className="section-kicker">AI DIGITAL WORKFORCE / RESOURCE CENTER</span>
          <h1>{page?.title || 'AI数字员工资源中心'}</h1>
          <p>{page?.description || '把数字员工需要的能力、提示词、教程、产品文件与行业资料，按工作阶段集中到一个资源工作台。'}</p>
        </div>
      </section>

      <section className="public-section resource-center-page-section">
        <div className="container">
          <div className="resource-center-intro">
            <div>
              <span className="section-kicker">ONE WORKSPACE</span>
              <h2>数字员工用什么，就从这里拿什么</h2>
            </div>
            <p>Skills 负责岗位能力，Prompt 负责任务表达，教程与手册帮助上手，下载负责交付，行业资料负责沉淀。五类资源围绕 AI 数字员工工作流组织，而不是把资源平铺成一个文件列表。</p>
          </div>
          <nav className="resource-center-quick-nav" aria-label="资源类型导航">
            {configured.map((block) => <Link href={block.href} key={block.key}><span>{block.key === 'skills' ? 'S' : block.key === 'prompts' ? 'P' : block.key === 'guides' ? 'G' : block.key === 'downloads' ? 'D' : 'M'}</span>{block.title}<b>{block.count}</b></Link>)}
          </nav>

          {configured.length ? <ResourceHub blocks={configured} variant="page" /> : <div className="empty-public">后台暂未发布资源中心内容。</div>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
