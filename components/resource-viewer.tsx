 'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = { url?: string | null; name?: string | null; mimeType?: string | null; type?: string | null; poster?: string | null; title?: string | null };

function kind(name: string, mime: string, type?: string | null, url = '') {
  const n = name.toLowerCase(); const m = mime.toLowerCase(); const t = String(type || '').toUpperCase(); const source = url.toLowerCase();
  if (m.startsWith('video/') || /\.(mp4|webm|mov|m4v|m3u8)(?:[?#].*)?$/i.test(n) || /\.(mp4|webm|mov|m4v|m3u8)(?:[?#].*)?$/i.test(source) || t === 'VIDEO') return 'VIDEO';
  if (m.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(n) || t === 'AUDIO') return 'AUDIO';
  if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(n) || t === 'IMAGE') return 'IMAGE';
  if (m === 'application/pdf' || /\.pdf$/i.test(n) || t === 'PDF') return 'PDF';
  if (/\.(md|txt|json|ya?ml|js|jsx|ts|tsx|py|sh|bat|html|css|sql|csv)$/i.test(n) || m.startsWith('text/') || t === 'MARKDOWN' || t === 'TEXT') return 'TEXT';
  if (/\.(zip|rar|7z|tar|gz|tgz)$/i.test(n) || t === 'ARCHIVE') return 'ARCHIVE';
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(n) || ['WORD','SPREADSHEET','PRESENTATION'].includes(t)) return 'OFFICE';
  return 'OTHER';
}

export default function ResourceViewer({ url, name, mimeType, type, poster, title }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const fileKind = useMemo(() => kind(name || '', mimeType || '', type, url || ''), [name, mimeType, type, url]);

  useEffect(() => {
    if (!url || fileKind !== 'TEXT') return;
    let cancelled = false;
    setText(null);
    setError('');
    fetch(url)
      .then((response) => response.ok ? response.text() : Promise.reject(new Error('文件读取失败')))
      .then((value) => { if (!cancelled) setText(value); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : '在线阅读失败'); });
    return () => { cancelled = true; };
  }, [url, fileKind]);

  useEffect(() => { setVideoError(false); }, [url]);

  if (!url) return <div className="resource-viewer-empty">暂无可在线查看的文件。</div>;
  if (fileKind === 'VIDEO') {
    return (
      <div className="resource-video-shell">
        <div className="resource-video-head">
          <div><span>AI DIGITAL MEDIA</span><strong>{title || name || '在线视频'}</strong></div>
          <a href={url} target="_blank" rel="noreferrer" className="resource-video-open">新窗口打开 ↗</a>
        </div>
        {!videoError ? (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            poster={poster || undefined}
            className="resource-video"
            onLoadedData={() => setVideoError(false)}
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="resource-video-fallback">
            <div className="resource-video-fallback-icon">▶</div>
            <h3>视频文件已找到，但当前浏览器未能解码</h3>
            <p>优先上传 MP4（H.264 / AAC）。MOV、HEVC 等编码在部分浏览器与设备上不能直接播放；你仍可以新窗口打开或下载原文件。</p>
            <div className="resource-video-actions"><a href={url} target="_blank" rel="noreferrer" className="button button-secondary">新窗口打开</a><a href={url} download className="button button-primary">下载视频</a></div>
          </div>
        )}
        <div className="resource-video-footer"><span>{mimeType || 'VIDEO'}</span><span>支持拖动进度 · 倍速 · 全屏</span></div>
      </div>
    );
  }
  if (fileKind === 'AUDIO') return <div className="resource-audio"><h3>{name || '音频文件'}</h3><audio src={url} controls preload="metadata" />
  </div>;
  if (fileKind === 'IMAGE') return <div className="resource-image-wrap"><img src={url} alt={name || '图片'} style={{ transform: `scale(${zoom})` }} /><div><button onClick={() => setZoom(Math.max(.5, zoom - .1))}>缩小</button><button onClick={() => setZoom(1)}>恢复</button><button onClick={() => setZoom(Math.min(2, zoom + .1))}>放大</button></div></div>;
  if (fileKind === 'PDF') return <iframe src={url} title={name || 'PDF在线预览'} className="resource-pdf" />;
  if (fileKind === 'TEXT') return <div className="resource-text-reader"><div className="resource-reader-toolbar"><span>在线阅读 · {name}</span><a href={url} download>下载原文件</a></div>{error ? <div className="resource-viewer-empty">{error}</div> : text === null ? <div className="resource-viewer-empty">正在加载文件…</div> : <pre>{text}</pre>}</div>;
  if (fileKind === 'ARCHIVE') return <div className="resource-archive"><div className="resource-file-icon">ZIP</div><h3>压缩包 / Skill 资源包</h3><p>压缩包不适合浏览器逐文件解析，当前提供原始文件下载。</p><a href={url} download className="button button-primary">下载资源包</a></div>;
  if (fileKind === 'OFFICE') {
    const absoluteUrl = typeof window !== 'undefined' && /^\//.test(url) ? `${window.location.origin}${url}` : url;
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
    return <div className="resource-office"><div className="resource-reader-toolbar"><span>在线预览 · {name}</span><a href={url} download>下载原文件</a></div><iframe src={viewerUrl} title={name || 'Office 在线预览'} className="resource-office-frame" /></div>;
  }
  return <div className="resource-archive"><div className="resource-file-icon">FILE</div><h3>文件已上传</h3><p>当前文件类型没有浏览器原生预览能力，可以直接打开或下载原文件。</p><div className="resource-video-actions"><a href={url} target="_blank" rel="noreferrer" className="button button-secondary">新窗口打开</a><a href={url} download className="button button-primary">下载文件</a></div></div>;
}
