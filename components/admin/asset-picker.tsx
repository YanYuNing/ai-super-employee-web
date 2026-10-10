'use client';

import { useEffect, useMemo, useState } from 'react';
import FilePreview from '@/components/admin/file-preview';
import FileUploader from '@/components/admin/file-uploader';

type Asset = {
  id: number;
  name: string;
  originalName?: string | null;
  url: string;
  type?: string | null;
  mimeType?: string | null;
  fileSize?: string | number | null;
  storageProvider?: string | null;
  extension?: string | null;
  folder?: string | null;
};

type Props = {
  value?: string | null;
  assetId?: number | null;
  onChange: (value: { url: string; assetId?: number; fileName?: string; fileType?: string }) => void;
  label?: string;
  folder?: string;
  accept?: string;
  type?: string | string[];
  maxSizeMb?: number;
  placeholder?: string;
  helper?: string;
};

function sizeText(value?: string | number | null) {
  const n = Number(value || 0);
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function kind(asset: Asset | null) {
  if (!asset) return 'file';
  if (String(asset.mimeType || '').startsWith('image/')) return 'image';
  if (String(asset.mimeType || '').startsWith('video/')) return 'video';
  if (String(asset.mimeType || '').startsWith('audio/')) return 'audio';
  if (asset.type === 'ARCHIVE') return 'archive';
  return 'document';
}

export default function AssetPicker({
  value,
  assetId,
  onChange,
  label = '资源文件',
  folder = 'assets',
  accept,
  type,
  maxSizeMb = 2048,
  placeholder = '选择文件或上传新文件',
  helper,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Asset | null>(null);

  const selected = useMemo(() => {
    if (assetId) return items.find((x) => x.id === assetId) || null;
    return items.find((x) => x.url === value) || null;
  }, [assetId, items, value]);

  async function loadAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (typeof type === 'string' && type) params.set('type', type);
      const result = await (await fetch(`/api/admin/files?${params.toString()}`, { cache: 'no-store' })).json();
      if (result.success) setItems(result.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  function select(asset: Asset) {
    onChange({ url: asset.url, assetId: asset.id, fileName: asset.originalName || asset.name, fileType: asset.mimeType || asset.type || '' });
    setOpen(false);
  }

  return (
    <div className="asset-picker-field">
      <div className="asset-picker-label"><span>{label}</span>{helper && <small>{helper}</small>}</div>
      <div className={`asset-picker-box${selected || value ? ' has-value' : ''}`}>
        {(selected || value) ? (
          <div className="asset-picker-selected">
            <div className={`asset-picker-thumb type-${kind(selected)}`}>
              {selected && kind(selected) === 'image' ? <img src={selected.url} alt="" /> : <span>{selected?.extension?.toUpperCase() || (kind(selected) === 'archive' ? 'ZIP' : 'FILE')}</span>}
            </div>
            <div className="asset-picker-info">
              <strong title={selected?.name || value || ''}>{selected?.name || value}</strong>
              <span>{selected ? `${selected.storageProvider || 'LOCAL'} · ${sizeText(selected.fileSize)}` : '已配置资源地址'}</span>
            </div>
            <div className="asset-picker-actions">
              {selected && <button type="button" onClick={() => setPreview(selected)}>预览</button>}
              <button type="button" onClick={() => setOpen(true)}>更换</button>
              <button type="button" className="danger" onClick={() => onChange({ url: '', assetId: undefined })}>清除</button>
            </div>
          </div>
        ) : (
          <div className="asset-picker-empty"><div><strong>{placeholder}</strong><span>统一资源中心 · 上传后可复用</span></div><button type="button" className="admin-secondary-button" onClick={() => setOpen(true)}>选择资源</button></div>
        )}
      </div>

      {open && <div className="asset-picker-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <section className="asset-picker-modal" role="dialog" aria-modal="true">
          <header className="asset-picker-modal-head">
            <div><div className="admin-eyebrow">ASSET LIBRARY</div><h3>选择资源</h3><p>可以从已有文件中选择，也可以直接上传；上传完成后自动选中。</p></div>
            <button type="button" className="admin-drawer-close" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="asset-picker-modal-toolbar">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void loadAssets(); }} placeholder="搜索文件名、类型..." />
            <button type="button" onClick={() => void loadAssets()}>搜索</button>
            <button type="button" className="admin-ghost-button" onClick={() => setQuery('')}>清空</button>
          </div>
          <div className="asset-picker-upload-inline">
            <FileUploader folder={folder} accept={accept} type={type} multiple={false} maxSizeMb={maxSizeMb} onUploaded={(result) => { const uploaded: Asset = { id: result.assetId || 0, name: result.file.name, originalName: result.file.name, url: result.url, type: result.assetType, mimeType: result.file.type, fileSize: result.file.size, storageProvider: result.storageProvider, extension: result.file.name.includes('.') ? result.file.name.split('.').pop() : '' }; if (uploaded.id) { setItems((prev) => [uploaded, ...prev.filter((x) => x.id !== uploaded.id)]); select(uploaded); } else { onChange({ url: result.url, fileName: result.file.name, fileType: result.file.type }); setOpen(false); } }} />
            </div>
          <div className="asset-picker-divider"><span>或从已有资源中选择</span></div>
          <div className="asset-picker-grid">
            {loading ? <div className="admin-loading">正在加载资源...</div> : items.map((asset) => <button type="button" className={`asset-picker-card${asset.id === assetId || asset.url === value ? ' is-selected' : ''}`} key={asset.id} onClick={() => select(asset)}>
              <div className={`asset-picker-card-preview type-${kind(asset)}`}>{kind(asset) === 'image' ? <img src={asset.url} alt="" /> : <span>{asset.extension?.toUpperCase() || (asset.type || 'FILE').slice(0, 4)}</span>}</div>
              <div><strong title={asset.name}>{asset.name}</strong><span>{asset.mimeType || asset.type || '文件'} · {sizeText(asset.fileSize)}</span></div>
            </button>)}
            {!loading && !items.length && <div className="asset-picker-no-results">没有找到可选资源。</div>}
          </div>
        </section>
      </div>}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
