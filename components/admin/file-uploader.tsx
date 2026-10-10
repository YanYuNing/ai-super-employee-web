'use client';

import { useRef, useState } from 'react';
import { uploadAsset } from '@/lib/client-upload';
import { detectFileType, fileTypeLabel } from '@/lib/file-types';

export type UploadedResult = {
  file: File;
  url: string;
  key?: string;
  storageProvider?: string;
  assetId?: number;
  assetType?: string;
  mimeType?: string;
  fileSize?: number;
};

type Props = {
  folder?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  type?: string | string[];
  onUploaded: (result: UploadedResult) => void;
};

const labels: Record<string, string> = {
  IMAGE: '图片', VIDEO: '视频', AUDIO: '音频', PDF: 'PDF', ARCHIVE: '压缩包',
  WORD: 'Word', SPREADSHEET: '表格', PRESENTATION: '演示文稿', MARKDOWN: 'Markdown', TEXT: '文本/代码', FILE: '文件', DOCUMENT: '文档'
};

function sizeText(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function normalizeTypes(value?: string | string[]) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(String).map(x => x.toUpperCase());
}

export default function FileUploader({ folder = 'assets', accept, multiple = false, maxSizeMb = 2048, type, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Array<{ file: File; status: 'uploading' | 'success' | 'error'; progress: number; message?: string }>>([]);
  const allowedTypes = normalizeTypes(type);
  const allowedLabel = allowedTypes.length ? allowedTypes.map(fileTypeLabel).join(' / ') : '';

  async function upload(file: File) {
    const max = maxSizeMb * 1024 * 1024;
    if (file.size > max) {
      setItems(prev => [...prev, { file, status: 'error', progress: 0, message: `文件超过当前组件限制 ${maxSizeMb}MB` }]);
      return;
    }

    const detected = detectFileType(file.name, file.type).toUpperCase();
    if (allowedTypes.length && !allowedTypes.includes(detected)) {
      setItems(prev => [...prev, { file, status: 'error', progress: 0, message: `当前字段只允许：${allowedLabel}，检测到的是 ${fileTypeLabel(detected)}。` }]);
      return;
    }

    setItems(prev => [...prev, { file, status: 'uploading', progress: 0 }]);
    try {
      const result = await uploadAsset(file, folder, detected, (progress) => {
        setItems(prev => prev.map(x => x.file === file ? { ...x, progress } : x));
      });
      setItems(prev => prev.map(x => x.file === file ? { ...x, status: 'success', progress: 100 } : x));
      onUploaded({ file, url: result.url, key: result.key, storageProvider: result.storageProvider, assetId: result.assetId, assetType: result.assetType || detected, mimeType: file.type, fileSize: file.size });
    } catch (e) {
      const message = e instanceof Error ? e.message : '上传失败，请重试。';
      setItems(prev => prev.map(x => x.file === file ? { ...x, status: 'error', message } : x));
    }
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!multiple) files.splice(1);
    if (!files.length) return;
    setBusy(true);
    try { for (const file of files) await upload(file); } finally { setBusy(false); }
  }

  return <div className="file-uploader">
    <div className={`file-dropzone${dragging ? ' is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()}>
      <div className="upload-cloud-icon">↑</div>
      <strong>{busy ? '正在上传文件…' : '拖拽文件到这里，或点击选择文件'}</strong>
      <span>{allowedLabel ? `仅支持 ${allowedLabel} · ` : ''}支持批量上传 · 单个文件最大 {maxSizeMb} MB · 上传完成后进入文件素材库（不会自动创建资源中心内容条目）</span>
      <button type="button" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>选择文件</button>
      <input ref={inputRef} hidden type="file" accept={accept} multiple={multiple} onChange={e => { if (e.target.files) void handleFiles(e.target.files); e.currentTarget.value = ''; }} />
    </div>
    {items.map((item, index) => <div className="upload-item" key={`${item.file.name}-${item.file.lastModified}-${index}`}>
      <div className="upload-file-icon">{labels[detectFileType(item.file.name, item.file.type)] || '文件'}</div>
      <div className="upload-file-main"><strong>{item.file.name}</strong><small>{sizeText(item.file.size)}</small><div className="upload-progress"><i style={{ width: `${item.progress}%` }} /></div>{item.message && <em>{item.message}</em>}</div>
      <div className={`upload-status ${item.status}`}>{item.status === 'uploading' ? `${item.progress}%` : item.status === 'success' ? '上传成功' : '上传失败'}</div>
    </div>)}
  </div>;
}
