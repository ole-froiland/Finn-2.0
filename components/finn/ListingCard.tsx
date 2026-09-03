import Image from 'next/image';
import { ImageOff } from 'lucide-react';

import { finnImage, formatNumber, formatPrice } from '@/lib/finn/format';
import type { Listing } from '@/lib/finn/types';

import { FavouriteButton } from './FavouriteButton';

/** "51 m²" for an ordinary ad, "45 - 120 m²" for a new-build project. */
function span(low: number | null, high: number | null, unit: string): string | null {
  if (low === null) return null;
  const lead = formatNumber(low);
  return high === null || high === low ? `${lead} ${unit}` : `${lead} - ${formatNumber(high)} ${unit}`;
}

export function ListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  const size = span(listing.area, listing.areaMax, 'm²');
  const price = span(listing.price, listing.priceMax, 'kr');
  const total = span(listing.totalPrice, listing.totalPriceMax, 'kr');

  const facts = [
    total ? `Totalpris: ${total}` : null,
    listing.sharedCost !== null ? `Fellesutg.: ${formatPrice(listing.sharedCost)}` : null,
    listing.ownership,
    listing.propertyType,
    listing.bedrooms !== null ? `${listing.bedrooms} soverom` : null,
  ].filter(Boolean);

  return (
    <article className="card">
      <div className="card__media">
        {listing.image ? (
          <Image
            src={finnImage(listing.image, 960) ?? listing.image}
            alt=""
            fill
            sizes="(min-width: 1025px) 640px, (min-width: 768px) 50vw, 100vw"
            priority={priority}
            unoptimized
          />
        ) : (
          <div className="card__placeholder">
            <ImageOff size={28} aria-hidden="true" />
          </div>
        )}

        {listing.status !== 'Til salgs' && (
          <span className={`card__flag${listing.status === 'Solgt' ? ' card__flag--sold' : ''}`}>
            {listing.status === 'Solgt' ? 'Solgt' : 'Kommer for salg'}
          </span>
        )}

        <FavouriteButton id={listing.id} title={listing.title} />
      </div>

      <div
        className="card__body"
        // FINN tints each card's top rule with the agency's own brand colour.
        style={listing.accent ? { borderTopColor: listing.accent } : undefined}
      >
        <div className="card__head">
          <div className="card__agency">
            {listing.agencyLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={listing.agencyLogo} alt="" loading="lazy" />
            ) : null}
            <span>{listing.agency ?? 'Privat selger'}</span>
          </div>
          <p className="card__address">{listing.address}</p>
        </div>

        <h2 className="card__title">
          <a href={listing.url} target="_blank" rel="noopener noreferrer">
            {listing.title}
          </a>
        </h2>

        <div className="card__key">
          {size ? <span>{size}</span> : null}
          <span>{price ?? 'Prisantydning mangler'}</span>
        </div>

        {facts.length > 0 && <p className="card__facts">{facts.join(' ∙ ')}</p>}

        <div className="card__foot">
          <span className="card__viewing">{listing.viewing ?? 'Visning etter avtale'}</span>
          <span className="card__link" aria-hidden="true">
            Se på FINN ↗
          </span>
        </div>
      </div>
    </article>
  );
}
