import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] erro inesperado ao renderizar o site:', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#f3f0ea] text-[#111111] flex items-center justify-center p-6">
        <section className="w-full max-w-lg border border-black/15 bg-white/70 p-8 text-center">
          <p className="font-oswald text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">MV COLLECTION</p>
          <h1 className="mt-3 font-oswald text-2xl font-bold uppercase">Não foi possível exibir a página</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Uma alteração no catálogo pode estar incompleta. Tente recarregar a página; os projetos válidos continuarão disponíveis.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-6 bg-black px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase text-white hover:bg-neutral-800 cursor-pointer"
          >
            Recarregar
          </button>
        </section>
      </main>
    );
  }
}
