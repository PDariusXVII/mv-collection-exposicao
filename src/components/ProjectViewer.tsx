import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Calendar, Download, ExternalLink, FileArchive, Play, Tag, X } from 'lucide-react';
import { MAX_IMAGES, MAX_VIDEOS, SITE } from '../config/site';
import { fetchProject } from '../lib/api';
import { formatBytes, formatDate } from '../lib/format';
import type { LoadStatus, Project } from '../types';
import { ProjectCover } from './ProjectCover';
import { DocumentReader } from './DocumentReader';

interface ProjectViewerProps {
  projectId: string;
  /** item já carregado na lista (aparece na hora, enquanto o detalhe chega) */
  listItem?: Project;
  listStatus: LoadStatus;
  /** documentação aberta por cima do projeto */
  docOpen: boolean;
  onOpenDoc: () => void;
  onCloseDoc: () => void;
  onClose: () => void;
}

type Media = { kind: 'image'; url: string } | { kind: 'video'; url: string; poster?: string };

/** Junta lista + detalhe: o detalhe vence, exceto quando vem vazio. */
function merge(base: Project | undefined, extra: Project | null): Project | undefined {
  if (!base) return extra ?? undefined;
  if (!extra) return base;
  const filled = Object.fromEntries(
    Object.entries(extra).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
  );
  return { ...base, ...filled } as Project;
}

