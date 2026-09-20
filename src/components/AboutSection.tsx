import { SITE } from '../config/site';

export function AboutSection() {
  const { about } = SITE;

  return (
    <section id="sobre" className="bg-[#f3f0ea] py-16 sm:py-24 border-b border-black/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Texto */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[11px] font-bold tracking-[0.3em] text-neutral-600 uppercase block">
              {about.eyebrow}
            </span>

            <h2 className="font-oswald text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-[0.04em] text-black leading-[1.08] uppercase">
              {about.titleLines.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < about.titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>

            <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-normal max-w-md">{about.text}</p>

            <div className="pt-2">
              <a
                href="#projetos"
                className="inline-block bg-black text-white hover:bg-neutral-800 text-xs sm:text-[13px] font-bold tracking-[0.22em] uppercase px-8 py-4 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {about.button}
              </a>
            </div>
          </div>

          {/* Foto */}
          <div className="lg:col-span-7">
            <div className="relative group overflow-hidden bg-black shadow-2xl border border-black/20">
              <img
                src={about.image}
                alt={about.imageAlt}
                className="w-full h-[360px] sm:h-[460px] lg:h-[500px] object-cover object-center filter grayscale contrast-125 brightness-95 transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute bottom-4 right-4 text-white/50 text-[10px] tracking-widest uppercase font-mono">
                {about.imageCaption}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
