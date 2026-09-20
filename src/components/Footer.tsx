import { SITE } from '../config/site';

export function Footer() {
  return (
    <footer id="main-footer" className="bg-black text-neutral-400 pt-14 pb-10 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-10 border-b border-neutral-800">
          <div className="space-y-3 max-w-sm">
            <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.22em] text-white leading-none uppercase">
              {SITE.name}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">{SITE.footer.text}</p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold tracking-[0.18em] uppercase">
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="#projetos" className="hover:text-white transition-colors">Projetos</a>
            {SITE.footer.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="pt-8 text-center text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
