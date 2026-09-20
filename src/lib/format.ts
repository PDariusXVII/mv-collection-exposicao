export function formatBytes(bytes?: number): string | undefined {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${i === 0 ? value : value.toFixed(1).replace('.', ',')} ${units[i]}`;
}

export function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** minúsculas e sem acentos, para busca tolerante */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
}
