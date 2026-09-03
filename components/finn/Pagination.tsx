import Link from 'next/link';

import { searchHref, type SearchQuery } from '@/lib/finn/params';

/** 1 … 4 5 [6] 7 8 … 42 — a window around the current page, plus both ends. */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= 2; offset += 1) {
    if (current - offset > 1) pages.add(current - offset);
    if (current + offset < total) pages.add(current + offset);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const output: (number | 'gap')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) output.push('gap');
    output.push(page);
    previous = page;
  }
  return output;
}

export function Pagination({
  query,
  pageNumber,
  totalPages,
}: {
  query: SearchQuery;
  pageNumber: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Sidenavigasjon">
      {pageNumber > 1 ? (
        <Link href={searchHref({ ...query, page: pageNumber - 1 })} rel="prev">
          Forrige
        </Link>
      ) : (
        <span className="is-disabled">Forrige</span>
      )}

      {pageWindow(pageNumber, totalPages).map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} className="is-gap" aria-hidden="true">
            …
          </span>
        ) : page === pageNumber ? (
          <span key={page} aria-current="page">
            {page}
          </span>
        ) : (
          <Link key={page} href={searchHref({ ...query, page })} aria-label={`Side ${page}`}>
            {page}
          </Link>
        ),
      )}

      {pageNumber < totalPages ? (
        <Link href={searchHref({ ...query, page: pageNumber + 1 })} rel="next">
          Neste
        </Link>
      ) : (
        <span className="is-disabled">Neste</span>
      )}
    </nav>
  );
}
