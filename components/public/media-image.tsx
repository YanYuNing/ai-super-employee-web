'use client';

import { useState, type ReactNode } from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

export default function MediaImage({ src, alt = '', className = '', fallback = null }: Props) {
  const [failed, setFailed] = useState(false);
  const value = String(src || '').trim();

  if (!value || failed) return <>{fallback}</>;

  return (
    <img
      src={value}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
