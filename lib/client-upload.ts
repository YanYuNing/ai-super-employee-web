import { detectFileType } from '@/lib/file-types';

export type UploadProgressHandler = (progress: number) => void;

function xhrRequest(options: { url: string; method: string; body?: XMLHttpRequestBodyInit | Document | null; headers?: Record<string, string>; onProgress?: UploadProgressHandler }) {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method, options.url);
    Object.entries(options.headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) options.onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error('网络连接失败，请检查服务器、OSS 配置或重新上传。'));
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText || '' });
    xhr.send(options.body);
  });
}

async function parseJsonResponse(result: { status: number; text: string }) {
  let json: any = {};
  try { json = JSON.parse(result.text || '{}'); } catch { throw new Error('服务器返回了无法识别的上传结果。'); }
  if (result.status < 200 || result.status >= 300 || !json.success) throw new Error(json.message || `上传失败（${result.status}）`);
  return json;
}

export async function uploadAsset(file: File, folder: string, type?: string, onProgress?: UploadProgressHandler) {
  const assetType = type || detectFileType(file.name, file.type);
  const signResponse = await fetch('/api/admin/storage/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, folder, size: file.size, mimeType: file.type, assetType }),
  });
  const sign = await signResponse.json();
  if (!sign.success) throw new Error(sign.message || '无法生成上传地址');

  if (sign.provider === 'OSS') {
    const put = await xhrRequest({
      url: sign.url,
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      onProgress,
    });
    if (put.status < 200 || put.status >= 300) throw new Error(`OSS 上传失败：HTTP ${put.status}`);

    const assetResponse = await fetch('/api/admin/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        originalName: file.name,
        url: sign.publicUrl,
        storageProvider: 'OSS',
        storageKey: sign.key,
        type: sign.assetType || assetType,
        mimeType: file.type,
        fileSize: file.size,
        folder: sign.folder || folder,
        extension: file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : null,
      }),
    });
    const asset = await assetResponse.json();
    if (!asset.success) throw new Error(asset.message || '文件已上传，但资源记录创建失败');
    onProgress?.(100);
    return { url: sign.publicUrl, key: sign.key, storageProvider: 'OSS', assetType: sign.assetType || assetType, assetId: asset.data.id, asset: asset.data, mimeType: file.type, fileSize: file.size };
  }

  if (sign.provider === 'SUPABASE') {
    const put = await xhrRequest({
      url: sign.url,
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
      onProgress,
    });
    if (put.status < 200 || put.status >= 300) {
      throw new Error(`Supabase Storage 上传失败：HTTP ${put.status}${put.text ? ` - ${put.text.slice(0, 160)}` : ''}`);
    }
    const assetResponse = await fetch('/api/admin/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        originalName: file.name,
        url: sign.publicUrl,
        storageProvider: 'SUPABASE',
        storageKey: sign.key,
        type: sign.assetType || assetType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        folder: sign.folder || folder,
        extension: file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : null,
        isPublic: true,
      }),
    });
    const asset = await assetResponse.json();
    if (!assetResponse.ok || !asset.success) throw new Error(asset.message || '文件已上传，但资源记录创建失败');
    onProgress?.(100);
    return { url: `/api/public/assets/${asset.data.id}`, key: sign.key, storageProvider: 'SUPABASE', assetType: sign.assetType || assetType, assetId: asset.data.id, asset: asset.data, mimeType: file.type, fileSize: file.size };
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const uploadResponse = await xhrRequest({ url: '/api/upload', method: 'POST', body: fd, onProgress });
  const uploaded = await parseJsonResponse(uploadResponse);
  onProgress?.(100);
  return { url: uploaded.url, key: uploaded.key, storageProvider: uploaded.storageProvider || 'LOCAL', assetType: uploaded.assetType || assetType, assetId: uploaded.assetId, asset: uploaded.asset, mimeType: file.type, fileSize: file.size };
}
