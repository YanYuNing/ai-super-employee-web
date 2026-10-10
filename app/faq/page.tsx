import { prisma } from "@/lib/prisma";
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { getPage, getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';
import styles from "./page.module.css";
export default async function FAQ(){const [rows,page]=await Promise.all([prisma.faq.findMany({where:{status:'PUBLISHED'},orderBy:{sortOrder:'asc'}}),getPage('faq')]);return <main><SiteHeader dark/><section className={styles.hero}><span>{getPageValue(page,'hero','kicker','FAQ')}</span><h1>{page?.title||'常见问题'}</h1><p>{page?.description||'产品、部署、使用与服务相关问题统一沉淀在这里。'}</p></section><section className={styles.list}>{rows.length?rows.map(x=><details key={x.id}><summary>{x.category&&<em>{x.category}</em>}{x.question}<b>+</b></summary><p>{x.answer}</p></details>):<div className={styles.empty}>{getPageValue(page,'empty','text','暂无已发布 FAQ，可在 CMS 后台维护。')}</div>}</section><PublicExtraSections page={page} reservedKeys={['hero','empty']} /><SiteFooter/></main>}
