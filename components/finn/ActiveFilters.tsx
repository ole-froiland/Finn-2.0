import Link from 'next/link';
import { X } from 'lucide-react';

import { formatNumber, viewingFacetLabel } from '@/lib/finn/format';
import {
  EMPTY_QUERY,
  MULTI_KEYS,
  RANGE_KEYS,
  searchHref,
  type RangeKey,
  type SearchQuery,
} from '@/lib/finn/params';

const RANGE_LABELS: Record<RangeKey, { title: string; unit: string }> = {
  price: { title: 'Prisantydning', unit: 'kr' },
  price_collective: { title: 'Totalpris', unit: 'kr' },
  rent: { title: 'Fellesutgifter', unit: 'kr' },
  area: { title: 'Størrelse', unit: 'm²' },
  construction_year: { title: 'Byggeår', unit: '' },
  plot_area: { title: 'Tomtestørrelse', unit: 'm²' },
};

type Pill = { label: string; next: SearchQuery };

export function ActiveFilters({
  query,
  locationNames,
}: {
  query: SearchQuery;
  /** FINN location code → display name, so chips read "Oslo", not "0.20061". */
  locationNames: Record<string, string>;
}) {
  const pills: Pill[] = [];

  if (query.q) {
    pills.push({ label: `“${query.q}”`, next: { ...query, q: '' } });
  }

  if (query.published) {
    pills.push({ label: 'Nye i dag', next: { ...query, published: false } });
  }

  if (query.min_bedrooms !== null) {
    pills.push({
      label: `${query.min_bedrooms}+ soverom`,
      next: { ...query, min_bedrooms: null },
    });
  }

  for (const key of MULTI_KEYS) {
    for (const value of query[key]) {
      const label =
        key === 'location'
          ? locationNames[value] ?? value
          : key === 'viewing'
            ? viewingFacetLabel(value)
            : value;
      pills.push({
        label,
        next: { ...query, [key]: query[key].filter((item) => item !== value) },
      });
    }
  }

  for (const key of RANGE_KEYS) {
    const { from, to } = query[key];
    if (from === null && to === null) continue;
    const { title, unit } = RANGE_LABELS[key];
    const suffix = unit ? ` ${unit}` : '';
    const range =
      from !== null && to !== null
        ? `${formatNumber(from)}–${formatNumber(to)}${suffix}`
        : from !== null
          ? `fra ${formatNumber(from)}${suffix}`
          : `til ${formatNumber(to!)}${suffix}`;
    pills.push({
      label: `${title}: ${range}`,
      next: { ...query, [key]: { from: null, to: null } },
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="active-filters">
      {pills.map((pill) => (
        <Link
          key={pill.label}
          className="active-filter"
          href={searchHref({ ...pill.next, page: 1 })}
          scroll={false}
        >
          {pill.label}
          <X aria-hidden="true" />
          <span className="sr-only">Fjern filter</span>
        </Link>
      ))}
      <Link
        className="active-filters__clear"
        href={searchHref({ ...EMPTY_QUERY, sort: query.sort })}
        scroll={false}
      >
        Nullstill alle
      </Link>
    </div>
  );
}
