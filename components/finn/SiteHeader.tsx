import Link from 'next/link';
import { Bell, Heart, Mail, Search, User } from 'lucide-react';

const SECTIONS = [
  { label: 'Torget', href: '/' },
  { label: 'Bil', href: '/' },
  { label: 'Reise', href: '/' },
  { label: 'Båt', href: '/' },
  { label: 'MC', href: '/' },
  { label: 'Jobb', href: '/' },
  { label: 'Eiendom', href: '/realestate/homes/search' },
];

export function SiteHeader({ active = 'Eiendom' }: { active?: string }) {
  return (
    <header className="header">
      <div className="shell header__bar">
        <Link href="/" className="brand" aria-label="Hjemly forside">
          <span className="brand__mark" aria-hidden="true">
            H
          </span>
          <span className="brand__word">hjemly</span>
        </Link>

        <form className="header__search" action="/realestate/homes/search">
          <label className="sr-only" htmlFor="global-search">
            Søk etter bolig
          </label>
          <input id="global-search" name="q" placeholder="Søk i boligannonser" />
          <button type="submit" aria-label="Søk">
            <Search size={20} />
          </button>
        </form>

        <div className="header__actions">
          <button type="button" className="header__icon" aria-label="Meldinger">
            <Mail size={20} />
          </button>
          <button type="button" className="header__icon" aria-label="Varslinger">
            <Bell size={20} />
          </button>
          <button type="button" className="header__icon" aria-label="Favoritter">
            <Heart size={20} />
          </button>
          <button type="button" className="header__login">
            <User size={18} aria-hidden="true" />
            <span>Logg inn</span>
          </button>
        </div>
      </div>

      <nav className="header__nav" aria-label="Hovedkategorier">
        <div className="shell">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.label}>
                <Link
                  href={section.href}
                  aria-current={section.label === active ? 'page' : undefined}
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
