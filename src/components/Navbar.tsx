import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SITE } from '../config/site';

const NAV_LINKS = [
  { label: 'INÍCIO', href: '#' },
  { label: 'SOBRE', href: '#sobre' },
  { label: 'PROJETOS', href: '#projetos' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      id="main-navigation-header"
      className="sticky top-0 z-40 bg-[#f3f0ea]/95 backdrop-blur-md border-b border-black/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4 grid grid-cols-3 items-center">
        {/* Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-[0.18em] text-neutral-800">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="relative group py-1 hover:text-black transition-colors">
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <div className="flex lg:hidden items-center">
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center select-none">
          <a href="#" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="font-cinzel text-xl sm:text-2xl lg:text-[28px] font-black tracking-[0.22em] text-black leading-none uppercase">
              {SITE.name}
            </h1>
          </a>
        </div>

        <div />
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/10 bg-[#f3f0ea] px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold tracking-widest text-neutral-800 hover:text-black py-1.5 border-b border-black/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
