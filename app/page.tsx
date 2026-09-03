import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { ActiveFilters } from '@/components/finn/ActiveFilters';
import { Disclaimer } from '@/components/finn/Disclaimer';
import { FilterRail } from '@/components/finn/FilterRail';
import { ListingCard } from '@/components/finn/ListingCard';
import { MapView, type MapPoint } from '@/components/finn/MapView';
import { Pagination } from '@/components/finn/Pagination';
import { ResultsToolbar } from '@/components/finn/ResultsToolbar';
import { SiteFooter } from '@/components/finn/SiteFooter';
import { SiteHeader } from '@/components/finn/SiteHeader';
import { getDataset, getLocations, locationNames } from '@/lib/finn/data';
import { formatNumber } from '@/lib/finn/format';
import {
  countActiveFilters,
  parseSearchQuery,
  toSearchParams,
  type RawParams,
} from '@/lib/finn/params';
import { search } from '@/lib/finn/search';

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

  // Only build the map payload when the map is actually being shown.
  // Ads harvested before the coordinate pass have no `lat` key at all, so this
  // has to reject undefined as well as null — `!== null` lets undefined past.
  const hasPosition = (listing: (typeof listings)[number]) =>
    typeof listing.lat === 'number' && typeof listing.lon === 'number';

  const located = query.map ? result.matched.filter(hasPosition) : [];
  const points: MapPoint[] = located.slice(0, 1500).map((listing) => ({
    id: listing.id,
    lat: listing.lat,
    lon: listing.lon,
    title: listing.title,
    address: listing.address,
    price: listing.price,
    area: listing.area,
    image: listing.image,
  }));

  return (
    <>
      <SiteHeader />
      <Disclaimer />

      <main className="shell">
        <div className="layout">
          <FilterRail
            query={query}
            facets={result.facets}
            locations={getLocations()}
            enriched={meta.enriched}
            total={result.total}
            activeCount={countActiveFilters(query)}
            currentQueryString={toSearchParams(query).toString()}
            locationNames={names}
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
              <ResultsToolbar query={query} />
            </div>

            <ActiveFilters query={query} locationNames={names} />

            {result.total === 0 ? (
              <div className="empty">
                <SearchX size={32} aria-hidden="true" />
                <h2>Ingen treff</h2>
                <p>Prøv å fjerne et filter, eller søk i et større område.</p>
                <p>
                  <Link href="/">Nullstill alle filtre</Link>
                </p>
              </div>
            ) : query.map ? (
              <MapView points={points} missing={result.total - located.length} />
            ) : (
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
            )}
          </section>
        </div>
      </main>

      <SiteFooter updatedAt={meta.updatedAt} />
    </>
  );
}
