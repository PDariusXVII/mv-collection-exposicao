import { SITE } from '../config/site';

interface TopBannerProps {
  count?: number;
}

export function TopBanner({ count }: TopBannerProps) {
  return (
    <div
      id="top-utility-banner"
      className="bg-black text-white text-[10px] sm:text-[11px] font-medium tracking-[0.2em] py-2 px-4 sm:px-12 flex justify-between items-center gap-4 border-b border-neutral-800"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
        <span className="uppercase text-neutral-300">{SITE.banner}</span>
      </div>
      {count !== undefined && (
        <span className="uppercase text-neutral-400">
          {count} {count === 1 ? 'PROJETO' : 'PROJETOS'}
        </span>
      )}
    </div>
  );
}
