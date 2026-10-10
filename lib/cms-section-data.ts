/**
 * Return the editable JSON payload for a CMS section.
 * Persisted records use `data`; the live page editor temporarily stores changes
 * in `dataText`. Always prefer persisted data only when dataText is not present,
 * otherwise live edits would be reset on the next React render.
 */
export function readCmsSectionData(section: any): Record<string, any> {
  if (typeof section?.dataText === 'string' && section.dataText.trim()) {
    try {
      const parsed = JSON.parse(section.dataText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // A temporarily incomplete JSON editor value should not throw during render.
    }
  }
  if (section?.data && typeof section.data === 'object' && !Array.isArray(section.data)) {
    return section.data as Record<string, any>;
  }
  return {};
}
