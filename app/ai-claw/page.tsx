import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { getPage } from '@/lib/public-site';
import { prisma } from '@/lib/prisma';
import { dynamicEmployeePhrase, dynamicEmployeeTitle } from '@/lib/media';
import { getPageData, getPageList, getPageSection, getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';

const fallbackSteps = [
  { number: '01', title: '理解任务', desc: '识别行业、目标与任务要求' },
  { number: '02', title: '自动拆解', desc: '生成执行步骤与策略' },
  { number: '03', title: '调用AI能力', desc: '调度对应AI超级员工协同工作' },
  { number: '04', title: '持续执行', desc: '任务创建后持续推进并反馈' },
];

export async function generateMetadata(): Promise<Metadata> {
  const [page, employeeCount] = await Promise.all([getPage('ai-claw'), prisma.product.count({ where: { status: 'ACTIVE' } })]);
  return {
    title: page?.seoTitle || 'AI Claw 3.0｜主动思考的 AI 营销指挥中心',
    description: dynamicEmployeePhrase(page?.seoDescription || page?.description || 'AI Claw 3.0 将9大AI超级员工统一调度。', employeeCount),
  };
}

export default async function AiClawPage() {
  const [page, employeeCount] = await Promise.all([getPage('ai-claw'), prisma.product.count({ where: { status: 'ACTIVE' } })]);
  const hero = getPageSection(page, 'hero');
  const process = getPageSection(page, 'process');
  const examples = getPageSection(page, 'examples');
  const workforce = getPageSection(page, 'workforce');
  const heroData = getPageData(page, 'hero');
  const steps = getPageList(page, 'process', fallbackSteps);
  const exampleItems = getPageList(page, 'examples', [
    '我是做装修行业的，帮我创建一个关键词曝光任务',
    '帮我生成一条 IP 智能体视频',
    '帮我发布一下短视频',
  ]);
  const workforceItems = getPageList(page, 'workforce', [
    { title: '理解', text: '识别行业、目标与任务上下文。' },
    { title: '拆解', text: '把自然语言转换成清晰的执行步骤。' },
    { title: '调度', text: '调用内容、获客、引流、客服等AI员工。' },
    { title: '执行', text: '持续推动任务并反馈执行结果。' },
  ]);

  return <main className="public-page">
    <SiteHeader dark />
    <section className="inner-hero inner-hero-dark">
      <div className="inner-hero-grid" />
      <div className="container inner-hero-inner">
        <span className="section-kicker">{getPageValue(page, 'hero', 'kicker', 'AI CLAW 3.0')}</span>
        <h1>{hero?.title || page?.title || '从“被动执行”到“主动思考”'}</h1>
        <p>{hero?.subtitle || page?.description || '你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。'}</p>
        <div className="inner-hero-actions">
          <Link href={heroData.primary?.url || '/contact'} className="button button-primary">{heroData.primary?.text || '预约演示'}</Link>
          <Link href={heroData.secondary?.url || '/products'} className="button button-ghost-white">{heroData.secondary?.text || `查看${employeeCount}大AI员工`}</Link>
        </div>
      </div>
    </section>

    <section className="public-section">
      <div className="container">
        <div className="section-heading centered">
          <span className="section-kicker">{getPageValue(page, 'process', 'kicker', 'COMMAND CENTER')}</span>
          <h2>{process?.title || '一句话下达任务，AI自己完成后面的工作'}</h2>
          <p>{process?.subtitle || 'AI理解目标后，自动调用对应能力，不需要记复杂操作流程。'}</p>
        </div>
        <div className="claw-public-grid">
          <div className="claw-console public-console">
            <div className="console-top"><div className="console-dots"><i/><i/><i/></div><span>{getPageValue(page, 'process', 'consoleTitle', 'AI CLAW COMMAND CENTER')}</span><span className="console-status">{getPageValue(page, 'process', 'consoleStatus', 'ONLINE')}</span></div>
            <div className="console-body">
              <div className="command-line"><span className="command-prefix">&gt;</span><span>{heroData.command || '我是做装修行业的，帮我创建一个关键词曝光任务'}</span></div>
              {steps.map((item: any, index: number) => <div className="process-item active" key={item.number || index}><span>{item.number || String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.desc}</small></div><b>✓</b></div>)}
            </div>
          </div>
          <div className="claw-example-list">
            <span className="section-kicker">{getPageValue(page, 'examples', 'kicker', 'EXAMPLES')}</span>
            <h3>{examples?.title || '支持自然语言下达营销任务'}</h3>
            {exampleItems.map((item: any, index: number) => {
              const text = typeof item === 'string' ? item : item?.text || item?.title || '';
              return <div className="claw-example" key={`${text}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{text}</p><i>→</i></div>;
            })}
          </div>
        </div>
      </div>
    </section>

    <section className="public-section public-section-soft">
      <div className="container">
        <div className="section-heading centered">
          <span className="section-kicker">{getPageValue(page, 'workforce', 'kicker', 'AI WORKFORCE')}</span>
          <h2>{dynamicEmployeeTitle(workforce?.title || '9大AI超级员工统一协同', employeeCount, 'AI超级员工')}</h2>
          <p>{workforce?.subtitle || 'AI Claw是统一的智能操作中心，负责把目标拆解为可执行任务。'}</p>
        </div>
        <div className="public-feature-grid">{workforceItems.map((item: any, index: number) => <div key={item.title || index}><strong>{item.title}</strong><p>{item.text || item.description || ''}</p></div>)}</div>
      </div>
    </section>
    <PublicExtraSections page={page} reservedKeys={['hero','process','examples','workforce','empty']} />
    <SiteFooter />
  </main>;
}
