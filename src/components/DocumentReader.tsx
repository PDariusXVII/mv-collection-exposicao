import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { loadDocument } from '../lib/pdfDocument';
import type { DocBlock, DocRun } from '../lib/pdfBlocks';
import type { LoadStatus } from '../types';

interface DocumentReaderProps {
  projectTitle: string;
  docUrl: string;
  onClose: () => void;
}

function Runs({ runs }: { runs: DocRun[] }) {
  return (
    <>
      {runs.map((run, i) =>
        run.url ? (
          <a
            key={i}
            href={run.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-black/40 underline-offset-4 hover:decoration-black break-words"
          >
            {run.text}
          </a>
        ) : (
          <span key={i}>{run.text}</span>
        )
      )}
    </>
  );
}

const isDownload = (label: string) => /baix|download|instal/i.test(label);

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'heading':
      if (block.level === 1) {
        return (
          <h1
            id={block.id}
            className="font-oswald text-3xl sm:text-5xl font-bold tracking-[0.05em] uppercase leading-[1.1] text-black pt-2 pb-6 scroll-mt-24"
          >
            {block.text}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2
            id={block.id}
            className="font-oswald text-xl sm:text-2xl font-bold tracking-[0.1em] uppercase text-black pt-10 pb-3 mb-5 border-b border-black/20 scroll-mt-24"
          >
            {block.text}
          </h2>
        );
      }
      return (
        <h3
          id={block.id}
          className="font-oswald text-base sm:text-lg font-semibold tracking-[0.14em] uppercase text-neutral-800 pt-6 pb-2 scroll-mt-24"
        >
          {block.text}
        </h3>
      );

    case 'paragraph':
      return (
        <p className="text-[15px] sm:text-base leading-7 text-neutral-800 mb-4">
          <Runs runs={block.runs} />
        </p>
      );

    case 'list':
      return block.ordered ? (
        <ol className="mb-5 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4 text-[15px] sm:text-base leading-7 text-neutral-800">
              <span className="shrink-0 mt-1 w-6 h-6 bg-black text-white font-oswald text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>
                <Runs runs={item} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mb-5 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4 text-[15px] sm:text-base leading-7 text-neutral-800">
              <span className="shrink-0 mt-[11px] w-1.5 h-1.5 bg-black" aria-hidden="true" />
              <span>
                <Runs runs={item} />
              </span>
            </li>
          ))}
        </ul>
      );

    case 'link': {
      const Icon = isDownload(block.label) ? Download : ExternalLink;
      return (
        <p className="my-4">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white hover:bg-neutral-800 text-xs sm:text-[13px] font-bold tracking-[0.2em] uppercase px-6 py-3.5 shadow-md transition-colors active:scale-[0.98]"
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="break-words">{block.label}</span>
          </a>
        </p>
      );
    }
  }
}

export function DocumentReader({ projectTitle, docUrl, onClose }: DocumentReaderProps) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    loadDocument(docUrl, controller.signal)
      .then((b) => {
        setBlocks(b);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Não foi possível abrir a documentação.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [docUrl]);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toc = useMemo(
    () =>
      blocks.filter(
        (b): b is Extract<DocBlock, { type: 'heading' }> => b.type === 'heading' && b.level >= 2
      ),
    [blocks]
  );

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  };

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Documentação de ${projectTitle}`}
      className="fixed inset-0 z-[60] bg-[#f3f0ea] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Barra superior com progresso de leitura */}
      <div className="relative bg-black text-white border-b border-neutral-800 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <button
            ref={backRef}
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <p className="font-oswald text-xs sm:text-sm tracking-[0.18em] uppercase truncate text-neutral-300">
            Documentação · <span className="text-white">{projectTitle}</span>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] bg-white transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Índice */}
          {status === 'ready' && toc.length > 1 && (
            <aside className="hidden lg:block lg:col-span-3">
              <nav className="sticky top-6" aria-label="Índice da documentação">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-500 mb-4">Neste documento</p>
                <ul className="space-y-1 border-l border-black/15">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => goTo(h.id)}
                        className={`text-left w-full text-xs tracking-wide text-neutral-600 hover:text-black hover:border-black -ml-px border-l border-transparent py-1.5 cursor-pointer ${
                          h.level === 3 ? 'pl-7' : 'pl-4'
                        }`}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Página */}
          <article
            className={`${status === 'ready' && toc.length > 1 ? 'lg:col-span-9' : 'lg:col-span-12'} max-w-3xl w-full mx-auto lg:mx-0`}
          >
            {status === 'loading' && (
              <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando documentação">
                <div className="h-10 w-2/3 bg-black/10" />
                <div className="h-4 w-full bg-black/5" />
                <div className="h-4 w-11/12 bg-black/5" />
                <div className="h-4 w-4/5 bg-black/5" />
                <div className="h-8 w-1/3 bg-black/10 mt-8" />
                <div className="h-4 w-full bg-black/5" />
                <div className="h-4 w-3/4 bg-black/5" />
              </div>
            )}

            {status === 'error' && (
              <div className="border border-black/20 bg-white/50 p-8 text-center space-y-4" role="alert">
                <p className="text-sm text-neutral-800">{error}</p>
                <button
                  onClick={onClose}
                  className="bg-black text-white hover:bg-neutral-800 text-[11px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 cursor-pointer"
                >
                  Voltar ao projeto
                </button>
              </div>
            )}

            {status === 'ready' && blocks.map((block, i) => <Block key={i} block={block} />)}
          </article>
        </div>
      </div>
    </div>
  );
}