export function ProjectViewer({ projectId, listItem, listStatus, docOpen, onOpenDoc, onCloseDoc, onClose }: ProjectViewerProps) {
  const [detail, setDetail] = useState<Project | null>(null);
  const [detailStatus, setDetailStatus] = useState<LoadStatus>('loading');
  const [activeImage, setActiveImage] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Busca o detalhe (readme, arquivos, mais imagens) sem bloquear a exibição do que já temos.
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setDetailStatus('loading');
    fetchProject(projectId, controller.signal)
      .then((p) => {
        setDetail(p);
        setDetailStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailStatus('error');
      });
    return () => controller.abort();
  }, [projectId]);

  // Trava o scroll do fundo e devolve o foco ao fechar.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Esc fecha o projeto; com a documentação aberta, quem responde ao Esc é o leitor.
  useEffect(() => {
    if (docOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, docOpen]);

  const project = merge(listItem, detail);
  // Até 5 imagens + 2 vídeos. Sem imagens, a capa vira a única imagem.
  const media = useMemo<Media[]>(() => {
    if (!project) return [];
    const imgs = project.images.length ? project.images : project.coverUrl ? [project.coverUrl] : [];
    return [
      ...imgs.slice(0, MAX_IMAGES).map((url): Media => ({ kind: 'image', url })),
      ...project.videos.slice(0, MAX_VIDEOS).map((v): Media => ({ kind: 'video', url: v.url, poster: v.poster })),
    ];
  }, [project]);
  const current = media[Math.min(activeImage, media.length - 1)];

  const stillLoading = !project && (listStatus === 'loading' || detailStatus === 'loading');
  const notFound = !project && !stillLoading;

  const date = formatDate(project?.updatedAt);
  const size = formatBytes(project?.zipSize);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={project?.title ?? 'Projeto'}
        className="bg-[#0f0f0f] text-white border border-neutral-800 w-full max-w-5xl max-h-screen sm:max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-3 bg-neutral-950 border-b border-neutral-800">
          <h2 className="font-oswald text-sm sm:text-base font-bold tracking-[0.16em] uppercase truncate">
            {project?.title ?? (notFound ? 'Projeto não encontrado' : 'Carregando…')}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {stillLoading && <p className="p-10 text-center text-sm text-neutral-400">Carregando projeto…</p>}

        {notFound && (
          <div className="p-10 text-center space-y-4">
            <p className="text-sm text-neutral-400">Não encontramos esse projeto. Ele pode ter sido removido.</p>
            <button
              onClick={onClose}
              className="bg-white text-black hover:bg-neutral-200 font-bold uppercase text-[11px] tracking-widest px-4 py-2 cursor-pointer"
            >
              Voltar aos projetos
            </button>
          </div>
        )}

        {project && (
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Galeria: até 5 imagens e 2 vídeos */}
            <div className="lg:col-span-3 bg-black">
              <div className="aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden">
                {current?.kind === 'image' && (
                  <img
                    key={current.url}
                    src={current.url}
                    alt={`${project.title} — imagem ${activeImage + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}
                {current?.kind === 'video' && (
                  <video
                    key={current.url}
                    src={current.url}
                    poster={current.poster}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain bg-black"
                  />
                )}
                {!current && <ProjectCover title={project.title} />}
              </div>

              {media.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto border-t border-neutral-900">
                  {media.map((item, i) => (
                    <button
                      key={item.url}
                      onClick={() => setActiveImage(i)}
                      aria-label={item.kind === 'video' ? `Ver vídeo ${i + 1 - media.filter((m) => m.kind === 'image').length}` : `Ver imagem ${i + 1}`}
                      aria-current={i === activeImage}
                      className={`relative shrink-0 w-20 aspect-[4/3] border overflow-hidden cursor-pointer transition-opacity bg-neutral-900 ${
                        i === activeImage ? 'border-white' : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {item.kind === 'image' ? (
                        <img src={item.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          {item.poster && (
                            <img src={item.poster} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {project.docUrl && (
                <div className="p-3 border-t border-neutral-900 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    onClick={onOpenDoc}
                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-[0.22em] uppercase px-4 py-2.5 transition-colors cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {SITE.projects.docButton}
                  </button>
                  <span className="text-[10px] tracking-[0.16em] uppercase text-neutral-500">{SITE.projects.docCaption}</span>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="lg:col-span-2 p-5 sm:p-6 space-y-6">
              {project.description && (
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{project.description}</p>
              )}

              {project.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-300 border border-neutral-700 px-2 py-0.5"
                    >
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </li>
                  ))}
                </ul>
              )}

              {(project.version || date || size) && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-y border-neutral-800 py-4">
                  {project.version && (
                    <div>
                      <dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">Versão</dt>
                      <dd className="mt-0.5 text-neutral-200">{project.version}</dd>
                    </div>
                  )}
                  {date && (
                    <div>
                      <dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">Atualizado</dt>
                      <dd className="mt-0.5 text-neutral-200 inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {date}
                      </dd>
                    </div>
                  )}
                  {size && (
                    <div>
                      <dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">Pacote .zip</dt>
                      <dd className="mt-0.5 text-neutral-200 inline-flex items-center gap-1.5">
                        <FileArchive className="w-3 h-3" /> {size}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {(project.zipUrl || project.links.length > 0) && (
                <div className="flex flex-wrap gap-3">
                  {project.zipUrl && (
                    <a
                      href={project.zipUrl}
                      download
                      rel="noopener"
                      className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .zip
                    </a>
                  )}
                  {project.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-neutral-600 hover:border-white text-neutral-200 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Conteúdo do projeto: arquivos e README (vêm do detalhe da API) */}
            {(project.files.length > 0 || project.readme) && (
              <div className="lg:col-span-5 border-t border-neutral-800 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {project.files.length > 0 && (
                  <section>
                    <h3 className="font-oswald text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">
                      Arquivos ({project.files.length})
                    </h3>
                    <ul className="max-h-64 overflow-y-auto border border-neutral-800 divide-y divide-neutral-900 font-mono text-[11px]">
                      {project.files.map((file) => (
                        <li key={file.path} className="flex items-center justify-between gap-4 px-3 py-1.5 text-neutral-300">
                          <span className="truncate">{file.path}</span>
                          {file.size != null && (
                            <span className="shrink-0 text-neutral-500">{formatBytes(file.size)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {project.readme && (
                  <section className={project.files.length === 0 ? 'md:col-span-2' : ''}>
                    <h3 className="font-oswald text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">
                      README
                    </h3>
                    <pre className="max-h-64 overflow-auto border border-neutral-800 p-3 font-mono text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap break-words">
                      {project.readme}
                    </pre>
                  </section>
                )}
              </div>
            )}

            {detailStatus === 'loading' && (
              <p className="lg:col-span-5 px-6 pb-5 text-[11px] tracking-wider text-neutral-500">Carregando detalhes…</p>
            )}
          </div>
        )}
      </div>

      {docOpen && project?.docUrl && (
        <DocumentReader projectTitle={project.title} docUrl={project.docUrl} onClose={onCloseDoc} />
      )}
    </div>
  );
}
