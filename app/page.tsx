import { getSiteContent } from "@/lib/site-content";
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ResourceHub from '@/components/resource-hub';
import { getHomeBundle, getSiteSetting, getPage, jsonObject } from '@/lib/public-site';
import MediaImage from '@/components/public/media-image';
import { dynamicEmployeeKicker, dynamicEmployeeTitle, isLikelyImageSource } from '@/lib/media';
import { getEmployeeShowcaseProductSlug } from '@/lib/employee-showcase';
import { getPublicProductSlug } from '@/lib/product-routing';
import { getResourceHubData } from '@/lib/resource-hub';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSetting();
  return {
    title: s?.seoTitle || s?.siteName || '豫辉 AI超级员工｜1套AI = 1支营销团队',
    description: s?.seoDescription || '豫辉 AI超级员工覆盖AI内容、AI获客、AI引流、AI销售与AI客服，让AI成为企业持续工作的营销团队。',
    keywords: s?.seoKeywords || undefined,
    openGraph: { title: s?.seoTitle || s?.siteName || '豫辉 AI超级员工', description: s?.seoDescription || undefined, images: s?.logo ? [{ url: s.logo }] : undefined },
  };
}

const tags: Record<string,string> = {
  'ai-video':'内容生产','ai-mix':'智能剪辑','ai-image':'视觉创作','ip-agent':'IP运营','geo':'AI获客','ai-lead':'客户增长','douyin-customer-service':'客户服务','wechat-customer-service':'客户服务','wecom-customer-service':'销售转化'
};
const icons = ['◈','✦','◇','◎','⌁','↗','◌','◍','▣'];
const fallbackSections: Record<string, any> = {
  hero: { title:'1套AI 1支营销团队', subtitle:'AI获客 · AI引流 · AI内容 · AI销售\n让AI员工持续工作，把营销从“人工操作”变成“智能执行”。' },
  value: { title:'不是一个AI工具，而是一支完整的AI营销团队', subtitle:'从内容生产、品牌IP、AI获客，到客户接待与销售跟进，将多个AI能力组织成一条完整的营销链路。' },
  'ai-employees': { title:'9大AI超级员工', subtitle:'一个AI员工对应一个营销岗位，多个AI员工协同工作，形成完整的AI营销团队。' },
  claw: { title:'从“被动执行”到“主动思考”', subtitle:'你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。' },
  solutions: { title:'不同行业，拥有不同的AI营销方案', subtitle:'从内容生产到获客与客户运营，根据企业业务场景组合AI能力。' },
  cases: { title:'客户案例', subtitle:'真实内容由后台案例库统一维护。' },
  resources: { title:'AI资源中心', subtitle:'Skills、Prompt、教程、产品下载与更新日志，统一沉淀在官网资源中心。' },
  cta: { title:'让AI成为你的营销团队', subtitle:'立即了解豫辉 AI超级员工。' },
};
function section(sections:any,key:string){return {...fallbackSections[key], ...(sections[key]||{})};}

const solutionMeta: Record<string, { kicker: string; icon: string; flow: string[] }> = {
  ecommerce: { kicker: '电商增长', icon: '◈', flow: ['短视频获客', 'IP内容', '客服转化'] },
  'local-life': { kicker: '本地生活', icon: '◎', flow: ['地图曝光', '口碑内容', '线索接待'] },
  education: { kicker: '教育营销', icon: '✦', flow: ['内容生产', '搜索获客', '咨询转化'] },
  automotive: { kicker: '汽车服务', icon: '◇', flow: ['门店曝光', '客户引流', '销售跟进'] },
  manufacturing: { kicker: '制造业', icon: '▣', flow: ['行业内容', '精准获客', '商机跟进'] },
  factory: { kicker: '工厂获客', icon: '⌁', flow: ['产品内容', '关键词曝光', '询盘转化'] },
  'building-materials': { kicker: '建材行业', icon: '◌', flow: ['行业内容', '本地获客', '销售转化'] },
};

function getSolutionMeta(slug: string, name: string) {
  if (solutionMeta[slug]) return solutionMeta[slug];
  const match = Object.entries(solutionMeta).find(([key, meta]) => slug.includes(key) || name.includes(meta.kicker));
  return match?.[1] || { kicker: '行业增长', icon: '✦', flow: ['内容生产', 'AI获客', '客户转化'] };
}

