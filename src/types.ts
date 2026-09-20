export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectVideo {
  url: string;
  poster?: string;
}

export interface ProjectCategory {
  /** identificador estável, ex.: "site-e-aplicativo" */
  key: string;
  /** texto exibido, ex.: "Site e Aplicativo" */
  label: string;
}

export interface ProjectFile {
  path: string;
  /** tamanho em bytes (opcional) */
  size?: number;
}

/**
 * Formato interno de um projeto. O catálogo pode mandar só parte destes campos:
 * apenas `id` e `title` são obrigatórios (veja README.md → "Formato do catálogo").
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: ProjectCategory;
  coverUrl?: string;
  /** até 5 imagens */
  images: string[];
  /** até 2 vídeos */
  videos: ProjectVideo[];
  /** PDF da documentação (aberto dentro do site, sem download) */
  docUrl?: string;
  zipUrl?: string;
  /** tamanho do .zip em bytes */
  zipSize?: number;
  version?: string;
  /** data ISO 8601 */
  updatedAt?: string;
  readme?: string;
  files: ProjectFile[];
  links: ProjectLink[];
}

export type LoadStatus = 'loading' | 'ready' | 'error';
