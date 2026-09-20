const aboutImage = 'https://res.cloudinary.com/em9a1cj5/image/upload/v1789877361/2.png';

/** Catálogo público gerado pelo site administrativo. */
export const PROJECTS_URL = `${import.meta.env.BASE_URL}projects.json`;

/** Limites de mídia por projeto (o site ignora o que passar disso). */
export const MAX_IMAGES = 5;
export const MAX_VIDEOS = 2;

/**
 * Categorias conhecidas, na ordem em que aparecem no filtro.
 * Categorias novas no catálogo aparecem sozinhas, depois destas.
 */
export const CATEGORIES = [
  { key: 'programa', label: 'Programa', plural: 'Programas' },
  { key: 'site', label: 'Site', plural: 'Sites' },
  { key: 'aplicativo', label: 'Aplicativo', plural: 'Aplicativos' },
  { key: 'site-e-aplicativo', label: 'Site e Aplicativo', plural: 'Site e Aplicativo' },
] as const;

/** Todos os textos fixos do site ficam aqui: edite à vontade. */
export const SITE = {
  name: 'MV COLLECTION',
  banner: 'EXPOSIÇÃO DE PROJETOS',
  hero: {
    videoUrl: 'https://res.cloudinary.com/didxi0uxa/video/upload/v1789873761/banner.mp4',
    motto: ['PROJETOS.', 'IDEIAS.', 'BASTIDORES.'],
    countLabel: 'PROJETOS EXPOSTOS',
  },
  about: {
    eyebrow: 'SOBRE A EXPOSIÇÃO',
    titleLines: ['CRIAR.', 'ARQUIVAR.', 'MOSTRAR.'],
    text:
      'Uma vitrine com os projetos que eu construo. Cada item reúne descrição, imagens e o pacote completo em .zip para visualização.',
    button: 'VER PROJETOS',
    image: aboutImage,
    imageAlt: 'Fotografia em preto e branco da exposição',
    imageCaption: 'ACERVO • MV COLLECTION',
  },
  projects: {
    title: 'PROJETOS',
    searchPlaceholder: 'Buscar por nome, descrição ou tag…',
    viewButton: 'VER PROJETO',
    docButton: 'ACESSE AQUI',
    docCaption: 'Documentação e links de download',
  },
  footer: {
    text: 'Exposição de projetos. Somente visualização.',
    /** Opcional: { label: 'GitHub', url: 'https://github.com/…' } */
    links: [] as { label: string; url: string }[],
  },
} as const;
