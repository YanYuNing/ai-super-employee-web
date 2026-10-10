import { prisma } from "@/lib/prisma";
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { getPage, getPageValue } from '@/lib/public-page';
import PublicExtraSections from '@/components/public/page-extra-sections';
import styles from "./page.module.css";
export default async function Changelog() {
  const [rows, page] = await Promise.all([prisma.changelog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { releaseDate: "desc" },
  }), getPage('changelog')]);
  return (
    <main>
      <SiteHeader dark />
      <section className={styles.hero}>
        <span>{getPageValue(page, 'hero', 'kicker', 'CHANGELOG')}</span>
        <h1>{page?.title || '产品更新日志'}</h1>
        <p>{page?.description || '持续记录 AI 超级员工产品能力与官网内容的更新。'}</p>
      </section>
      <section className={styles.list}>
        {rows.length ? (
          rows.map((x) => (
            <article key={x.id}>
              <div>
                <b>{x.version}</b>
                <small>
                  {new Date(x.releaseDate).toLocaleDateString("zh-CN")}
                </small>
              </div>
              <section>
                <h2>{x.title}</h2>
                <p>{x.content}</p>
              </section>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            暂无已发布更新日志，可在 CMS 后台持续维护。
          </div>
        )}
      </section>
      <PublicExtraSections page={page} reservedKeys={['hero','empty']} />
      <SiteFooter />
    </main>
  );
}
