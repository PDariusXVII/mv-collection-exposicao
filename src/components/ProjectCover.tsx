import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { initials } from '../lib/format';

interface ProjectCoverProps {
  title: string;
  src?: string;
  className?: string;
}

/** Imagem de capa com loading/erro isolados; sem imagem, mostra placeholder. */
export function ProjectCover({ title, src, className = '' }: ProjectCoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <div className="relative w-full h-full">
        {!loaded && <div className="absolute inset-0 bg-neutral-900 animate-pulse" aria-label="Carregando imagem" />}
        <img
          src={src}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover ${className}`}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-black"
      role="img"
      aria-label={title}
    >
      {failed && <ImageOff className="w-5 h-5 text-white/25" aria-hidden="true" />}
      <span className="font-cinzel text-5xl font-black tracking-[0.12em] text-white/25">{initials(title)}</span>
    </div>
  );
}
