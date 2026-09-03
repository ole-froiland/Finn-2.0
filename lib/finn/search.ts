import type { Listing } from './types';
import {
  MULTI_KEYS,
  RANGE_KEYS,
  type MultiKey,
  type RangeKey,
  type Range,
  type SearchQuery,
} from './params';
import { PAGE_SIZE } from './taxonomy';

/** A predicate per filter group, so facet counts can drop exactly one group. */
type Predicate = (listing: Listing) => boolean;

/**
 * New-build projects advertise a span rather than one figure, so a filter
 * matches whenever the ad's span and the filter's window overlap at all.
 * Ads with a single value are just a span of zero width.
 */
const inRange = (
  value: number | null,
  { from, to }: Range,
  upper: number | null = null,
): boolean => {
  if (from === null && to === null) return true;
  if (value === null) return false;
  const high = upper ?? value;
  if (from !== null && high < from) return false;
  if (to !== null && value > to) return false;
  return true;
};

/**
 * FINN's location codes carry their level as the first segment:
 * "0.20003" is a county, "1.20003.20041" a municipality, "2.…" a district.
 * An ad matches when its own path and the selected code share a prefix.
 */
const locationIds = (code: string): string[] => code.split('.').slice(1);

function matchesLocation(listing: Listing, codes: string[]): boolean {
  if (codes.length === 0) return true;
  const own = [
    ...locationIds(listing.countyCode),
    ...locationIds(listing.municipalityCode).slice(1),
  ];
  return codes.some((code) => {
    const wanted = locationIds(code);
    const depth = Math.min(wanted.length, own.length);
    for (let i = 0; i < depth; i += 1) {
      if (wanted[i] !== own[i]) return false;
    }
    return true;
  });
}

const normalise = (value: string) => value.toLocaleLowerCase('nb-NO');

function matchesText(listing: Listing, q: string): boolean {
  if (!q) return true;
  const haystack = normalise(
    `${listing.title} ${listing.address} ${listing.agency ?? ''} ${listing.municipality} ${listing.county}`,
  );
  // Every word must appear somewhere, which is how FINN's free-text box behaves.
  return normalise(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function matchesFloor(listing: Listing, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const floor = listing.floor;
  if (floor === null) return false;
  return selected.some((option) => {
    if (option === 'Ikke 1. etasje') return floor !== 1;
    if (option === 'Over 6. etasje') return floor > 6;
    const parsed = Number.parseInt(option, 10);
    return Number.isFinite(parsed) && floor === parsed;
  });
}

const anyOf = (selected: string[], value: string | null): boolean =>
  selected.length === 0 || (value !== null && selected.includes(value));

/** Build one predicate per group so we can re-run the set minus a single group. */
function predicates(query: SearchQuery): Record<string, Predicate> {
  return {
    q: (listing) => matchesText(listing, query.q),

    published: (listing) =>
      !query.published || listing.firstSeen.slice(0, 10) === new Date().toISOString().slice(0, 10),

    location: (listing) => matchesLocation(listing, query.location),

    lifecycle: (listing) => {
      if (query.lifecycle.length === 0) return true;
      return query.lifecycle.some((option) => {
        if (option === 'Solgt siste 3 dager') return listing.status === 'Solgt';
        if (option === 'Kommer for salg') return listing.status === 'Kommer for salg';
        return listing.status === 'Til salgs';
      });
    },

    is_new_property: (listing) => {
      if (query.is_new_property.length === 0) return true;
      return query.is_new_property.some((option) =>
        option === 'Nybygg' ? listing.isNewBuild : !listing.isNewBuild,
      );
    },

    property_type: (listing) => anyOf(query.property_type, listing.propertyType),
    ownership_type: (listing) => anyOf(query.ownership_type, listing.ownership),

    is_private_broker: (listing) => {
      if (query.is_private_broker.length === 0) return true;
      return query.is_private_broker.some((option) =>
        option === 'Privat' ? listing.isPrivate : !listing.isPrivate,
      );
    },

    // FINN treats several facilities as "all of them must apply".
    facilities: (listing) =>
      query.facilities.length === 0 ||
      (listing.facilities !== null &&
        query.facilities.every((wanted) => listing.facilities!.includes(wanted))),

    video_type: (listing) => {
      if (query.video_type.length === 0) return true;
      return query.video_type.some((option) =>
        option === 'Video' ? listing.hasVideo === true : listing.has360 === true,
      );
    },

    viewing: (listing) =>
      query.viewing.length === 0 ||
      (listing.viewingDate !== null && query.viewing.includes(listing.viewingDate)),

    floor_navigator: (listing) => matchesFloor(listing, query.floor_navigator),
    energy_label: (listing) => anyOf(query.energy_label, listing.energyLabel),

    min_bedrooms: (listing) =>
      query.min_bedrooms === null ||
      (listing.bedrooms !== null && listing.bedrooms >= query.min_bedrooms),

    price: (listing) => inRange(listing.price, query.price, listing.priceMax),
    price_collective: (listing) =>
      inRange(listing.totalPrice, query.price_collective, listing.totalPriceMax),
    rent: (listing) => inRange(listing.sharedCost, query.rent),
    area: (listing) => inRange(listing.area, query.area, listing.areaMax),
    construction_year: (listing) => inRange(listing.constructionYear, query.construction_year),
    plot_area: (listing) => inRange(listing.plotArea, query.plot_area),
  };
}

function applyAll(listings: Listing[], checks: Predicate[]): Listing[] {
  return listings.filter((listing) => checks.every((check) => check(listing)));
}

const byNullableNumber = (
  a: number | null,
  b: number | null,
  direction: 1 | -1,
): number => {
  // Ads missing the sort key always sink to the bottom, whichever way we sort.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
};

function sortListings(listings: Listing[], sort: SearchQuery['sort']): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case 'PRICE_ASC':
      return sorted.sort((a, b) => byNullableNumber(a.price, b.price, 1));
    case 'PRICE_DESC':
      return sorted.sort((a, b) => byNullableNumber(a.price, b.price, -1));
    case 'AREA_ASC':
      return sorted.sort((a, b) => byNullableNumber(a.area, b.area, 1));
    case 'AREA_DESC':
      return sorted.sort((a, b) => byNullableNumber(a.area, b.area, -1));
    case 'VIEWING_ASC':
      return sorted.sort((a, b) => {
        if (a.viewingDate === b.viewingDate) return 0;
        if (a.viewingDate === null) return 1;
        if (b.viewingDate === null) return -1;
        return a.viewingDate < b.viewingDate ? -1 : 1;
      });
    default:
      // Newest first, with the ad id as a stable tiebreaker.
      return sorted.sort((a, b) =>
        a.firstSeen === b.firstSeen
          ? Number(b.id) - Number(a.id)
          : a.firstSeen < b.firstSeen
            ? 1
            : -1,
      );
  }
}

