"use client";

import { useState } from "react";

function normalizeSource(source: string) {
  const value = String(source || "").trim();
  if (!value) return "";
  if (/^public\/uploads\//i.test(value)) return `/${value.replace(/^public\//i, "")}`;
  if (/^uploads\//i.test(value)) return `/${value}`;
  return value;
}

function looksLikeImageSource(source: string) {
  const value = normalizeSource(source);
  return /^(https?:\/\/|\/|data:image\/|blob:)/i.test(value) || /\.(png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(value);
}

type SafeAssetProps = {
  value?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  mode?: "icon" | "image";
};

export default function SafeAsset({
  value,
  alt = "",
  fallback = "AI",
  className,
  imageClassName,
  placeholderClassName,
  mode = "icon",
}: SafeAssetProps) {
  const source = normalizeSource(value || "");
  const [failed, setFailed] = useState(false);
  const isImage = Boolean(source && looksLikeImageSource(source));

  if (isImage && !failed) {
    return (
      <span className={className} aria-label={alt}>
        <img
          src={source}
          alt={alt}
          className={imageClassName}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  if (mode === "image") {
    return (
      <span className={`${className || ""} safe-asset-placeholder ${placeholderClassName || ""}`} aria-label={alt}>
        <span>{fallback}</span>
      </span>
    );
  }

  return (
    <span className={`${className || ""} safe-asset-text ${placeholderClassName || ""}`} aria-label={alt}>
      {source && !isImage ? source : fallback}
    </span>
  );
}
