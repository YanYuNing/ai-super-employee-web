"use client";

import { FormEvent, useState } from "react";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [m, setM] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!u.trim() || !p) {
      setM("请输入管理员账号和密码");
      return;
    }
    setLoading(true);
    setM("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u.trim(), password: p }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "登录失败");
      window.location.href = "/admin";
    } catch (error) {
      setM(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark"><span>AI</span></span>
          <div className="admin-brand-copy"><b>豫辉 AI</b><strong>超级员工 CMS</strong></div>
        </div>
        <div className="admin-eyebrow">CONTENT OPERATIONS</div>
        <h1>登录管理后台</h1>
        <p>统一管理官网产品、首页、内容、资源、素材、线索与 SEO。</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label>管理员账号<input autoComplete="username" value={u} onChange={e => setU(e.target.value)} placeholder="请输入管理员账号" /></label>
          <label>管理员密码<input autoComplete="current-password" value={p} onChange={e => setP(e.target.value)} type="password" placeholder="请输入管理员密码" /></label>
          <button type="submit" disabled={loading}>{loading ? "登录中..." : "进入 CMS"}</button>
          {m && <div className="admin-error-message">{m}</div>}
        </form>
      </section>
    </main>
  );
}
