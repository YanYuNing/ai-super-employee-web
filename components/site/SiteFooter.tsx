import Link from "next/link";
import styles from "./SiteFooter.module.css";
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div>
          <Link href="/" className={styles.brand}>
            {" "}
            AI超级员工
          </Link>
          <p>AI获客 · AI引流 · AI内容 · AI销售 · AI客服</p>
        </div>
        <div className={styles.links}>
          <div>
            <b>产品</b>
            <Link href="/products">AI超级员工</Link>
            <Link href="/ai-claw">AI Claw</Link>
          </div>
          <div>
            <b>资源</b>
            <Link href="/skills">Skills</Link>
            <Link href="/prompts">Prompt</Link>
            <Link href="/docs">教程</Link>
            <Link href="/download">产品下载</Link>
          </div>
          <div>
            <b>联系</b>
            <Link href="/contact">预约演示</Link>
            <Link href="/about">关于我们</Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} AI超级员工</span>
        <span>企业官网 · CMS 内容管理系统</span>
      </div>
    </footer>
  );
}
