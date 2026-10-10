import Link from "next/link";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>
            <i />
            <i />
            <i />
          </span>
          <span>
            <b> </b>
            <small>AI超级员工</small>
          </span>
        </Link>
        <nav>
          <Link href="/products">AI超级员工</Link>
          <Link href="/ai-claw">AI Claw</Link>
          <Link href="/solutions">解决方案</Link>
          <Link href="/cases">案例</Link>
          <Link href="/resources">资源中心</Link>
        </nav>
        <Link href="/contact" className={styles.cta}>
          预约演示 <span>↗</span>
        </Link>
      </div>
    </header>
  );
}
