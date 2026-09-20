import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';

type PdfDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;
type PdfPageProxy = import('pdfjs-dist').PDFPageProxy;

interface DocumentReaderProps {
  projectTitle: string;
  docUrl: string;
  onClose: () => void;
}

export function DocumentReader({ projectTitle, docUrl, onClose }: DocumentReaderProps) {
  const [pdf, setPdf] = useState<PdfDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [fitWidth, setFitWidth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [resizeKey, setResizeKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    let disposed = false;
    let task: { promise: Promise<unknown>; destroy: () => void | Promise<void> } | null = null;

    setLoading(true);
    setError('');
    setPdf(null);
    setPage(1);

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        task = pdfjs.getDocument({ url: docUrl });
        const loaded = (await task.promise) as PdfDocumentProxy;
        if (disposed) {
          await loaded.destroy();
          return;
        }
        setPdf(loaded as unknown as PdfDocumentProxy);
      } catch (err) {
        if (disposed) return;
        console.error('[pdf] falha ao carregar:', err);
        setError('Não foi possível renderizar este PDF dentro do catálogo. O servidor externo pode estar bloqueando CORS, ou o arquivo pode estar indisponível.');
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
      void task?.destroy();
    };
  }, [docUrl, retryKey]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !viewportRef.current) return;
    let disposed = false;
    let pageProxy: PdfPageProxy | null = null;

    setRendering(true);
    renderTaskRef.current?.cancel();

    (async () => {
      try {
        pageProxy = await pdf.getPage(page);
        if (disposed || !canvasRef.current || !viewportRef.current) return;

        const baseViewport = pageProxy.getViewport({ scale: 1 });
        const availableWidth = Math.max(280, viewportRef.current.clientWidth - 32);
        const effectiveScale = fitWidth ? Math.min(2.75, availableWidth / baseViewport.width) : scale;
        const viewport = pageProxy.getViewport({ scale: effectiveScale });
        const canvas = canvasRef.current;
        const ratio = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas indisponível');

        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderTask = pageProxy.render({
          canvasContext: context,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (disposed || (err instanceof Error && err.name === 'RenderingCancelledException')) return;
        console.error('[pdf] falha ao renderizar página:', err);
        setError('O documento foi carregado, mas esta página não pôde ser renderizada.');
      } finally {
        if (!disposed) setRendering(false);
      }
    })();

    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
      void pageProxy?.cleanup();
    };
  }, [pdf, page, scale, fitWidth, resizeKey]);

  useEffect(() => {
    const rerender = () => fitWidth && setResizeKey((v) => v + 1);
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [fitWidth]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) onClose();
      if (!pdf) return;
      if (event.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1));
      if (event.key === 'ArrowRight') setPage((p) => Math.min(pdf.numPages, p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pdf]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  const changeZoom = (delta: number) => {
    setFitWidth(false);
    setScale((value) => Math.min(3, Math.max(0.5, Math.round((value + delta) * 10) / 10)));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await modalRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Fullscreen pode ser bloqueado pelo navegador; o leitor continua funcional.
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md p-0 sm:p-[5vh_5vw]" onClick={(e) => e.stopPropagation()}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Documentação de ${projectTitle}`}
        className="w-full h-full bg-[#0b0b0b] text-white border border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="shrink-0 min-h-16 px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.28em] uppercase text-neutral-500">Documentação</p>
            <h2 className="font-oswald text-sm sm:text-lg font-bold tracking-[0.12em] uppercase truncate">{projectTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" aria-label="Fechar documentação">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div ref={viewportRef} className="relative flex-1 overflow-auto bg-[#151515] p-4 sm:p-6 flex items-start justify-center">
          {(loading || rendering) && !error && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/20">
              <div className="w-[70%] max-w-2xl aspect-[1/1.35] bg-neutral-800/70 animate-pulse border border-neutral-700 shadow-xl" />
            </div>
          )}

          {error ? (
            <div className="m-auto max-w-xl border border-neutral-700 bg-neutral-950 p-7 sm:p-9 text-center space-y-5" role="alert">
              <p className="text-sm leading-relaxed text-neutral-300">{error}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-4 py-2.5 text-[11px] font-bold tracking-[0.16em] uppercase"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir documento em nova aba
                </a>
                <button
                  onClick={() => setRetryKey((value) => value + 1)}
                  className="inline-flex items-center gap-2 border border-neutral-600 hover:border-white px-4 py-2.5 text-[11px] font-bold tracking-[0.16em] uppercase"
                >
                  <RotateCcw className="w-4 h-4" /> Tentar novamente
                </button>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="bg-white shadow-2xl max-w-none" aria-label={`Página ${page} do PDF`} />
          )}
        </div>

        <footer className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-3 sm:px-5 py-3 flex flex-wrap items-center justify-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button disabled={!pdf || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="viewer-control" aria-label="Página anterior">
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="min-w-[92px] text-center text-[11px] tracking-wider text-neutral-300">
              Página {page} / {pdf?.numPages ?? '—'}
            </span>
            <button disabled={!pdf || page >= (pdf?.numPages ?? 1)} onClick={() => setPage((p) => Math.min(pdf?.numPages ?? p, p + 1))} className="viewer-control" aria-label="Próxima página">
              <span className="hidden sm:inline">Próxima</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => changeZoom(-0.1)} disabled={!pdf} className="viewer-control" aria-label="Diminuir zoom"><Minus className="w-4 h-4" /></button>
            <span className="w-12 text-center text-[11px] text-neutral-300">{fitWidth ? 'Auto' : `${Math.round(scale * 100)}%`}</span>
            <button onClick={() => changeZoom(0.1)} disabled={!pdf} className="viewer-control" aria-label="Aumentar zoom"><Plus className="w-4 h-4" /></button>
            <button onClick={() => setFitWidth(true)} disabled={!pdf} className="viewer-control hidden sm:inline-flex">Ajustar à largura</button>
            <button onClick={toggleFullscreen} className="viewer-control" aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">Tela cheia</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
