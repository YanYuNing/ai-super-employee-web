"use client";

import Link from "next/link";
import AssetPicker from "@/components/admin/asset-picker";
import { isLikelyImageSource } from "@/lib/media";
import { getPublicProductSlug } from "@/lib/product-routing";
import { useEffect, useMemo, useState } from "react";

type ProductFeature = { id?: number; name: string; description?: string | null; icon?: string | null; sortOrder: number };

type Product = {
  id: number;
  slug: string;
  name: string;
  shortName: string | null;
  description: string | null;
  content: string | null;
  icon: string | null;
  coverImage: string | null;
  videoUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | string;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  features?: ProductFeature[];
};

type FormState = Omit<Product, "id" | "status" | "features"> & { status: string; features: ProductFeature[] };

const emptyForm: FormState = {
  slug: "",
  name: "",
  shortName: "",
  description: "",
  content: "",
  icon: "",
  coverImage: "",
  videoUrl: "",
  status: "ACTIVE",
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
  features: [],
};

function statusText(status: string) {
  return status === "ACTIVE" ? "已启用" : "已停用";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "读取产品失败");
      setProducts(result.data || []);
    } catch (error) {
      console.error(error);
      setMessage("读取产品失败");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = filter === "ALL" || product.status === filter;
      const matchesKeyword = !keyword || [product.name, product.slug, product.shortName, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [products, search, filter]);

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({
      slug: getPublicProductSlug(product),
      name: product.name,
      shortName: product.shortName || "",
      description: product.description || "",
      content: product.content || "",
      icon: product.icon || "",
      coverImage: product.coverImage || "",
      videoUrl: product.videoUrl || "",
      status: product.status,
      sortOrder: product.sortOrder,
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
      features: (product.features || []).map((feature) => ({ ...feature })),
    });
    setMessage("");
    setDrawerOpen(true);
  }

  function newProduct() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setDrawerOpen(true);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFeature(index: number, patch: Partial<ProductFeature>) {
    setForm((current) => ({ ...current, features: current.features.map((feature, i) => i === index ? { ...feature, ...patch } : feature) }));
  }

  function addFeature() {
    setForm((current) => ({ ...current, features: [...current.features, { name: '', description: '', icon: '', sortOrder: current.features.length }] }));
  }

  function removeFeature(index: number) {
    setForm((current) => ({ ...current, features: current.features.filter((_, i) => i !== index).map((feature, i) => ({ ...feature, sortOrder: i })) }));
  }

  async function saveProduct() {
    if (!form.name.trim() || !form.slug.trim()) {
      setMessage("产品名称和 Slug 不能为空");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "保存失败");

      setMessage(editingId ? "产品更新成功" : "产品创建成功");
      await loadProducts();
      if (!editingId && result.data?.id) setEditingId(result.data.id);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product: Product) {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "状态更新失败");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("状态更新失败");
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`确定删除「${product.name}」吗？删除后不可恢复。`)) return;
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "删除失败");
      if (editingId === product.id) closeDrawer();
      await loadProducts();
      setMessage("产品已删除");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
  }

  if (loading) {
    return <main className="admin-page"><div className="admin-loading">正在加载产品...</div></main>;
  }

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">CMS / PRODUCTS</div>
          <h1>{products.length || 0} 大 AI 超级员工</h1>
          <p>把产品管理从“长表单”改成“列表 + 编辑抽屉”：先找内容，再编辑内容，避免页面越来越长。</p>
        </div>
        <Link href="/admin" className="admin-back">← 返回工作台</Link>
      </div>

      <section className="admin-section-card compact">
        <div className="product-toolbar">
          <div className="product-toolbar-left">
            <input className="product-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索产品名称、Slug、简介..." />
            <select className="product-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">已启用</option>
              <option value="INACTIVE">已停用</option>
            </select>
          </div>
          <button className="admin-primary-button" onClick={newProduct}>＋ 新增产品</button>
        </div>
        <div className="cms-toolbar">
          <div><strong>产品列表</strong><span>共 {filteredProducts.length} / {products.length} 个</span></div>
          {message && <span className={message.includes("失败") ? "admin-error-message" : "admin-save-message"}>{message}</span>}
        </div>

        <div className="product-list">
          {filteredProducts.map((product) => (
            <article className="product-row" key={product.id}>
              <div className="product-icon">
                {isLikelyImageSource(product.icon) ? <img src={product.icon || ""} alt="" /> : <span>{product.icon || "AI"}</span>}
              </div>
              <div className="product-main">
                <strong>{product.name}</strong>
                <span>{product.slug}{product.shortName ? ` · ${product.shortName}` : ""}</span>
              </div>
              <div className="product-desc">{product.description || "暂无产品简介"}</div>
              <div className="product-sort">排序 {product.sortOrder}</div>
              <div className="product-actions">
                <span className={`admin-status ${product.status === "ACTIVE" ? "active" : "status-inactive"}`}>{statusText(product.status)}</span>
                <button onClick={() => editProduct(product)}>编辑</button>
                <button onClick={() => toggleStatus(product)}>{product.status === "ACTIVE" ? "停用" : "启用"}</button>
                <button className="danger" onClick={() => deleteProduct(product)}>删除</button>
              </div>
            </article>
          ))}
          {!filteredProducts.length && <div className="empty">没有找到匹配的产品。可以清空搜索条件，或者点击“新增产品”。</div>}
        </div>
      </section>

      {drawerOpen && (
        <div className="admin-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
          <aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={editingId ? "编辑产品" : "新增产品"}>
            <div className="admin-drawer-head">
              <div>
                <div className="admin-eyebrow">{editingId ? `EDIT / #${editingId}` : "NEW PRODUCT"}</div>
                <h2>{editingId ? "编辑产品" : "新增产品"}</h2>
                <p>保存后前台产品中心、首页及产品详情页会读取最新内容。</p>
              </div>
              <button className="admin-drawer-close" onClick={closeDrawer} aria-label="关闭">×</button>
            </div>

            <div className="cms-form-grid">
              <label><span>产品名称 *</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="例如：AI短视频" /></label>
              <label><span>英文 / 简称</span><input value={form.shortName || ""} onChange={(e) => updateField("shortName", e.target.value)} placeholder="例如：AI Video" /></label>
              <label><span>Slug *</span><input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="ai-video" pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" /><small className="admin-field-note">使用英文、数字和连字符，例如 map-lead。旧的无效地址会在编辑时预填安全地址。</small></label>
              <label><span>排序</span><input type="number" value={form.sortOrder} onChange={(e) => updateField("sortOrder", Number(e.target.value))} /></label>
              <label><span>状态</span><select value={form.status} onChange={(e) => updateField("status", e.target.value)}><option value="ACTIVE">已启用</option><option value="INACTIVE">已停用</option></select></label>
              <AssetPicker label="产品视频" folder="products/video" accept=".mp4,.webm,.mov" type="VIDEO" maxSizeMb={4096} value={form.videoUrl} onChange={(x) => updateField("videoUrl", x.url)} helper="上传后自动进入文件资产中心，也可以复用已有视频。" />
              <label className="full"><span>产品简介</span><input value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="一句话说明这个 AI 员工解决什么问题" /></label>
              <label className="full"><span>详细介绍</span><textarea rows={9} value={form.content || ""} onChange={(e) => updateField("content", e.target.value)} placeholder="支持分段文字。后续可以继续升级为富文本编辑器。" /></label>
              <AssetPicker label="产品图标" folder="products/icon" accept=".png,.jpg,.jpeg,.webp,.svg" type="IMAGE" maxSizeMb={20} value={form.icon} onChange={(x) => updateField("icon", x.url)} helper="建议使用透明 PNG / SVG。" />
              <AssetPicker label="产品封面" folder="products/cover" accept=".png,.jpg,.jpeg,.webp" type="IMAGE" maxSizeMb={50} value={form.coverImage} onChange={(x) => updateField("coverImage", x.url)} helper="推荐 16:9 或官网统一视觉比例。" />
              <div className="product-feature-editor full">
                <div className="product-feature-editor-head"><div><strong>岗位能力</strong><small>这些能力标签会直接出现在首页数字员工卡片与产品详情页。</small></div><button type="button" className="admin-secondary-button" onClick={addFeature}>＋ 添加能力</button></div>
                {!form.features.length && <div className="admin-field-note"><strong>暂无岗位能力</strong><span>至少添加 1–3 个能力名称，前台会自动展示。</span></div>}
                {form.features.map((feature, index) => <div className="product-feature-row" key={feature.id || `new-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <input value={feature.name} onChange={(e) => updateFeature(index, { name: e.target.value })} placeholder="能力名称，如关键词曝光" />
                  <input value={feature.description || ''} onChange={(e) => updateFeature(index, { description: e.target.value })} placeholder="能力说明（可选）" />
                  <button type="button" className="danger" onClick={() => removeFeature(index)}>删除</button>
                </div>)}
              </div>
              <label><span>SEO 标题</span><input value={form.seoTitle || ""} onChange={(e) => updateField("seoTitle", e.target.value)} /></label>
              <label><span>SEO 描述</span><input value={form.seoDescription || ""} onChange={(e) => updateField("seoDescription", e.target.value)} /></label>
            </div>

            {form.coverImage && (
              <div className="admin-preview-box">
                <img src={form.coverImage} alt="封面预览" />
                <div><strong>封面预览</strong><span>{form.coverImage}</span></div>
              </div>
            )}

            <div className="admin-drawer-footer">
              <div>{message && <span className={message.includes("失败") ? "admin-error-message" : "admin-save-message"}>{message}</span>}</div>
              <div className="admin-form-actions" style={{ marginTop: 0 }}>
                <button className="admin-ghost-button" onClick={closeDrawer}>取消</button>
                <button className="admin-primary-button" onClick={saveProduct} disabled={saving}>{saving ? "保存中..." : editingId ? "保存修改" : "创建产品"}</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
