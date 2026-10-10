import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ContactForm from '@/components/contact-form';
import { getPage } from '@/lib/public-site';
import { getPageData, getPageList, getPageSection, getPageValue } from '@/lib/public-page';
import { prisma } from '@/lib/prisma';
import { dynamicEmployeePhrase } from '@/lib/media';

export async function generateMetadata(): Promise<Metadata> {
  const [page, employeeCount] = await Promise.all([getPage('contact'), prisma.product.count({ where: { status: 'ACTIVE' } })]);
  return {
    title: page?.seoTitle || '预约演示｜豫辉 AI超级员工',
    description: page?.seoDescription || page?.description || '预约豫辉 AI超级员工产品演示。',
  };
}

const fallbackSteps = ['业务场景梳理', '产品能力演示', '部署方式沟通'];

export default async function Contact() {
  const [page, employeeCount] = await Promise.all([getPage('contact'), prisma.product.count({ where: { status: 'ACTIVE' } })]);
  const hero = getPageSection(page, 'hero');
  const intro = getPageSection(page, 'intro');
  const steps = getPageList(page, 'steps', fallbackSteps);
  const heroData = getPageData(page, 'hero');
  const introData = getPageData(page, 'intro');

  return (
    <main className="public-page">
      <SiteHeader dark />
      <section className="inner-hero inner-hero-light">
        <div className="container inner-hero-inner">
          <span className="section-kicker">{getPageValue(page, 'hero', 'kicker', 'CONTACT')}</span>
          <h1>{hero?.title || page?.title || '预约 AI 超级员工演示'}</h1>
          <p>{hero?.subtitle || page?.description || '告诉我们你的行业、业务场景和当前需求，我们会根据实际情况安排演示与沟通。'}</p>
          <div className="inner-hero-actions">
            <Link href={heroData.secondary?.url || '/products'} className="button button-secondary">{heroData.secondary?.text || '先看看产品'}</Link>
          </div>
        </div>
      </section>
      <section className="public-section">
        <div className="container contact-layout">
          <div>
            <span className="section-kicker">{getPageValue(page, 'intro', 'kicker', 'DEMO')}</span>
            <h2>{intro?.title || introData.title || '让AI真正进入你的营销流程'}</h2>
            <p className="contact-copy">{dynamicEmployeePhrase(intro?.subtitle || '从内容生产、AI获客、引流，到客服与销售跟进，现场了解9大AI超级员工如何协同工作。', employeeCount)}</p>
            <div className="contact-points">
              {steps.map((item: any, index: number) => {
                const text = typeof item === 'string' ? item : item?.text || item?.title || '';
                return <div key={`${text}-${index}`}><strong>{String(index + 1).padStart(2, '0')}</strong><span>{text}</span></div>;
              })}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
