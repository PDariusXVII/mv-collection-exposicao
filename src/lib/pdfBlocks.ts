/**
 * Transforma o texto de um PDF (já extraído pelo pdf.js) em blocos estruturados
 * (títulos, parágrafos, listas, links) para o leitor desenhar como página web.
 * Este arquivo não importa o pdf.js: recebe qualquer objeto com a mesma forma.
 */

export interface DocRun {
  text: string;
  url?: string;
}

export type DocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: string }
  | { type: 'paragraph'; runs: DocRun[] }
  | { type: 'list'; ordered: boolean; items: DocRun[][] }
  | { type: 'link'; label: string; url: string };

// ---- forma mínima do pdf.js que usamos -------------------------------------
interface PdfTextItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
}
interface PdfAnnotation {
  subtype?: string;
  url?: string;
  unsafeUrl?: string;
  rect?: number[];
}
interface PdfPage {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
  getAnnotations(): Promise<PdfAnnotation[]>;
  getViewport(opts: { scale: number }): { height: number };
}
export interface PdfDocLike {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}

// ---- utilidades -------------------------------------------------------------
/** Só http(s) e mailto: nada de javascript: vindo de dentro de um PDF. */
export function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.trim());
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}

const BARE_URL = /https?:\/\/[^\s<>"')\]]+/g;

/** Transforma URLs "soltas" no texto em links clicáveis. */
function linkify(runs: DocRun[]): DocRun[] {
  const out: DocRun[] = [];
  for (const run of runs) {
    if (run.url) {
      out.push(run);
      continue;
    }
    let last = 0;
    for (const m of run.text.matchAll(BARE_URL)) {
      const raw = m[0];
      const clean = raw.replace(/[.,;:!?]+$/, '');
      const start = m.index ?? 0;
      const url = safeUrl(clean);
      if (!url) continue;
      if (start > last) out.push({ text: run.text.slice(last, start) });
      out.push({ text: clean, url });
      last = start + clean.length;
    }
    if (last < run.text.length) out.push({ text: run.text.slice(last) });
  }
  return out.filter((r) => r.text !== '');
}

function mergeRuns(runs: DocRun[]): DocRun[] {
  const out: DocRun[] = [];
  for (const r of runs) {
    const prev = out[out.length - 1];
    if (prev && prev.url === r.url) prev.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

const plain = (runs: DocRun[]) => runs.map((r) => r.text).join('');

// ---- linhas -----------------------------------------------------------------
interface Line {
  page: number;
  y: number;
  x0: number;
  size: number;
  runs: DocRun[];
  text: string;
}

const BULLET = /^([•·▪◦●○■□‣⁃*]|[-–—])\s+/;
const ORDERED = /^(\d{1,3}[.)]|[a-zA-Z][.)])\s+/;

function trimRunsStart(runs: DocRun[], removeChars: number): DocRun[] {
  const out = runs.map((r) => ({ ...r }));
  let left = removeChars;
  for (const r of out) {
    const cut = Math.min(left, r.text.length);
    r.text = r.text.slice(cut);
    left -= cut;
    if (left <= 0) break;
  }
  const filtered = out.filter((r) => r.text !== '');
  if (filtered[0]) filtered[0].text = filtered[0].text.replace(/^\s+/, '');
  return filtered;
}

async function readLines(pdf: PdfDocLike): Promise<Line[]> {
  const lines: Line[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const pageHeight = page.getViewport({ scale: 1 }).height;
    const [content, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);

    const linkRects = annotations
      .filter((a) => a.subtype === 'Link' && a.rect && (a.url || a.unsafeUrl))
      .map((a) => {
        const [x1, y1, x2, y2] = a.rect as number[];
        return { x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2), url: safeUrl(a.url ?? a.unsafeUrl) };
      })
      .filter((r) => r.url);

    interface Item { str: string; x: number; y: number; w: number; size: number; url?: string }
    const items: Item[] = [];
    for (const it of content.items) {
      if (typeof it.str !== 'string' || !it.transform) continue;
      const size = Math.abs(it.transform[3]) || it.height || 0;
      if (!size) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      const w = it.width ?? 0;
      if (it.str.trim() === '') continue;
      const cx = x + w / 2;
      const cy = y + size * 0.35;
      const hit = linkRects.find((r) => cx >= r.x1 - 2 && cx <= r.x2 + 2 && cy >= r.y1 - 2 && cy <= r.y2 + 2);
      items.push({ str: it.str, x, y, w, size, url: hit?.url });
    }

    // agrupa por linha (mesmo y, com tolerância)
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const groups: Item[][] = [];
    for (const it of items) {
      const g = groups[groups.length - 1];
      if (g && Math.abs(g[0].y - it.y) <= Math.max(g[0].size, it.size) * 0.5) g.push(it);
      else groups.push([it]);
    }

    for (const g of groups) {
      g.sort((a, b) => a.x - b.x);
      const runs: DocRun[] = [];
      let prevEnd = -Infinity;
      for (const it of g) {
        const gap = it.x - prevEnd;
        const needSpace = runs.length > 0 && gap > it.size * 0.15;
        if (needSpace) runs.push({ text: ' ' });
        runs.push({ text: it.str, url: it.url });
        prevEnd = it.x + it.w;
      }
      const merged = mergeRuns(runs);
      const text = plain(merged).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const y = g[0].y;
      // número de página solto no topo/rodapé
      if (/^(página\s+|page\s+)?\d{1,4}(\s*(\/|de|of)\s*\d{1,4})?$/i.test(text) && (y < pageHeight * 0.08 || y > pageHeight * 0.94)) continue;
      lines.push({ page: n, y, x0: g[0].x, size: Math.max(...g.map((i) => i.size)), runs: merged, text });
    }
  }
  return lines;
}

