import Link from 'next/link';

/**
 * FINN's own mark: a dark-blue quarter circle beside a light-blue rectangle.
 * The white path draws the frame that separates the two halves.
 */
function FinnMark() {
  return (
    <svg
      width="92"
      height="32"
      viewBox="0 0 184 64"
      focusable="false"
      aria-hidden="true"
      className="topbar__mark"
    >
      <path
        fill="#06bffc"
        d="M179.8 58V6c0-1-.8-1.9-1.9-1.9H66c-1 0-1.9.8-1.9 1.9v53.8H178c1 0 1.8-.8 1.8-1.8"
      />
      <path
        fill="#0063fc"
        d="M22.5 4.2H6C5 4.2 4.2 5 4.2 6v52c0 1 .8 1.9 1.9 1.9H60V41.5C59.9 20.9 43.2 4.2 22.5 4.2"
      />
      <path
        fill="#fff"
        d="M178 0H66c-3.3 0-6 2.7-6 6v17.4C53.2 9.6 38.9 0 22.5 0H6C2.7 0 0 2.7 0 6v52c0 3.3 2.7 6 6 6h172c3.3 0 6-2.7 6-6V6c0-3.3-2.7-6-6-6m1.8 58c0 1-.8 1.9-1.9 1.9H64.1V6c0-1 .8-1.9 1.9-1.9h112c1 0 1.9.8 1.9 1.9v52zM4.2 58V6C4.2 5 5 4.2 6 4.2h16.5c20.6 0 37.4 16.8 37.4 37.4v18.3H6c-1-.1-1.8-.9-1.8-1.9"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link href="/" className="topbar__logo" aria-label="Forside">
          <FinnMark />
          <span className="topbar__beta">beta</span>
        </Link>
      </div>
    </header>
  );
}
