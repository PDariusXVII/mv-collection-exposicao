import { PROJECTS_URL } from '../config/site';
import type { ProjectVideo } from '../types';

export function isExternalUrl(value?: string): boolean {
  return /^https?:\/\//i.test(value?.trim() ?? '');
}

/**
 * Mantém URLs http(s) externas intactas e resolve caminhos locais a partir
 * do projects.json, incluindo deploys do Vite/GitHub Pages em subpastas.
 */
export function resolveMediaUrl(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (isExternalUrl(normalized)) return normalized;
  try {
    const catalogBase = new URL(PROJECTS_URL, window.location.href);
    return new URL(normalized, catalogBase).href;
  } catch {
    return undefined;
  }
}

export function getYouTubeId(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0];
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v') ?? undefined;
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1];
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function getYouTubeEmbedUrl(value?: string): string | undefined {
  const id = getYouTubeId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : undefined;
}

export function isDirectVideoUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const path = new URL(value, window.location.href).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)$/.test(path);
  } catch {
    return /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(value);
  }
}

export function videoKind(video: ProjectVideo): 'youtube' | 'direct' | 'unknown' {
  if (getYouTubeId(video.url)) return 'youtube';
  if (isDirectVideoUrl(video.url)) return 'direct';
  return 'unknown';
}
