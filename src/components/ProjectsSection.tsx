import { useMemo, useState } from 'react';
import { Calendar, FileArchive, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { CATEGORIES, SITE } from '../config/site';
import { fold, formatBytes, formatDate } from '../lib/format';
import type { LoadStatus, Project } from '../types';
import { ProjectCover } from './ProjectCover';

interface ProjectsSectionProps {
  projects: Project[];
  status: LoadStatus;
  error?: string;
  onRetry: () => void;
  onOpen: (id: string) => void;
}

const OTHERS = 'outros';

interface Group {
  key: string;
  label: string;
  projects: Project[];
}

const categoryKey = (p: Project) => p.category?.key ?? OTHERS;

export function ProjectsSection({ projects, status, error, onRetry, onOpen }: ProjectsSectionProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Projetos que passam pela busca (a categoria é aplicada depois, para os contadores dos filtros).
  const matching = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return projects;
    return projects.filter((p) =>
      fold([p.title, p.description, p.category?.label ?? '', ...p.tags].join(' ')).includes(q)
    );
  }, [projects, query]);

  // Filtros: as categorias conhecidas (sempre), mais as novas que a API enviar, mais "Outros" se houver.
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of matching) counts.set(categoryKey(p), (counts.get(categoryKey(p)) ?? 0) + 1);

    const known = new Set<string>(CATEGORIES.map((c) => c.key));
    const extras = new Map<string, string>();
    for (const p of projects) {
      if (p.category && !known.has(p.category.key)) extras.set(p.category.key, p.category.label);
    }
    const list = [
      ...CATEGORIES.map((c) => ({ key: c.key as string, label: c.plural })),
      ...[...extras].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).map(([key, label]) => ({ key, label })),
    ];
    if (projects.some((p) => !p.category)) list.push({ key: OTHERS, label: 'Outros' });
    return list.map((f) => ({ ...f, count: counts.get(f.key) ?? 0 }));
  }, [projects, matching]);

  // Lista dividida por categoria (na ordem dos filtros).
  const groups = useMemo<Group[]>(() => {
    return filters
      .filter((f) => activeCategory === null || f.key === activeCategory)
      .map((f) => ({
        key: f.key,
        label: f.label,
        projects: matching.filter((p) => categoryKey(p) === f.key),
      }))
      .filter((g) => g.projects.length > 0);
  }, [filters, matching, activeCategory]);

  const hasResults = groups.length > 0;

  return (
    <section id="projetos" className="bg-[#f3f0ea] py-16 sm:py-24 border-b border-black/10 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Cabeçalho + busca */}
        <div className="mb-8 border-b border-black/15 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold tracking-[0.08em] text-black uppercase">
            {SITE.projects.title}
          </h2>

          {status === 'ready' && projects.length > 0 && (
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Buscar projetos</span>
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={SITE.projects.searchPlaceholder}
                className="w-full bg-white/70 border border-black/20 pl-9 pr-3 py-2.5 text-xs text-black placeholder-neutral-500 focus:outline-none focus:border-black"
              />
            </label>
          )}
        </div>

        {/* Filtro por categoria */}
        {status === 'ready' && projects.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {[{ key: null as string | null, label: 'Todos', count: matching.length }, ...filters].map((f) => {
              const active = f.key === activeCategory;
              return (
                <button
                  key={f.key ?? '__all'}
                  onClick={() => setActiveCategory(f.key)}
                  aria-pressed={active}
                  className={`text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase px-3.5 py-2 border transition-colors cursor-pointer ${
                    active
                      ? 'bg-black text-white border-black'
                      : 'bg-transparent text-neutral-700 border-black/25 hover:border-black'
                  } ${!active && f.count === 0 ? 'opacity-50' : ''}`}
                >
                  {f.label} <span className={active ? 'text-neutral-400' : 'text-neutral-500'}>({f.count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Estados */}
        {status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Carregando projetos">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[#0f0f0f] border border-neutral-800 animate-pulse">
                <div className="aspect-[4/3] bg-neutral-900" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-2/3 bg-neutral-800" />
                  <div className="h-3 w-full bg-neutral-900" />
                  <div className="h-3 w-4/5 bg-neutral-900" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="border border-black/20 bg-white/50 p-8 text-center space-y-4" role="alert">
            <TriangleAlert className="w-6 h-6 mx-auto text-neutral-700" />
            <p className="text-sm text-neutral-800">{error ?? 'Não foi possível carregar os projetos.'}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-800 text-[11px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && projects.length === 0 && (
          <p className="text-center text-sm text-neutral-600 py-16">Nenhum projeto exposto por enquanto.</p>
        )}

        {status === 'ready' && projects.length > 0 && !hasResults && (
          <p className="text-center text-sm text-neutral-600 py-16">
            Nenhum projeto encontrado{activeCategory || query ? ' com esses filtros' : ''}.
          </p>
        )}

        {/* Grupos por categoria */}
        {status === 'ready' && hasResults && (
          <div className="space-y-14">
            {groups.map((group) => (
              <div key={group.key} id={`categoria-${group.key}`} className="scroll-mt-24">
                <div className="mb-5 flex items-baseline gap-3">
                  <h3 className="font-oswald text-lg sm:text-xl font-bold tracking-[0.14em] uppercase text-black">
                    {group.label}
                  </h3>
                  <span className="text-xs text-neutral-500 tracking-wider">{group.projects.length}</span>
                  <div className="flex-1 h-px bg-black/15 self-center" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.projects.map((project) => {
                    const date = formatDate(project.updatedAt);
                    const size = formatBytes(project.zipSize);
                    const cover = project.coverUrl ?? project.images[0];
                    return (
                      <article
                        key={project.id}
                        id={`project-card-${project.id}`}
                        className="bg-[#0f0f0f] text-white border border-neutral-800 flex flex-col group hover:border-neutral-600 transition-colors duration-300 shadow-md"
                      >
                        <button
                          onClick={() => onOpen(project.id)}
                          className="relative aspect-[4/3] bg-neutral-950 overflow-hidden border-b border-neutral-800 block cursor-pointer"
                          aria-label={`Abrir ${project.title}`}
                          tabIndex={-1}
                        >
                          <ProjectCover
                            title={project.title}
                            src={cover}
                            className="filter grayscale contrast-125 brightness-90 group-hover:grayscale-0 group-hover:scale-105 group-hover:brightness-100 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/30 pointer-events-none" />
                        </button>

                        <div className="p-5 flex-1 flex flex-col justify-between gap-6">
                          <div className="space-y-3">
                            {project.category && (
                              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-500">
                                {project.category.label}
                              </p>
                            )}
                            <h3 className="font-oswald text-base font-bold tracking-[0.14em] uppercase text-white">
                              {project.title}
                            </h3>
                            {project.description && (
                              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                                {project.description}
                              </p>
                            )}
                            {project.tags.length > 0 && (
                              <ul className="flex flex-wrap gap-1.5">
                                {project.tags.map((tag) => (
                                  <li
                                    key={tag}
                                    className="text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-300 border border-neutral-700 px-2 py-0.5"
                                  >
                                    {tag}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="pt-5 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1 text-[10px] text-neutral-500 tracking-wider">
                              {date && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" /> {date}
                                </span>
                              )}
                              {size && (
                                <span className="inline-flex items-center gap-1.5">
                                  <FileArchive className="w-3 h-3" /> .zip · {size}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => onOpen(project.id)}
                              className="shrink-0 bg-transparent border border-neutral-700 hover:border-white hover:bg-white hover:text-black text-neutral-200 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 cursor-pointer active:scale-95"
                            >
                              {SITE.projects.viewButton}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