// ---- blocos -----------------------------------------------------------------
function bodySize(lines: Line[]): number {
  const weight = new Map<number, number>();
  for (const l of lines) {
    const k = Math.round(l.size * 2) / 2;
    weight.set(k, (weight.get(k) ?? 0) + l.text.length);
  }
  let best = 12;
  let bestW = -1;
  for (const [k, w] of weight) if (w > bestW) [best, bestW] = [k, w];
  return best;
}

export async function extractBlocks(pdf: PdfDocLike): Promise<DocBlock[]> {
  const lines = await readLines(pdf);
  if (lines.reduce((n, l) => n + l.text.length, 0) < 20) {
    throw new Error('NO_TEXT');
  }
  const body = bodySize(lines);

  type Draft =
    | { type: 'heading'; level: 1 | 2 | 3; text: string; size: number; last: Line }
    | { type: 'paragraph'; runs: DocRun[]; last: Line; first: Line }
    | { type: 'list'; ordered: boolean; items: DocRun[][]; last: Line; bulletX: number };
  const drafts: Draft[] = [];

  const endsSentence = (t: string) => /[.!?:;…]$/.test(t);

  for (const line of lines) {
    const prev = drafts[drafts.length - 1];
    const gap = prev ? (prev.last.page === line.page ? prev.last.y - line.y : Infinity) : Infinity;

    // título
    if (line.size >= body * 1.15 && line.text.length <= 140) {
      const ratio = line.size / body;
      const level: 1 | 2 | 3 = ratio >= 1.7 ? 1 : ratio >= 1.35 ? 2 : 3;
      if (prev && prev.type === 'heading' && prev.level === level && gap <= line.size * 1.6) {
        prev.text += ` ${line.text}`;
        prev.last = line;
      } else {
        drafts.push({ type: 'heading', level, text: line.text, size: line.size, last: line });
      }
      continue;
    }

    // item de lista
    const bullet = BULLET.exec(line.text);
    const ordered = bullet ? null : ORDERED.exec(line.text);
    const marker = bullet ?? ordered;
    if (marker) {
      const item = linkify(trimRunsStart(line.runs, marker[0].length));
      const isOrdered = Boolean(ordered);
      if (prev && prev.type === 'list' && prev.ordered === isOrdered && gap <= line.size * 2.4) {
        prev.items.push(item);
        prev.last = line;
      } else {
        drafts.push({ type: 'list', ordered: isOrdered, items: [item], last: line, bulletX: line.x0 });
      }
      continue;
    }

    // continuação de item de lista (linha quebrada, recuada em relação ao marcador)
    if (prev && prev.type === 'list' && gap <= line.size * 1.75 && line.x0 > prev.bulletX + 2) {
      const lastItem = prev.items[prev.items.length - 1];
      lastItem.push({ text: ' ' }, ...line.runs);
      prev.last = line;
      continue;
    }

    // continuação de parágrafo
    if (prev && prev.type === 'paragraph') {
      const sameColumn = Math.abs(line.x0 - prev.first.x0) < line.size * 2.5;
      const nextLine = gap <= Math.max(prev.last.size, line.size) * 1.75;
      const acrossPage =
        gap === Infinity && prev.last.page !== line.page && !endsSentence(prev.last.text) && /^[a-zà-ÿ]/.test(line.text);
      if (sameColumn && (nextLine || acrossPage)) {
        const lastRun = prev.runs[prev.runs.length - 1];
        if (lastRun && !lastRun.url && /[a-zà-ÿ]-$/.test(lastRun.text) && /^[a-zà-ÿ]/.test(line.text)) {
          lastRun.text = lastRun.text.slice(0, -1); // palavra hifenizada na quebra de linha
        } else {
          prev.runs.push({ text: ' ' });
        }
        prev.runs.push(...line.runs);
        prev.last = line;
        continue;
      }
    }

    drafts.push({ type: 'paragraph', runs: [...line.runs], last: line, first: line });
  }

  // drafts → blocos finais
  const blocks: DocBlock[] = [];
  let headingCount = 0;
  for (const d of drafts) {
    if (d.type === 'heading') {
      blocks.push({ type: 'heading', level: d.level, text: d.text, id: `doc-h-${headingCount++}` });
    } else if (d.type === 'list') {
      blocks.push({ type: 'list', ordered: d.ordered, items: d.items.map((it) => mergeRuns(linkify(it))) });
    } else {
      const runs = mergeRuns(linkify(mergeRuns(d.runs)));
      const text = plain(runs).trim();
      const visible = runs.filter((r) => r.text.trim() !== '');
      const onlyLink = visible.length === 1 && visible[0].url ? visible[0] : undefined;
      if (onlyLink && onlyLink.url) blocks.push({ type: 'link', label: text, url: onlyLink.url });
      else if (text) blocks.push({ type: 'paragraph', runs });
    }
  }
  return blocks;
}
