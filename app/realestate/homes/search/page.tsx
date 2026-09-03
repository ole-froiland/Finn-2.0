import Link from 'next/link';
import type { Metadata } from 'next';
import { Info, SearchX } from 'lucide-react';

import { ActiveFilters } from '@/components/finn/ActiveFilters';
import { Disclaimer } from '@/components/finn/Disclaimer';
import { FilterRail } from '@/components/finn/FilterRail';
import { ListingCard } from '@/components/finn/ListingCard';
import { Pagination } from '@/components/finn/Pagination';
import { SiteFooter } from '@/components/finn/SiteFooter';
import { SiteHeader } from '@/components/finn/SiteHeader';
import { SortSelect } from '@/components/finn/SortSelect';
import { getDataset, getLocations, locationNames } from '@/lib/finn/data';
import { formatNumber, formatUpdatedAt } from '@/lib/finn/format';
import { countActiveFilters, parseSearchQuery, type RawParams } from '@/lib/finn/params';
import { search } from '@/lib/finn/search';

export const metadata: Metadata = { title: 'Bolig til salgs' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const query = parseSearchQuery(params);

  const { listings, meta } = getDataset();
  const result = search(listings, query);
  const names = Object.fromEntries(locationNames());

  return (
    <>
      <SiteHeader />
      <Disclaimer />

      <main className="shell">
        <nav className="breadcrumbs" aria-label="Brødsmuler">
          <Link href="/">Hjemly</Link>
          <span aria-hidden="true">›</span>
          <Link href="/realestate/homes/search">Eiendom</Link>
          <span aria-hidden="true">›</span>
          <span>Bolig til salgs</span>
        </nav>

        <div className="layout">
          <FilterRail
            query={query}
            facets={result.facets}
            locations={getLocations()}
            enriched={meta.enriched}
            total={result.total}
            activeCount={countActiveFilters(query)}
          />

          <section aria-labelledby="results-title">
            <div className="results__head">
              <div>
                <h1 className="results__title" id="results-title">
                  Bolig til salgs
                </h1>
                <p className="results__count">
                  <strong>{formatNumber(result.total)}</strong>{' '}
                  {result.total === 1 ? 'annonse' : 'annonser'}
                  {result.total !== listings.length && (
                    <> av {formatNumber(listings.length)} i databasen</>
                  )}
                </p>
              </div>
              <SortSelect query={query} />
            </div>

            <ActiveFilters query={query} locationNames={names} />

            <div className="notice">
              <Info aria-hidden="true" />
              <p>
                Annonsene er hentet fra FINN{' '}
                {meta.total > 0 ? <>og sist oppdatert {formatUpdatedAt(meta.updatedAt)}</> : null}.
                Klikk en annonse for å åpne originalen på finn.no.
              </p>
            </div>

            {result.page.length > 0 ? (
              <>
                <div className="cards">
                  {result.page.map((listing, index) => (
                    <ListingCard key={listing.id} listing={listing} priority={index < 2} />
                  ))}
                </div>
                <Pagination
                  query={query}
                  pageNumber={result.pageNumber}
                  totalPages={result.totalPages}
                />
              </>
            ) : (
              <div className="empty">
                <SearchX size={32} aria-hidden="true" />
                <h2>Ingen treff</h2>
                <p>Prøv å fjerne et filter, eller søk i et større område.</p>
                <p>
                  <Link href="/realestate/homes/search">Nullstill alle filtre</Link>
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter updatedAt={meta.updatedAt} />
    </>
  );
}
