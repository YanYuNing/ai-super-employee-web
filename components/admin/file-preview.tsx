'use client';

import { useEffect, useState } from 'react';

type Props = { file: any; onClose: () => void };

function kind(file: any) {
  const mime = String(file?.mimeType || '').toLowerCase();
  const name = String(file?.name || file?.originalName || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'IMAGE';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(name)) return 'VIDEO';
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return 'AUDIO';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'PDF';
  if (/\.(md|txt|json|ya?ml|js|jsx|ts|tsx|py|sh|bat|html|css|sql|csv)$/i.test(name) || mime.startsWith('text/')) return 'TEXT';
  if (file?.type === 'ARCHIVE' || /\.(zip|rar|7z|tar|gz|tgz)$/i.test(name)) return 'ARCHIVE';
  return 'OTHER';
}

export default function FilePreview({ file, onClose }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const t = kind(file);

  useEffect(() => {
    if (t !== 'TEXT') return;
    setText(null); setError('');
    fetch(file.url).then(r => r.ok ? r.text() : Promise.reject(new Error('无法读取文本文件'))).then(setText).catch(e => setError(e.message || '文本预览失败'));
  }, [file.url, t]);

  return <div className="file-preview-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="file-preview-modal" role="dialog" aria-modal="true">
      <header className="file-preview-head"><div><div className="admin-eyebrow">资源预览</div><h3>{file.name || file.originalName || '未命名文件'}</h3><p>{file.mimeType || file.type || '文件'}</p></div><button type="button" className="admin-drawer-close" onClick={onClose}>×</button></header>
      <div className="file-preview-body">
        {t === 'IMAGE' && <img src={file.url} alt={file.alt || file.name || ''} className="file-preview-media" />}
        {t === 'VIDEO' && <video src={file.url} controls className="file-preview-media" />}
        {t === 'AUDIO' && <div className="audio-preview-card"><div className="preview-type-badge">音频</div><h3>{file.name}</h3><audio src={file.url} controls /></div>}
        {t === 'PDF' && <iframe src={file.url} title={file.name} className="file-preview-frame" />}
        {t === 'TEXT' && <div className="text-preview"><div className="text-preview-toolbar"><span>在线文本预览</span><a href={file.url} download>下载原文件</a></div>{error ? <div className="preview-notice">{error}</div> : text === null ? <div className="admin-loading">正在读取文件…</div> : <pre>{text}</pre>}</div>}
        {t === 'ARCHIVE' && <div className="archive-preview"><div className="archive-icon">ZIP</div><h3>压缩包资源</h3><p>可以下载原始文件。Skill 压缩包后续可接入目录解析器，在线查看文件结构。</p><a href={file.url} download className="admin-primary-button">下载压缩包</a></div>}
        {t === 'OTHER' && <div className="file-preview-fallback"><div className="file-icon">FILE</div><h3>该文件已纳入资源中心</h3><p>当前浏览器未配置该格式的在线渲染器，可以下载原文件。</p><a className="admin-primary-button" href={file.url} download>下载文件</a></div>}
      </div>
    </section>
  </div>;
}
