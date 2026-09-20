import { CATEGORIES, MAX_IMAGES, MAX_VIDEOS, PROJECTS_URL } from '../config/site';
import type { Project, ProjectCategory, ProjectFile, ProjectLink, ProjectVideo } from '../types';
import { fold } from './format';

type Raw = Record<string, unknown>;

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

/** primeira chave existente (aceita camelCase e snake_case) */
const pick = (raw: Raw, ...keys: string[]): unknown => {
  for (const k of keys) if (raw[k] != null) return raw[k];
  return undefined;
};

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : typeof v === 'number' ? String(v) : undefined;

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** Resolve arquivos relativos a partir da URL do catálogo, inclusive em subpastas do GitHub Pages. */
function resolveUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    return new URL(u, PROJECTS_URL).href;
  } catch {
    return undefined;
  }
}

const CATEGORY_ALIASES: Record<string, string> = {
  programas: 'programa',
  program: 'programa',
  software: 'programa',
  sites: 'site',
  website: 'site',
  web: 'site',
  aplicativos: 'aplicativo',
  app: 'aplicativo',
  apps: 'aplicativo',
  'site-aplicativo': 'site-e-aplicativo',
  'sites-e-aplicativos': 'site-e-aplicativo',
  'site-e-app': 'site-e-aplicativo',
  'site-app': 'site-e-aplicativo',
  ambos: 'site-e-aplicativo',
};

const slug = (text: string) => fold(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Aceita "Site e Aplicativo", "site_e_aplicativo", ["site","aplicativo"], etc. */
export function normalizeCategory(v: unknown): ProjectCategory | undefined {
  let raw = str(v);
  if (Array.isArray(v)) {
    const keys = v.map((i) => CATEGORY_ALIASES[slug(String(i))] ?? slug(String(i)));
    raw = keys.includes('site') && keys.includes('aplicativo') ? 'site-e-aplicativo' : str(v[0]);
  }
  if (!raw) return undefined;
  const s = slug(raw);
  if (!s) return undefined;
  const key = CATEGORY_ALIASES[s] ?? s;
  const known = CATEGORIES.find((c) => c.key === key);
  return { key, label: known?.label ?? raw };
}

function normalizeVideos(v: unknown): ProjectVideo[] {
  if (!Array.isArray(v)) return [];
  const out: ProjectVideo[] = [];
  for (const item of v) {
    if (typeof item === 'string') {
      const url = resolveUrl(str(item));
      if (url) out.push({ url });
    } else if (isObj(item)) {
      const url = resolveUrl(str(pick(item, 'url', 'src')));
      if (url) out.push({ url, poster: resolveUrl(str(pick(item, 'poster', 'posterUrl', 'poster_url', 'thumbnail'))) });
    }
  }
  return out.slice(0, MAX_VIDEOS);
}

function normalizeFiles(v: unknown): ProjectFile[] {
  if (!Array.isArray(v)) return [];
  const out: ProjectFile[] = [];
  for (const item of v) {
    if (typeof item === 'string') out.push({ path: item });
    else if (isObj(item)) {
      const path = str(pick(item, 'path', 'name'));
      if (path) out.push({ path, size: num(item.size) });
    }
  }
  return out;
}

function normalizeLinks(v: unknown): ProjectLink[] {
  if (!Array.isArray(v)) return [];
  const out: ProjectLink[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;
    const url = resolveUrl(str(item.url));
    if (url) out.push({ label: str(item.label) ?? url, url });
  }
  return out;
}

export function normalizeProject(raw: unknown): Project | null {
  if (!isObj(raw)) return null;
  const id = str(pick(raw, 'id', 'slug'));
  const title = str(pick(raw, 'title', 'name'));
  if (!id || !title) {
    console.warn('[api] projeto ignorado (faltam "id" ou "title"):', raw);
    return null;
  }
  const images = Array.isArray(raw.images)
    ? raw.images
        .map((i) => resolveUrl(str(isObj(i) ? pick(i, 'url', 'src') : i)))
        .filter((i): i is string => Boolean(i))
        .slice(0, MAX_IMAGES)
    : [];
  return {
    id,
    title,
    description: str(pick(raw, 'description', 'summary')) ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags.map(str).filter((t): t is string => Boolean(t)) : [],
    category: normalizeCategory(raw.category ?? raw.type),
    coverUrl: resolveUrl(str(pick(raw, 'coverUrl', 'cover_url', 'cover'))),
    images,
    videos: normalizeVideos(raw.videos),
    docUrl: resolveUrl(str(pick(raw, 'docUrl', 'doc_url', 'documentationUrl', 'documentation_url', 'pdfUrl', 'pdf_url'))),
    zipUrl: resolveUrl(str(pick(raw, 'zipUrl', 'zip_url', 'downloadUrl', 'download_url'))),
    zipSize: num(pick(raw, 'zipSize', 'zip_size', 'size')),
    version: str(raw.version),
    updatedAt: str(pick(raw, 'updatedAt', 'updated_at')),
    readme: typeof raw.readme === 'string' && raw.readme.trim() ? raw.readme : undefined,
    files: normalizeFiles(raw.files),
    links: normalizeLinks(raw.links),
  };
}

async function getJson(signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(PROJECTS_URL, { headers: { Accept: 'application/json' }, signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Não foi possível carregar o catálogo de projetos.');
  }
  if (!res.ok) throw new ApiError(`O catálogo respondeu com erro (HTTP ${res.status}).`, res.status);
  try {
    return await res.json();
  } catch {
    throw new ApiError('A API não devolveu um JSON válido.');
  }
}

/** Lê o catálogo estático (array puro ou { projects | data | items }). */
export async function fetchProjects(signal?: AbortSignal): Promise<Project[]> {
  const data = await getJson(signal);
  const list = Array.isArray(data)
    ? data
    : isObj(data)
      ? (pick(data, 'projects', 'data', 'items') as unknown)
      : undefined;
  if (!Array.isArray(list)) throw new ApiError('Formato inesperado: esperava uma lista de projetos.');
  const projects: Project[] = [];
  const ids = new Set<string>();
  for (const item of list) {
    const project = normalizeProject(item);
    if (!project || ids.has(project.id)) continue;
    ids.add(project.id);
    projects.push(project);
  }
  return projects;
}

/** Localiza os detalhes do projeto dentro do mesmo catálogo estático. */
export async function fetchProject(id: string, signal?: AbortSignal): Promise<Project> {
  const projects = await fetchProjects(signal);
  const project = projects.find((item) => item.id === id);
  if (!project) throw new ApiError('Projeto não encontrado.', 404);
  return project;
}