export type FacetCounts = Record<string, Record<string, number>>;

export type SearchResult = {
  /** The page of ads to render. */
  page: Listing[];
  /** How many ads matched in total, before pagination. */
  total: number;
  pageNumber: number;
  totalPages: number;
  /**
   * For each filter group, how many ads each option would yield — counted with
   * that group's own selection lifted, which is what makes the numbers move the
   * way FINN's do as you tick boxes.
   */
  facets: FacetCounts;
};

/** Count occurrences of one attribute across a set of ads. */
function tally(listings: Listing[], pick: (listing: Listing) => string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const listing of listings) {
    for (const key of pick(listing)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

const countyId = (listing: Listing) => listing.countyCode;

function facetsFor(listings: Listing[], checks: Record<string, Predicate>): FacetCounts {
  const without = (group: string): Listing[] =>
    applyAll(
      listings,
      Object.entries(checks)
        .filter(([key]) => key !== group)
        .map(([, check]) => check),
    );

  const facets: FacetCounts = {};

  facets.location = tally(without('location'), (l) => [countyId(l), l.municipalityCode]);
  facets.property_type = tally(without('property_type'), (l) =>
    l.propertyType ? [l.propertyType] : [],
  );
  facets.ownership_type = tally(without('ownership_type'), (l) =>
    l.ownership ? [l.ownership] : [],
  );
  facets.lifecycle = tally(without('lifecycle'), (l) => [
    l.status === 'Solgt' ? 'Solgt siste 3 dager' : l.status,
  ]);
  facets.is_new_property = tally(without('is_new_property'), (l) => [
    l.isNewBuild ? 'Nybygg' : 'Brukt bolig',
  ]);
  facets.is_private_broker = tally(without('is_private_broker'), (l) => [
    l.isPrivate ? 'Privat' : 'Megler',
  ]);
  facets.facilities = tally(without('facilities'), (l) => l.facilities ?? []);
  facets.video_type = tally(without('video_type'), (l) => {
    const values: string[] = [];
    if (l.hasVideo) values.push('Video');
    if (l.has360) values.push('360 visning');
    return values;
  });
  facets.viewing = tally(without('viewing'), (l) => (l.viewingDate ? [l.viewingDate] : []));
  facets.energy_label = tally(without('energy_label'), (l) =>
    l.energyLabel ? [l.energyLabel] : [],
  );
  facets.floor_navigator = tally(without('floor_navigator'), (l) => {
    if (l.floor === null) return [];
    const values = [l.floor > 6 ? 'Over 6. etasje' : `${l.floor}. etasje`];
    if (l.floor !== 1) values.push('Ikke 1. etasje');
    return values;
  });

  const today = new Date().toISOString().slice(0, 10);
  facets.published = tally(without('published'), (l) =>
    l.firstSeen.slice(0, 10) === today ? ['Nye i dag'] : [],
  );

  return facets;
}

export function search(listings: Listing[], query: SearchQuery): SearchResult {
  const checks = predicates(query);
  const matched = applyAll(listings, Object.values(checks));
  const sorted = sortListings(matched, query.sort);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageNumber = Math.min(query.page, totalPages);
  const start = (pageNumber - 1) * PAGE_SIZE;

  return {
    page: sorted.slice(start, start + PAGE_SIZE),
    total: sorted.length,
    pageNumber,
    totalPages,
    facets: facetsFor(listings, checks),
  };
}

export { MULTI_KEYS, RANGE_KEYS };
export type { MultiKey, RangeKey };
