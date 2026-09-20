import { useCallback, useEffect, useState } from 'react';

/**
 * Rotas por hash, que funcionam em hospedagem estática (GitHub Pages):
 *   #/projeto/<id>        → visualizador do projeto
 *   #/projeto/<id>/docs   → documentação aberta por cima do projeto
 */
const ROUTE = /^#\/projeto\/([^/]+)(\/docs)?\/?$/;

interface Route {
  id: string | null;
  doc: boolean;
}

function readRoute(): Route {
  const match = window.location.hash.match(ROUTE);
  if (!match) return { id: null, doc: false };
  let id = match[1];
  try {
    id = decodeURIComponent(id);
  } catch {
    /* mantém o valor bruto */
  }
  return { id, doc: Boolean(match[2]) };
}

export function useProjectRoute() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const open = useCallback((projectId: string) => {
    window.location.hash = `/projeto/${encodeURIComponent(projectId)}`;
  }, []);

  const openDoc = useCallback((projectId: string) => {
    window.location.hash = `/projeto/${encodeURIComponent(projectId)}/docs`;
  }, []);

  const replaceHash = (hash: string) =>
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);

  const closeDoc = useCallback((projectId: string) => {
    replaceHash(`#/projeto/${encodeURIComponent(projectId)}`);
    setRoute({ id: projectId, doc: false });
  }, []);

  const close = useCallback(() => {
    replaceHash('#projetos');
    setRoute({ id: null, doc: false });
  }, []);

  return { id: route.id, doc: route.doc, open, openDoc, closeDoc, close };
}
