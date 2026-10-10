"use client";

import { useEffect, useMemo, useState } from "react";
import AssetPicker from "@/components/admin/asset-picker";

type SectionKey = "site.nav" | "site.footer" | "site.home";
type NavItem = { label: string; href: string; enabled?: boolean };

const titles: Record<SectionKey, string> = {
  "site.nav": "导航与品牌",
  "site.footer": "网站底部",
  "site.home": "首页固定文案",
};

const fields: Record<SectionKey, Array<[string, string]>> = {
  "site.nav": [["brandTitle", "品牌名称"], ["brandSubtitle", "品牌副标题"], ["contactText", "联系我们按钮"], ["demoText", "预约演示按钮"]],
  "site.footer": [["description", "底部简介"], ["productTitle", "产品栏目标题"], ["resourceTitle", "资源栏目标题"], ["knowledgeTitle", "知识栏目标题"], ["contactTitle", "联系栏目标题"], ["copyright", "版权信息"], ["icp", "ICP备案"]],
  "site.home": [
    ["heroEyebrow", "Hero 小标题"], ["heroProofEmployees", "Hero 数据1"], ["heroProofWork", "Hero 数据2"], ["heroProofExecution", "Hero 数据3"],
    ["heroFlow1", "Hero 流程1"], ["heroFlow2", "Hero 流程2"], ["heroFlow3", "Hero 流程3"], ["heroFlow4", "Hero 流程4"],
    ["valueKicker", "价值区英文标题"], ["valueNode1", "价值节点1"], ["valueNode1Desc", "价值节点1说明"], ["valueNode2", "价值节点2"], ["valueNode2Desc", "价值节点2说明"],
    ["valueNode3", "价值节点3"], ["valueNode3Desc", "价值节点3说明"], ["valueNode4", "价值节点4"], ["valueNode4Desc", "价值节点4说明"],
    ["employeesKicker", "AI员工区标题"], ["employeeFallback", "产品无内容时提示"],
    ["clawKicker", "AI Claw区标题"], ["clawConsoleTitle", "AI Claw控制台标题"], ["clawOnline", "在线状态"], ["clawCommand", "演示指令"],
    ["clawStep1", "步骤1"], ["clawStep2", "步骤2"], ["clawStep3", "步骤3"], ["clawStep4", "步骤4"],
  ],
};

function copyItems(value: any): NavItem[] {
  return Array.isArray(value) ? value.map((item) => ({ label: String(item?.label || ""), href: String(item?.href || "#"), enabled: item?.enabled !== false })) : [];
}

