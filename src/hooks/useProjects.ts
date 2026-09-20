import { useCallback, useEffect, useState } from 'react';
import { fetchProjects } from '../lib/api';
import type { LoadStatus, Project } from '../types';

interface State {
  status: LoadStatus;
  projects: Project[];
  error?: string;
}

export function useProjects() {
  const [state, setState] = useState<State>({ status: 'loading', projects: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: undefined }));
    fetchProjects(controller.signal)
      .then((projects) => setState({ status: 'ready', projects }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          projects: [],
          error: err instanceof Error ? err.message : 'Erro desconhecido ao carregar os projetos.',
        });
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, reload };
}
