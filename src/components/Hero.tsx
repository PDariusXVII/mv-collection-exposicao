import { SITE } from '../config/site';

interface HeroProps {
  count?: number;
}

export function Hero({ count }: HeroProps) {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden pt-6 sm:pt-10 pb-12 sm:pb-20 border-b border-black/10 select-none min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] flex flex-col justify-between bg-black"
    >
      {/* Vídeo de fundo (loop, mudo, autoplay) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      >
        <source src={SITE.hero.videoUrl} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-20 min-h-[560px] sm:min-h-[640px] lg:min-h-[700px] flex flex-col justify-between w-full">
        {/* Lema */}
        <div className="relative z-20 max-w-xs pt-2">
          <div className="text-[11px] sm:text-[13px] font-bold tracking-[0.2em] text-white leading-relaxed uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {SITE.hero.motto.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="w-8 h-[2px] bg-white mt-3 shadow"></div>
        </div>

        {/* Título gigante */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
          <span className="font-cinzel text-[11vw] sm:text-[12vw] lg:text-[10.5vw] font-black tracking-[0.06em] text-white/90 leading-none text-center select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.7)] transform -translate-y-2 sm:-translate-y-6 uppercase">
            {SITE.name}
          </span>
        </div>

        {/* Selo inferior: quantidade de projetos */}
        <div className="relative z-30 flex items-end justify-end pt-72 sm:pt-40">
          {count !== undefined && (
            <div className="text-right bg-black/40 backdrop-blur-sm p-3 border border-white/10 rounded-sm">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-neutral-200 uppercase">
                {SITE.hero.countLabel}
              </p>
              <p className="font-oswald text-lg sm:text-xl font-bold tracking-[0.15em] text-white">{count}</p>
              <div className="w-6 h-[1.5px] bg-white ml-auto mt-1"></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
