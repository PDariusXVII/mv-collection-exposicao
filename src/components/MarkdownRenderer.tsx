import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  const re = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_([^_]+)_|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const s = m[0];
    if (s.startsWith('`')) out.push(<code key={m.index} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[0.92em] text-neutral-100">{s.slice(1, -1)}</code>);
    else if (s.startsWith('**') || s.startsWith('__')) out.push(<strong key={m.index} className="font-semibold text-neutral-100">{s.slice(2, -2)}</strong>);
    else if (s.startsWith('*') || s.startsWith('_')) out.push(<em key={m.index}>{s.slice(1, -1)}</em>);
    else {
      const lm = s.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      out.push(lm ? <a key={m.index} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">{lm[1]}</a> : s);
    }
    last = m.index + s.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownRenderer({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim(); const code: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++;
      nodes.push(<pre key={`c${i}`} className="my-4 overflow-x-auto rounded-md border border-neutral-700 bg-[#0d1117] p-4"><code className="font-mono text-xs leading-relaxed text-neutral-200" data-language={lang || undefined}>{code.join('\n')}</code></pre>);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) { const n=h[1].length; const cls='mt-6 mb-3 border-b border-neutral-800 pb-2 font-semibold text-neutral-100'; const content=inline(h[2]); nodes.push(n===1?<h1 key={i} className={`${cls} text-2xl`}>{content}</h1>:n===2?<h2 key={i} className={`${cls} text-xl`}>{content}</h2>:n===3?<h3 key={i} className={`${cls} text-lg`}>{content}</h3>:<h4 key={i} className={`${cls} text-base`}>{content}</h4>); i++; continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const items:string[]=[]; while(i<lines.length&&/^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/,'')); nodes.push(<ul key={`u${i}`} className="my-3 list-disc space-y-1 pl-6">{items.map((x,j)=><li key={j}>{inline(x)}</li>)}</ul>); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { const items:string[]=[]; while(i<lines.length&&/^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/,'')); nodes.push(<ol key={`o${i}`} className="my-3 list-decimal space-y-1 pl-6">{items.map((x,j)=><li key={j}>{inline(x)}</li>)}</ol>); continue; }
    if (/^>\s?/.test(line)) { const q:string[]=[]; while(i<lines.length&&/^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/,'')); nodes.push(<blockquote key={`q${i}`} className="my-4 border-l-4 border-neutral-700 pl-4 text-neutral-400">{q.map((x,j)=><p key={j}>{inline(x)}</p>)}</blockquote>); continue; }
    if (/^\s*(---|___|\*\*\*)\s*$/.test(line)) { nodes.push(<hr key={i} className="my-5 border-neutral-800"/>); i++; continue; }
    if (!line.trim()) { i++; continue; }
    nodes.push(<p key={i} className="my-3 leading-7">{inline(line)}</p>); i++;
  }
  return <div className="markdown-body text-sm text-neutral-300 break-words">{nodes}</div>;
}
