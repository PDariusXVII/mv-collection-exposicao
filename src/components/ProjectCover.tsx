import { initials } from '../lib/format';

interface ProjectCoverProps {
  title: string;
  src?: string;
  className?: string;
}

/** Imagem de capa; sem imagem, mostra um placeholder com as iniciais. */
export function ProjectCover({ title, src, className = '' }: ProjectCoverProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-black"
      role="img"
      aria-label={title}
    >
      <span className="font-cinzel text-5xl font-black tracking-[0.12em] text-white/25">{initials(title)}</span>
    </div>
  );
}
