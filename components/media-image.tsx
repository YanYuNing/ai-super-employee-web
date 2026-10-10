"use client";
import { useState } from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  mode?: 'contain' | 'cover';
  sizes?: string;
};

function looksLikeImage(value?: string | null) {
  if (!value) return false;
  const src = String(value);
  if (/^data:image\//i.test(src)) return true;
  if (!/^https?:\/\//i.test(src) && !src.startsWith('/')) return false;
  return /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(src) || src.includes('/uploads/') || src.includes('/api/public/assets/');
}

export default function MediaImage({ src, alt = '', fallback = 'AI', className = '', mode = 'contain', sizes = '100vw' }: Props) {
  const [failed, setFailed] = useState(false);
  const usable = looksLikeImage(src) && !failed;
  if (!usable) return <span className={`media-image-fallback ${className}`}>{fallback}</span>;
  return <img src={String(src)} alt={alt} sizes={sizes} loading="lazy" className={`media-image ${mode} ${className}`} onError={() => setFailed(true)} />;
}
