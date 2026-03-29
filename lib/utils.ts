export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function fileExt(name: string) {
  const bit = name.split('.').pop();
  return bit ? bit.toLowerCase() : '';
}

export function slugLabel(value?: string | null) {
  return value?.trim() || 'Untitled';
}
