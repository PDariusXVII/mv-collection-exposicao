import { extractBlocks, type DocBlock, type PdfDocLike } from './pdfBlocks';

export class DocError extends Error {}

/**
 * Baixa o PDF para a memória (nunca oferece download) e devolve o conteúdo estruturado.
 * O pdf.js só é carregado quando alguém abre uma documentação.
 */
export async function loadDocument(url: string, signal?: AbortSignal): Promise<DocBlock[]> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new DocError('Não foi possível carregar a documentação. Verifique o endereço do arquivo e o CORS.');
  }
  if (!res.ok) throw new DocError(`Não foi possível abrir a documentação (HTTP ${res.status}).`);

  const buffer = await res.arrayBuffer();
  const head = new TextDecoder('latin1').decode(new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength)));
  if (!head.includes('%PDF-')) throw new DocError('A documentação precisa ser um arquivo PDF.');

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  let doc: PdfDocLike;
  try {
    doc = (await task.promise) as unknown as PdfDocLike;
  } catch {
    void task.destroy();
    throw new DocError('Não foi possível ler este PDF (arquivo protegido ou corrompido).');
  }
  try {
    return await extractBlocks(doc);
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_TEXT') {
      throw new DocError('Este PDF não tem texto selecionável (parece ser escaneado). Envie um PDF com texto.');
    }
    throw new DocError('Não foi possível montar a documentação a partir deste PDF.');
  } finally {
    void task.destroy();
  }
}