export default function SiteContentAdmin() {
  const [active, setActive] = useState<SectionKey>("site.nav");
  const [data, setData] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSetting, setSiteSetting] = useState<Record<string, any>>({});
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [r, settingsResponse] = await Promise.all([
        fetch("/api/admin/site-content", { cache: "no-store" }),
        fetch("/api/admin/settings", { cache: "no-store" }),
      ]);
      const [j, settingsJson] = await Promise.all([r.json(), settingsResponse.json()]);
      if (j.success) setData(j.data || {}); else setMsg(j.message || "读取失败");
      if (settingsJson.success) setSiteSetting(settingsJson.data || {});
      else setLogoMsg(settingsJson.message || "品牌设置读取失败，请检查设置权限。");
    } catch { setMsg("读取失败，请检查服务是否正常启动。"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const current = useMemo(() => ({ ...(data[active] || {}) }), [data, active]);

  function setValue(key: string, value: any) {
    setData((old) => ({ ...old, [active]: { ...(old[active] || {}), [key]: value } }));
  }

  function updateList(key: "items" | "productLinks" | "resourceLinks" | "knowledgeLinks", index: number, patch: Partial<NavItem>) {
    const list = copyItems(current[key]);
    list[index] = { ...list[index], ...patch };
    setValue(key, list);
  }

  function addListItem(key: "items" | "productLinks" | "resourceLinks" | "knowledgeLinks") {
    const list = copyItems(current[key]);
    list.push({ label: "新菜单", href: "/", enabled: true });
    setValue(key, list);
  }

  function removeListItem(key: "items" | "productLinks" | "resourceLinks" | "knowledgeLinks", index: number) {
    const list = copyItems(current[key]);
    list.splice(index, 1);
    setValue(key, list);
  }


  async function saveBrandLogo() {
    setLogoSaving(true); setLogoMsg("");
    try {
      const payload = {
        siteName: siteSetting.siteName || "",
        logo: siteSetting.logo || "",
        favicon: siteSetting.favicon || "",
        phone: siteSetting.phone || "",
        wechat: siteSetting.wechat || "",
        email: siteSetting.email || "",
        copyright: siteSetting.copyright || "",
        icp: siteSetting.icp || "",
        seoTitle: siteSetting.seoTitle || "",
        seoDescription: siteSetting.seoDescription || "",
        seoKeywords: siteSetting.seoKeywords || "",
      };
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Logo 保存失败");
      if (result.data) setSiteSetting((old) => ({ ...old, ...result.data }));
      setLogoMsg(payload.logo ? "品牌 Logo 已保存；刷新官网即可查看。" : "已切换为默认品牌图标；刷新官网即可查看。");
    } catch (error) {
      setLogoMsg(error instanceof Error ? error.message : "Logo 保存失败，请检查网络和权限。");
    } finally { setLogoSaving(false); }
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/admin/site-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: active, value: data[active] || {} }) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || "保存失败");
      setMsg("保存成功，刷新前台后立即生效。");
    } catch (error) { setMsg(error instanceof Error ? error.message : "保存失败，请检查网络。"); }
    finally { setSaving(false); }
  }

  return <main className="admin-page site-content-admin">
    <div className="admin-page-header">
      <div><div className="admin-eyebrow">CMS / SITE CONTENT</div><h1>全站内容</h1><p>这里管理用户端真实会用到的导航、品牌、底部链接与首页固定文字；页面结构和业务数据则在“页面内容”中维护。</p></div>
      <div className="site-content-actions"><a className="admin-secondary-button" href="/admin/pages">页面内容</a><a className="admin-ghost-button" href="/" target="_blank" rel="noreferrer">预览官网 ↗</a></div>
    </div>

    <section className="admin-section-card site-content-card">
      <div className="site-content-tabs">{(Object.keys(titles) as SectionKey[]).map((key) => <button key={key} type="button" className={active === key ? "active" : ""} onClick={() => { setActive(key); setMsg(""); }}>{titles[key]}</button>)}</div>
      {loading ? <div className="admin-loading">加载中…</div> : <>
        {active === "site.nav" && <div className="cms-form-grid site-content-grid">
          <div className="site-brand-logo-editor full">
            <div className="site-brand-logo-heading">
              <div><span className="admin-eyebrow">BRAND IDENTITY</span><strong>官网顶部 Logo</strong><p>这里控制导航栏左侧标记。选择图片后全站页头同步使用；清除图片并保存后恢复默认三线图标。</p></div>
              <span className="site-brand-logo-live">LIVE PREVIEW</span>
            </div>
            <div className="site-brand-logo-body">
              <div className="site-brand-logo-preview">
                {siteSetting.logo ? <img src={siteSetting.logo} alt="当前官网 Logo 预览" /> : <span className="site-brand-logo-fallback"><i/><i/><i/></span>}
                <div><strong>{siteSetting.siteName || current.brandTitle || "豫辉 AI"}</strong><small>{current.brandSubtitle || "AI超级员工"}</small></div>
              </div>
              <div className="site-brand-logo-controls">
                <AssetPicker label="更换 Logo 图片" folder="site/logo" accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={20} value={siteSetting.logo || ""} onChange={(asset) => { setSiteSetting((old) => ({ ...old, logo: asset.url, logoAssetId: asset.assetId })); setLogoMsg("图片已选中，请点击保存品牌 Logo 后发布到官网。"); }} helper="建议使用透明 PNG 或 SVG；推荐正方形图标，浅色/深色背景都应清晰。" />
                <div className="site-brand-logo-actions"><button type="button" className="admin-secondary-button" onClick={() => { setSiteSetting((old) => ({ ...old, logo: "", logoAssetId: undefined })); setLogoMsg("已切换为默认图标，点击保存后生效。"); }}>恢复默认图标</button><button type="button" className="admin-primary-button" disabled={logoSaving || loading} onClick={() => void saveBrandLogo()}>{logoSaving ? "保存中…" : "保存品牌 Logo"}</button></div>
                {logoMsg && <p className={logoMsg.includes("失败") || logoMsg.includes("没有权限") ? "admin-error-message" : "admin-save-message"}>{logoMsg}</p>}
              </div>
            </div>
          </div>
          {fields[active].map(([key, label]) => <label key={key}><span>{label}</span><input value={String(current[key] ?? "")} onChange={(e) => setValue(key, e.target.value)} /></label>)}
          <div className="site-content-list-field full"><div className="site-content-list-head"><div><strong>顶部导航菜单</strong><small>所有前台顶部导航都从这里渲染，可自行调整名称、地址与是否显示。</small></div><button type="button" className="admin-secondary-button" onClick={() => addListItem("items")}>＋ 添加导航</button></div>
            <div className="site-content-list">{copyItems(current.items).map((item, index) => <div className="site-content-row" key={`${index}-${item.href}`}><input value={item.label} onChange={(e) => updateList("items", index, { label: e.target.value })} placeholder="导航名称"/><input value={item.href} onChange={(e) => updateList("items", index, { href: e.target.value })} placeholder="/about"/><label className="site-content-enable"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => updateList("items", index, { enabled: e.target.checked })}/>显示</label><button type="button" className="danger" onClick={() => removeListItem("items", index)}>删除</button></div>)}</div>
          </div>
        </div>}

        {active === "site.footer" && <div className="cms-form-grid site-content-grid">
          {fields[active].map(([key, label]) => <label key={key}><span>{label}</span><input value={String(current[key] ?? "")} onChange={(e) => setValue(key, e.target.value)} /></label>)}
          <div className="site-content-list-field full"><div className="site-content-list-head"><div><strong>Footer 产品链接</strong><small>Footer 产品栏目不再写死。</small></div><button type="button" className="admin-secondary-button" onClick={() => addListItem("productLinks")}>＋ 添加链接</button></div><div className="site-content-list">{copyItems(current.productLinks).map((item, index) => <div className="site-content-row" key={`${index}-${item.href}`}><input value={item.label} onChange={(e) => updateList("productLinks", index, { label: e.target.value })} placeholder="名称"/><input value={item.href} onChange={(e) => updateList("productLinks", index, { href: e.target.value })} placeholder="/products"/><label className="site-content-enable"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => updateList("productLinks", index, { enabled: e.target.checked })}/>显示</label><button type="button" className="danger" onClick={() => removeListItem("productLinks", index)}>删除</button></div>)}</div></div>
          <div className="site-content-list-field full"><div className="site-content-list-head"><div><strong>Footer 资源链接</strong><small>Footer 资源栏目不再写死。</small></div><button type="button" className="admin-secondary-button" onClick={() => addListItem("resourceLinks")}>＋ 添加链接</button></div><div className="site-content-list">{copyItems(current.resourceLinks).map((item, index) => <div className="site-content-row" key={`${index}-${item.href}`}><input value={item.label} onChange={(e) => updateList("resourceLinks", index, { label: e.target.value })} placeholder="名称"/><input value={item.href} onChange={(e) => updateList("resourceLinks", index, { href: e.target.value })} placeholder="/resources"/><label className="site-content-enable"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => updateList("resourceLinks", index, { enabled: e.target.checked })}/>显示</label><button type="button" className="danger" onClick={() => removeListItem("resourceLinks", index)}>删除</button></div>)}</div></div>
          <div className="site-content-list-field full"><div className="site-content-list-head"><div><strong>Footer 知识链接</strong><small>文章、FAQ、更新日志等知识内容从这里统一挂到用户端 Footer。</small></div><button type="button" className="admin-secondary-button" onClick={() => addListItem("knowledgeLinks")}>＋ 添加链接</button></div><div className="site-content-list">{copyItems(current.knowledgeLinks).map((item, index) => <div className="site-content-row" key={`${index}-${item.href}`}><input value={item.label} onChange={(e) => updateList("knowledgeLinks", index, { label: e.target.value })} placeholder="名称"/><input value={item.href} onChange={(e) => updateList("knowledgeLinks", index, { href: e.target.value })} placeholder="/faq"/><label className="site-content-enable"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => updateList("knowledgeLinks", index, { enabled: e.target.checked })}/>显示</label><button type="button" className="danger" onClick={() => removeListItem("knowledgeLinks", index)}>删除</button></div>)}</div></div>
        </div>}

        {active === "site.home" && <div className="cms-form-grid site-content-grid">{fields[active].map(([key, label]) => <label key={key} className={key.includes("Desc") || key.includes("Title") || key.includes("Command") || key.includes("Meta") ? "full" : ""}><span>{label}</span><textarea rows={key.includes("Desc") || key.includes("Command") || key.includes("Meta") ? 3 : 2} value={String(current[key] ?? "")} onChange={(e) => setValue(key, e.target.value)} /></label>)}</div>}
      </>}
      <div className="admin-form-actions"><span className={msg.includes("失败") ? "admin-error-message" : "admin-save-message"}>{msg}</span><button className="admin-primary-button" disabled={saving || loading} onClick={() => void save()}>{saving ? "保存中…" : "保存当前内容"}</button></div>
    </section>
  </main>;
}
