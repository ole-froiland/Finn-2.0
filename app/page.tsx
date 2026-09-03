import Link from 'next/link';

import { Disclaimer } from '@/components/finn/Disclaimer';
import { ListingCard } from '@/components/finn/ListingCard';
import { SiteFooter } from '@/components/finn/SiteFooter';
import { SiteHeader } from '@/components/finn/SiteHeader';
import { getDataset, getLocations } from '@/lib/finn/data';
import { formatNumber } from '@/lib/finn/format';
import { PROPERTY_TYPES } from '@/lib/finn/taxonomy';

export default function Home() {
  const { listings, meta } = getDataset();
  const locations = getLocations();

  const perCounty = new Map<string, number>();
  const perType = new Map<string, number>();
  for (const listing of listings) {
    perCounty.set(listing.countyCode, (perCounty.get(listing.countyCode) ?? 0) + 1);
    if (listing.propertyType) {
      perType.set(listing.propertyType, (perType.get(listing.propertyType) ?? 0) + 1);
    }
  }

  const counties = locations
    .filter((county) => (perCounty.get(county.code) ?? 0) > 0)
    .sort((a, b) => (perCounty.get(b.code) ?? 0) - (perCounty.get(a.code) ?? 0));

  const withViewing = listings.filter((listing) => listing.viewingDate !== null).length;
  const newest = [...listings]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6);

  return (
    <>
      <SiteHeader active="Eiendom" />
      <Disclaimer />

      <main className="shell">
        <section className="hero">
          <h1>Hele boligmarkedet, ett søk</h1>
          <p>
            Søk og filtrer blant boligannonser fra hele Norge med de samme filtrene du kjenner fra
            FINN. Hver annonse lenker til originalen.
          </p>
          <form className="hero__search" action="/realestate/homes/search">
            <label className="sr-only" htmlFor="home-search">
              Søk etter bolig
            </label>
            <input id="home-search" name="q" placeholder="Sted, adresse eller megler" />
            <button type="submit">Søk</button>
          </form>
        </section>

        <section className="section">
          <div className="stats">
            <div className="stat">
              <strong>{formatNumber(meta.total)}</strong>
              <span>annonser i databasen</span>
            </div>
            <div className="stat">
              <strong>{formatNumber(counties.length)}</strong>
              <span>fylker representert</span>
            </div>
            <div className="stat">
              <strong>{formatNumber(withViewing)}</strong>
              <span>med annonsert visning</span>
            </div>
            <div className="stat">
              <strong>{formatNumber(perType.get('Leilighet') ?? 0)}</strong>
              <span>leiligheter</span>
            </div>
          </div>

          <div className="section__head">
            <h2>Bolig etter fylke</h2>
            <Link href="/realestate/homes/search">Se alle annonser ›</Link>
          </div>
          <div className="tiles">
            {counties.map((county) => (
              <Link
                key={county.code}
                className="tile"
                href={`/realestate/homes/search?location=${encodeURIComponent(county.code)}`}
              >
                <strong>{county.name}</strong>
                <span>{formatNumber(perCounty.get(county.code) ?? 0)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2>Bolig etter type</h2>
          </div>
          <div className="tiles">
            {PROPERTY_TYPES.filter((type) => (perType.get(type) ?? 0) > 0).map((type) => (
              <Link
                key={type}
                className="tile"
                href={`/realestate/homes/search?property_type=${encodeURIComponent(type)}`}
              >
                <strong>{type}</strong>
                <span>{formatNumber(perType.get(type) ?? 0)}</span>
              </Link>
            ))}
          </div>
        </section>

        {newest.length > 0 && (
          <section className="section">
            <div className="section__head">
              <h2>Nyeste annonser</h2>
              <Link href="/realestate/homes/search">Se alle ›</Link>
            </div>
            <div className="cards">
              {newest.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} priority={index === 0} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter updatedAt={meta.updatedAt} />
    </>
  );
}
