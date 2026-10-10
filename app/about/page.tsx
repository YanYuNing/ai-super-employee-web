import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { getPage } from '@/lib/public-site';
import { getPageData, getPageSection, getPageValue } from '@/lib/public-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return {
    title: page?.seoTitle || '关于我们｜豫辉 AI超级员工',
    description: page?.seoDescription || page?.description || '了解豫辉 AI超级员工与企业AI营销产品体系。',
    keywords: page?.seoKeywords || undefined,
  };
}

const fallbackStats = [
  { value: 'AI', label: '核心技术方向', detail: '把多种 AI 能力组织成可执行岗位' },
  { value: '24/7', label: '工作方式', detail: '持续处理内容、获客、引流与服务任务' },
  { value: '10', label: '数字员工岗位', detail: '覆盖企业营销关键环节' },
  { value: '1→N', label: '协同方式', detail: '一个任务可调度多名数字员工协作' },
];

export default async function About() {
  const page = await getPage('about');
  const hero = getPageSection(page, 'hero');
  const body = getPageSection(page, 'body');
  const heroData = getPageData(page, 'hero');
  const bodyData = getPageData(page, 'body');
  const heroKicker = getPageValue(page, 'hero', 'kicker', 'ABOUT / AI DIGITAL WORKFORCE');
  const bodyKicker = getPageValue(page, 'body', 'kicker', 'ABOUT US');
  const bodyTitle = body?.title || '我们不是做更多 AI 工具，而是在做一支真正能工作的数字营销团队。';
  const bodySubtitle = body?.subtitle || '豫辉 AI超级员工致力于把分散的 AI 能力组织成岗位，让企业可以从“人找工具”转向“任务找能力”。';
  const principlesKicker = String(bodyData.principlesKicker || 'WHY DIGITAL EMPLOYEE');
  const principlesTitle = String(bodyData.principlesTitle || '从“工具集合”到“岗位协同”');
  const principlesDescription = String(bodyData.principlesDescription || '把产品、Prompt、Skill 与 AI Claw 重新放回一条工作链路里，用户看到的是“谁在做什么”，而不只是“有什么功能”。');
  const statsKicker = String(bodyData.statsKicker || 'AI DIGITAL WORKFORCE / SNAPSHOT');
  const statsStatus = String(bodyData.statsStatus || '● LIVE');
  const storedBodyContent = String(body?.content || '').trim();
  const bodyContent = storedBodyContent && !/^[01]{4,32}$/.test(storedBodyContent)
    ? storedBodyContent
    : '围绕内容生产、品牌 IP、AI 获客、AI 引流、客户接待和销售跟进，我们用数字员工的方式重构企业营销执行链路。每个岗位都有职责、能力和任务入口，AI Claw 再把这些岗位连接起来，形成持续运行的数字工作流。';
  const stats = Array.isArray(bodyData.stats) && bodyData.stats.length ? bodyData.stats : fallbackStats;
  const fallbackPrinciples = [
    { index: '01', title: '岗位化', text: '一个 AI 员工对应一个清晰职责，让能力更容易理解、调用与交接。' },
    { index: '02', title: '可调度', text: 'AI Claw 负责理解任务并调用对应数字员工，不要求用户记住复杂操作。' },
    { index: '03', title: '持续执行', text: '内容生成、获客、客服与销售跟进可以被拆成持续运行的任务。' },
    { index: '04', title: '可沉淀', text: 'Skills、Prompt、教程与行业资料统一沉淀到资源中心，持续复用。' },
  ];
  const principles = Array.isArray(bodyData.principles) && bodyData.principles.length ? bodyData.principles : fallbackPrinciples;
  const heroStats = (stats as any[]).slice(0, 3);
  const sections = (page?.sections || [])
    .filter((section: any) => section.sectionKey !== 'hero' && section.sectionKey !== 'body' && section.enabled !== false)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  return (
    <main className="public-page about-public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light about-hero">
        <div className="inner-hero-grid" />
        <div className="container inner-hero-inner about-hero-inner">
          <span className="section-kicker">{heroKicker}</span>
          <h1>{hero?.title || page?.title || '关于豫辉 AI超级员工'}</h1>
          <p>{hero?.subtitle || page?.description || '用 AI 重构企业营销的内容、获客、引流、销售与客服流程。'}</p>
          <div className="about-hero-actions">
            {heroData.button?.text && <Link href={heroData.button.url || '/contact'} className="button button-primary">{heroData.button.text}<span>→</span></Link>}
            {heroData.secondary?.text ? <Link href={heroData.secondary.url || '/products'} className="button button-secondary">{heroData.secondary.text}</Link> : <Link href="/products" className="button button-secondary">认识 AI 数字员工</Link>}
          </div>
        </div>
        <div className="about-hero-system">
          <div className="about-hero-system-head"><span>AI DIGITAL WORKFORCE</span><b>{statsStatus}</b></div>
          <div className="about-hero-system-core"><span>AI</span><strong>数字员工</strong><small>ROLE-BASED / TASK-READY</small></div>
          <div className="about-hero-system-stats">
            {heroStats.map((item: any, index: number) => <div key={`${item.label || index}-${index}`}><strong>{item.value || item.number || '--'}</strong><span>{item.label || item.title || '数字员工能力'}</span></div>)}
          </div>
          <div className="about-hero-system-flow"><span>岗位</span><i>→</i><span>能力</span><i>→</i><span>任务</span><i>→</i><span>持续执行</span></div>
        </div>
        <div className="about-hero-orbit about-hero-orbit-one" />
        <div className="about-hero-orbit about-hero-orbit-two" />
      </section>

      <section className="public-section about-story-section">
        <div className="container about-story-grid">
          <div className="about-story-copy">
            <span className="section-kicker">{bodyKicker}</span>
            <h2>{bodyTitle}</h2>
            <p className="about-story-lead">{bodySubtitle}</p>
            <div className="about-story-content">{bodyContent}</div>
            {(body?.imageUrl || body?.videoUrl) && <div className="about-story-media">
              {body?.imageUrl && <img src={body.imageUrl} alt={bodyTitle} />}
              {body?.videoUrl && <video src={body.videoUrl} controls playsInline preload="metadata" />}
            </div>}
          </div>
          <aside className="about-stats-card">
            <div className="about-stats-head"><span>{statsKicker}</span><i>{statsStatus}</i></div>
            <div className="about-stats-grid">
              {stats.slice(0, 4).map((item: any, index: number) => (
                <div className="about-stat" key={`${item.label || item.value || index}-${index}`}>
                  <strong>{item.value || item.number || '--'}</strong>
                  <b>{item.label || item.title || '能力指标'}</b>
                  <small>{item.detail || item.desc || item.description || ''}</small>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="public-section about-principles-section">
        <div className="container">
          <div className="about-section-heading">
            <div><span className="section-kicker">{principlesKicker}</span><h2>{principlesTitle}</h2></div>
            <p>{principlesDescription}</p>
          </div>
          <div className="about-principles-grid">
            {principles.slice(0, 8).map((item: any, index: number) => (
              <article className="about-principle" key={`${item.index || item.title || index}-${index}`}>
                <span>{item.index || String(index + 1).padStart(2, '0')}</span><h3>{item.title || item.name || '能力原则'}</h3><p>{item.text || item.description || item.desc || ''}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {!!sections.length && <section className="public-section about-extra-section">
        <div className="container about-extra-grid">
          {sections.map((section) => {
            const data = getPageData({ ...page, sections: [section] } as any, section.sectionKey);
            return <article key={section.id} className="about-extra-card">
              <span className="section-kicker">{data.kicker || section.sectionKey}</span>
              {section.title && <h2>{section.title}</h2>}
              {section.subtitle && <p className="about-extra-subtitle">{section.subtitle}</p>}
              {section.imageUrl && <img src={section.imageUrl} alt={section.title || ''} />}
              {section.videoUrl && <video src={section.videoUrl} controls playsInline preload="metadata" />}
              {section.content && <div>{section.content}</div>}
            </article>;
          })}
        </div>
      </section>}

      <SiteFooter />
    </main>
  );
}