export default async function Home() {
  const siteContent = await getSiteContent();
  const copy = siteContent.home || {};

  const [{setting, sectionMap, products, solutions, cases}, productsCmsPage] = await Promise.all([getHomeBundle(), getPage('products')]);
  const resourceHubBlocks = await getResourceHubData(4);
  const hero = section(sectionMap,'hero');
  const value = section(sectionMap,'value');
  const employeesSection = section(sectionMap,'ai-employees');
  const claw = section(sectionMap,'ai-claw');
  const solutionsSection = section(sectionMap,'solutions');
  const casesSection = section(sectionMap,'cases');
  const resourcesSection = section(sectionMap,'resources');
  const cta = section(sectionMap,'cta');
  const enabled = (key:string) => !sectionMap[key] || sectionMap[key].enabled !== false;
  const heroData = jsonObject(hero.data);
  const heroTask = jsonObject(heroData.task);
  const ctaData = jsonObject(cta.data);
  const valueData = jsonObject(value.data);
  const employeesData = jsonObject(employeesSection.data);
  const clawData = jsonObject(claw.data);
  const solutionsData = jsonObject(solutionsSection.data);
  const casesData = jsonObject(casesSection.data);
  const resourcesData = jsonObject(resourcesSection.data);
  const showcaseSection = productsCmsPage?.sections?.find((item: any) => item.sectionKey === 'showcase');
  const showcaseData = jsonObject(showcaseSection?.data);
  const showcaseItems = showcaseSection && showcaseSection.enabled !== false && Array.isArray(showcaseData.items)
    ? showcaseData.items.filter((item: any) => item && item.enabled !== false && String(item.title || '').trim())
    : [];
  const employees = products;
  const valueItems = Array.isArray(valueData.items) ? valueData.items : [
    { number: '01', title: copy.valueNode1 || '内容生产', desc: copy.valueNode1Desc || 'AI短视频 / AI混剪 / AI生图' },
    { number: '02', title: copy.valueNode2 || '品牌IP', desc: copy.valueNode2Desc || 'IP智能体 / 数字人 / 内容' },
    { number: '03', title: copy.valueNode3 || 'AI获客', desc: copy.valueNode3Desc || 'GEO / AI引流 / 多场景曝光' },
    { number: '04', title: copy.valueNode4 || '客户转化', desc: copy.valueNode4Desc || '抖音 / 微信 / 企业微信客服' },
  ];
  const clawSteps = Array.isArray(clawData.steps) ? clawData.steps : [
    { title: copy.clawStep1 || '理解任务', desc: '识别行业：装修' },
    { title: copy.clawStep2 || '自动拆解', desc: '生成关键词与曝光策略' },
    { title: copy.clawStep3 || '调用AI能力', desc: 'AI引流 · GEO获客' },
    { title: copy.clawStep4 || '持续执行', desc: '任务创建完成后自动运行' },
  ];
  const statusTexts = Array.isArray(heroData.floatingStatuses) ? heroData.floatingStatuses : ['内容生成中', '关键词策略已生成', '正在接待客户'];
  const employeeTitleBase = dynamicEmployeeTitle(employeesSection.title, employees.length);
  const employeeTitle = employeeTitleBase.replace(/AI\s*超级员工/g, 'AI数字员工');
  const employeeKicker = dynamicEmployeeKicker(copy.employeesKicker || '09 AI EMPLOYEES', employees.length);
  const taskProgress = Math.min(100, Math.max(0, Number.parseInt(String(heroTask.progress ?? heroData.progress ?? '82').replace('%',''), 10) || 82));
  const taskStatus = String(heroTask.status ?? 'EXECUTING');
  const taskAgent = String(heroTask.agent ?? 'AI Claw 3.0');
  const taskTitle = String(heroTask.title ?? '正在执行：装修行业关键词曝光任务');
  const taskMeta = String(heroTask.meta ?? '自动拆解任务');
  const taskMode = String(heroTask.mode ?? '关键词曝光 · 自动执行');
  const homePageForExtras = { sections: Object.values(sectionMap) } as any;

  const jsonLd = {
    '@context':'https://schema.org','@type':'Organization','name':setting?.siteName || '豫辉 AI超级员工','url':process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000','description':setting?.seoDescription || 'AI获客、AI引流、AI内容、AI销售与AI客服。'
  };

  return <main className="site-shell">
    <SiteHeader />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    {enabled('hero') && <section className="hero">
      <div className="hero-grid"/><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/>
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot"/> {copy.heroEyebrow || 'AI AGENT · AI WORKFORCE · 24/7'}</div>
          <h1>{hero.title}</h1>
          <p className="hero-lead">{String(hero.subtitle || '').split('\n').map((line:string,i:number)=><span key={i}>{line}{i<String(hero.subtitle||'').split('\n').length-1&&<br/>}</span>)}</p>
          <div className="hero-buttons">
            <Link href={heroData.primaryButton?.url || '/products'} className="button button-primary">{heroData.primaryButton?.text || '探索AI超级员工'} <span>→</span></Link>
            <Link href={heroData.secondaryButton?.url || '/ai-claw'} className="button button-secondary">{heroData.secondaryButton?.text || '了解 AI Claw'}</Link>
          </div>
          <div className="hero-proof"><div><strong>{String(employees.length).padStart(2,'0')}</strong><span>{copy.heroProofEmployees || 'AI超级员工'}</span></div><div><strong>24/7</strong><span>{copy.heroProofWork || '持续工作'}</span></div><div><strong>AI</strong><span>{copy.heroProofExecution || '主动执行'}</span></div></div>
        </div>
        <div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="ai-core"><div className="core-ring"><div className="core-center"><span>AI</span><small>CLAW</small></div></div><span className="core-pulse pulse-one"/><span className="core-pulse pulse-two"/></div>
          <div className="task-card task-card-main">
            <div className="task-header"><span className="task-live"><i/>{taskStatus}</span><span>{taskAgent}</span></div>
            <div className="task-title">{taskTitle}</div>
            <div className="task-mode">{taskMode}</div>
            <div className="progress-track"><span style={{ width: `${taskProgress}%` }}/></div>
            <div className="task-meta"><span>{taskMeta}</span><strong>{taskProgress}%</strong></div>
          </div>
          {employees.slice(0,3).map((p,i)=><div className={`floating-card floating-${['one','two','three'][i]}`} key={p.id}><span>{p.icon || icons[i]}</span><div><strong>{p.name}</strong><small>{statusTexts[i] || ''}</small></div></div>)}
        </div>
      </div>
      <div className="hero-bottom-line"><div className="container"><span>{copy.heroFlow1 || '从内容生产'}</span><i>→</i><span>{copy.heroFlow2 || 'AI获客'}</span><i>→</i><span>{copy.heroFlow3 || '客户接待'}</span><i>→</i><span>{copy.heroFlow4 || '销售跟进'}</span></div></div>
    </section>}

    {enabled('value') && <section className="section section-value"><div className="container"><div className="section-heading centered"><span className="section-kicker">{copy.valueKicker || 'AI WORKFORCE'}</span><h2>{value.title}</h2><p>{value.subtitle}</p></div><div className="value-flow">{valueItems.map((item:any,index:number)=><div key={item.number || index} className="value-flow-item"><div className="value-node"><span>{item.number || String(index+1).padStart(2,'0')}</span><strong>{item.title || ''}</strong><small>{item.desc || item.description || ''}</small></div>{index < valueItems.length - 1 && <div className="flow-arrow">→</div>}</div>)}</div></div></section>}

    {enabled('ai-employees') && <section id="products" className="section section-products employee-workforce-section"><span id="employee-showcase-home" className="employee-showcase-anchor" aria-hidden="true"/><div className="container"><div className="employee-section-heading"><div className="employee-section-heading-main"><div className="employee-section-kicker-row"><span className="section-kicker">{employeeKicker} · AI DIGITAL WORKFORCE</span><span className="employee-live-dot"><i/> 可被调度</span></div><h2>{employeeTitle}</h2><p className="employee-section-lead">{employeesSection.subtitle || '不是 10 个工具，而是 10 个可被调度的 AI 数字岗位：每个岗位有自己的职责、能力与任务入口，组合起来就是一支持续工作的数字营销团队。'} <span className="employee-scene-heading-copy">{showcaseSection?.subtitle || '真实操作现场已融入每个岗位卡片，点击即可查看岗位职责、能力与工作流程。'}</span></p><div className="employee-workflow-pills"><span>内容生产</span><i>→</i><span>品牌IP</span><i>→</i><span>AI获客</span><i>→</i><span>客户转化</span></div></div><div className="employee-section-summary"><div className="employee-summary-top"><strong>{String(employees.length).padStart(2,'0')}</strong><span>AI DIGITAL ROLES</span></div><b>一支可协同的数字员工团队</b><small>岗位能力 · 任务执行 · 持续协同</small></div></div><div className="employee-matrix-label"><span>01 — {String(employees.length).padStart(2,'0')} / AI DIGITAL EMPLOYEE MATRIX</span><small>岗位信息与真实工作现场合并展示 · 选择岗位查看详情</small></div><div className="employee-grid">{employees.map((p,index)=>{const publicProductSlug=getPublicProductSlug(p);const relatedScenes=showcaseItems.filter((scene:any)=>getEmployeeShowcaseProductSlug(scene)===publicProductSlug);const primaryScene=relatedScenes.find((scene:any)=>String(scene.imageUrl||'').trim())||relatedScenes[0];return <Link className={`employee-card${primaryScene?.imageUrl?' has-work-scene':''}`} href={`/products/${getPublicProductSlug(p)}`} key={p.id}><div className="employee-card-glow"/><div className="employee-top"><div className="employee-index-wrap"><span className="employee-index">{String(index+1).padStart(2,'0')}</span><span className="employee-role">DIGITAL EMPLOYEE</span></div><div className="employee-icon-wrap">{isLikelyImageSource(p.icon) ? <MediaImage src={p.icon} alt="" className="employee-icon-media" fallback={<span className="employee-icon">AI</span>} /> : <span className="employee-icon">{p.icon || icons[index] || 'AI'}</span>}</div></div><div className={`employee-work-preview${primaryScene?.imageUrl?' has-image':' text-only'}`}><div className="employee-work-preview-bar"><span><i/><i/><i/></span><small>{primaryScene?.category || 'AI DIGITAL EMPLOYEE / WORK SCENE'}</small><b>{String(index+1).padStart(2,'0')}</b></div>{primaryScene?.imageUrl?<MediaImage src={primaryScene.imageUrl} alt={primaryScene.imageAlt||primaryScene.title} className="employee-work-preview-image" fallback={<div className="employee-work-preview-empty"><strong>AI</strong><span>DIGITAL WORKFLOW</span></div>}/>:<div className="employee-work-preview-empty"><strong>{String(p.shortName||p.name||'AI').slice(0,8)}</strong><span>AI DIGITAL WORKFLOW</span><i/><i/><i/></div>}{primaryScene?.title&&<div className="employee-work-preview-caption"><span>WORK SCENE</span><strong>{primaryScene.title}</strong></div>}</div><div className="employee-body"><span className="employee-tag">{(employeesData.tagBySlug && employeesData.tagBySlug[p.slug]) || tags[p.slug] || p.shortName || 'AI岗位'}</span><h3>{p.name}</h3><p>{p.description || copy.employeeFallback || '可独立执行岗位任务，并与其他 AI 数字员工协同工作。'}</p>{Array.isArray(p.features) && p.features.length > 0 && <div className="employee-feature-chips">{p.features.slice(0, 3).map((feature:any) => <span key={feature.id}>{feature.name}</span>)}</div>}</div><div className="employee-card-bottom"><span>{primaryScene?'查看工作场景与能力':'进入岗位'}</span><i>↗</i></div></Link>})}</div>{employees.length===0&&<div className="empty-public">{employeesData.emptyText || '后台暂未发布 AI 数字员工。'}</div>}<div className="employee-section-footer"><span><b>AI 数字员工</b> = 一个岗位 + 一组能力 + 一套可执行任务</span><Link href="/products">查看全部数字员工 →</Link></div></div></section>}

    {enabled('ai-claw') && <section id="claw" className="section claw-section"><div className="claw-background"><div className="claw-grid"/></div><div className="container claw-inner"><div className="claw-copy"><span className="section-kicker">{copy.clawKicker || 'AI CLAW 3.0'}</span><h2>{claw.title}</h2><p>{claw.subtitle}</p><Link href={jsonObject(claw.data).button?.url || '/ai-claw'} className="button button-white">{jsonObject(claw.data).button?.text || '了解 AI Claw'} <span>→</span></Link></div><div className="claw-console"><div className="console-top"><div className="console-dots"><i/><i/><i/></div><span>{clawData.consoleTitle || copy.clawConsoleTitle || 'AI CLAW COMMAND CENTER'}</span><span className="console-status">{clawData.consoleStatus || copy.clawOnline || 'ONLINE'}</span></div><div className="console-body"><div className="command-line"><span className="command-prefix">&gt;</span><span>{copy.clawCommand || '我是做装修行业的，帮我创建一个关键词曝光任务'}</span><span className="cursor"/></div>{clawSteps.map((item:any,i:number)=><div key={item.title || i}><div className={`process-item ${i<3?'active':''} ${i===2?'executing':''}`}><span>{item.number || `0${i+1}`}</span><div><strong>{item.title || ''}</strong><small>{item.desc || ''}</small></div><b>{i<2?'✓':i===2?'●':'○'}</b></div>{i<clawSteps.length-1&&<div className="process-line"/>}</div>)}</div></div></div></section>}

    {enabled('solutions') && <section className="section section-solutions" id="solutions">
      <div className="container">
        <div className="solutions-intro-row">
          <div className="section-heading">
            <span className="section-kicker">{solutionsData.kicker || 'SOLUTIONS / INDUSTRY PLAYBOOK'}</span>
            <h2>{solutionsSection.title}</h2>
            <p>{solutionsSection.subtitle}</p>
          </div>
          <Link href="/solutions" className="solutions-view-all">查看全部行业方案 <span>↗</span></Link>
        </div>
        <div className="solution-grid">
          {solutions.map((s,index)=>{ const meta=getSolutionMeta(s.slug,s.name); return <Link href={`/solutions/${s.slug}`} className="solution-card" key={s.id}>
            <div className="solution-card-top"><span className="solution-card-index">{String(index+1).padStart(2,'0')}</span><span className="solution-card-icon">{s.icon || meta.icon}</span></div>
            <div className="solution-card-kicker">{meta.kicker}</div>
            <strong>{s.name}</strong>
            <p>{s.description || `围绕${meta.kicker}建立内容、获客、引流与客户转化闭环。`}</p>
            <div className="solution-card-flow">{meta.flow.map((item:string,i:number)=><span key={item}>{item}{i<meta.flow.length-1 && <b>→</b>}</span>)}</div>
            <div className="solution-card-link">查看方案 <i>↗</i></div>
          </Link>;})}
        </div>
        {!solutions.length&&<div className="empty-public">{solutionsData.emptyText || '后台暂未发布解决方案。'}</div>}
      </div>
    </section>}

    {enabled('cases') && <section className="section section-cases" id="cases"><div className="container"><div className="section-heading"><div><span className="section-kicker">{casesData.kicker || 'CASES'}</span><h2>{casesSection.title}</h2></div><p>{casesSection.subtitle}</p></div><div className="case-grid">{cases.map((c)=><Link href={`/cases/${c.slug}`} className="case-card" key={c.id}>{c.coverImage&&<img src={c.coverImage} alt={c.title}/>}<div><span>{c.industry || casesData.tagFallback || '企业案例'}</span><h3>{c.title}</h3><p>{c.description || c.companyName || casesData.descriptionFallback || '查看案例详情'}</p></div><i>↗</i></Link>)}</div>{!cases.length&&<div className="empty-public">{casesData.emptyText || '后台暂未发布案例，发布后首页自动展示。'}</div>}</div></section>}

    {enabled('resources') && <section className="section resource-section resource-section-hub" id="resources"><div className="container"><div className="section-heading"><div><span className="section-kicker">{resourcesData.kicker || 'RESOURCE CENTER'}</span><h2>{resourcesSection.title || 'AI资源中心'}</h2></div><p>{resourcesSection.subtitle || 'Skills、Prompt、使用手册、教程、产品下载与行业资料统一沉淀。'}</p></div><ResourceHub blocks={resourceHubBlocks} variant="home"/><div className="resource-section-all"><Link href="/resources" className="button button-secondary">进入完整资源中心 <span>→</span></Link></div></div></section>}

    {enabled('cta') && <section className="section cta-section"><div className="cta-grid"/><div className="container cta-inner"><span className="section-kicker">{ctaData.kicker || 'START NOW'}</span><h2>{cta.title}</h2><p>{cta.subtitle}</p><div className="cta-buttons"><Link href={ctaData.button?.url || '/contact'} className="button button-white">{ctaData.button?.text || '预约演示'} →</Link><Link href={ctaData.secondaryButton?.url || '/resources'} className="button button-ghost-white">{ctaData.secondaryButton?.text || '进入资源中心'}</Link></div></div></section>}
    <SiteFooter />
  </main>;
}
