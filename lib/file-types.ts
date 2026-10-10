export const FILE_TYPE_LABELS: Record<string, string> = {
  IMAGE: '图片', VIDEO: '视频', AUDIO: '音频', PDF: 'PDF文档', ARCHIVE: '压缩包',
  WORD: 'Word文档', SPREADSHEET: 'Excel/表格', PRESENTATION: 'PowerPoint演示文稿',
  MARKDOWN: 'Markdown文档', TEXT: '文本/代码文件', FILE: '其他文件', DOCUMENT: '文档'
};

export function detectFileType(name: string, mime = '') {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'IMAGE';
  if (m.startsWith('video/')) return 'VIDEO';
  if (m.startsWith('audio/')) return 'AUDIO';
  if (m === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (['zip','rar','7z','tar','gz','tgz'].includes(ext) || m.includes('zip') || m.includes('compressed')) return 'ARCHIVE';
  if (['doc','docx'].includes(ext) || m.includes('word')) return 'WORD';
  if (['xls','xlsx','csv'].includes(ext) || m.includes('excel') || m.includes('spreadsheet')) return 'SPREADSHEET';
  if (['ppt','pptx'].includes(ext) || m.includes('presentation')) return 'PRESENTATION';
  if (ext === 'md' || m.includes('markdown')) return 'MARKDOWN';
  if (m.startsWith('text/') || ['txt','json','yaml','yml','js','jsx','ts','tsx','py','sh','bat','html','css','sql'].includes(ext)) return 'TEXT';
  return 'FILE';
}

export function fileTypeLabel(type?: string | null) { return type ? (FILE_TYPE_LABELS[type] || type) : '未知文件'; }
