import { PAGE_SIZE, SORT_OPTIONS, type SortValue } from './taxonomy';

export type Range = { from: number | null; to: number | null };

/**
 * One search, expressed with FINN's own query-parameter names so that a URL
 * from our site reads the same way one from finn.no does.
 */
export type SearchQuery = {
  q: string;
  published: boolean;
  location: string[];
  lifecycle: string[];
  is_new_property: string[];
  price: Range;
  price_collective: Range;
  rent: Range;
  area: Range;
  min_bedrooms: number | null;
  construction_year: Range;
  property_type: string[];
  ownership_type: string[];
  is_private_broker: string[];
  facilities: string[];
  video_type: string[];
  viewing: string[];
  floor_navigator: string[];
  energy_label: string[];
  plot_area: Range;
  sort: SortValue;
  page: number;
  /** Results as a map rather than a list. */
  map: boolean;
};

export const MULTI_KEYS = [
  'location',
  'lifecycle',
  'is_new_property',
  'property_type',
  'ownership_type',
  'is_private_broker',
  'facilities',
  'video_type',
  'viewing',
  'floor_navigator',
  'energy_label',
] as const;

export type MultiKey = (typeof MULTI_KEYS)[number];

export const RANGE_KEYS = [
  'price',
  'price_collective',
  'rent',
  'area',
  'construction_year',
  'plot_area',
] as const;

export type RangeKey = (typeof RANGE_KEYS)[number];

const EMPTY_RANGE: Range = { from: null, to: null };

export const EMPTY_QUERY: SearchQuery = {
  q: '',
  published: false,
  location: [],
  lifecycle: [],
  is_new_property: [],
  price: EMPTY_RANGE,
  price_collective: EMPTY_RANGE,
  rent: EMPTY_RANGE,
  area: EMPTY_RANGE,
  min_bedrooms: null,
  construction_year: EMPTY_RANGE,
  property_type: [],
  ownership_type: [],
  is_private_broker: [],
  facilities: [],
  video_type: [],
  viewing: [],
  floor_navigator: [],
  energy_label: [],
  plot_area: EMPTY_RANGE,
  sort: 'PUBLISHED_DESC',
  page: 1,
  map: false,
};

/** Next hands route params in as string | string[] | undefined. */
export type RawParams = Record<string, string | string[] | undefined>;

const list = (value: string | string[] | undefined): string[] => {
  if (value === undefined) return [];
  const all = Array.isArray(value) ? value : [value];
  // A single param may itself carry several comma-separated values.
  return all.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
};

const int = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === '') return null;
  const digits = Number(raw.replace(/[^\d-]/g, ''));
  return Number.isFinite(digits) ? digits : null;
};

const range = (params: RawParams, key: string): Range => ({
  from: int(params[`${key}_from`]),
  to: int(params[`${key}_to`]),
});

export function parseSearchQuery(params: RawParams): SearchQuery {
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = SORT_OPTIONS.some((option) => option.value === sortRaw)
    ? (sortRaw as SortValue)
    : 'PUBLISHED_DESC';

  const query: SearchQuery = {
    ...EMPTY_QUERY,
    q: (Array.isArray(params.q) ? params.q[0] : params.q ?? '').trim(),
    published: list(params.published).length > 0,
    min_bedrooms: int(params.min_bedrooms),
    sort,
    page: Math.max(1, int(params.page) ?? 1),
    map: list(params.map).length > 0,
  };

  for (const key of MULTI_KEYS) query[key] = list(params[key]);
  for (const key of RANGE_KEYS) query[key] = range(params, key);

  return query;
}

/** Serialise back to a URL, dropping everything left at its default. */
export function toSearchParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.published) params.set('published', '1');

  for (const key of MULTI_KEYS) {
    for (const value of query[key]) params.append(key, value);
  }
  for (const key of RANGE_KEYS) {
    const { from, to } = query[key];
    if (from !== null) params.set(`${key}_from`, String(from));
    if (to !== null) params.set(`${key}_to`, String(to));
  }
  if (query.min_bedrooms !== null) params.set('min_bedrooms', String(query.min_bedrooms));
  if (query.sort !== 'PUBLISHED_DESC') params.set('sort', query.sort);
  if (query.map) params.set('map', '1');
  if (query.page > 1) params.set('page', String(query.page));
  return params;
}

/** The search *is* the site, so it lives at the root. */
export function searchHref(query: SearchQuery): string {
  const qs = toSearchParams(query).toString();
  return qs ? `/?${qs}` : '/';
}

/** Toggle one value in a multi-select group, always returning to page 1. */
export function toggleValue(query: SearchQuery, key: MultiKey, value: string): SearchQuery {
  const current = query[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...query, [key]: next, page: 1 };
}

export function countActiveFilters(query: SearchQuery): number {
  let total = 0;
  if (query.q) total += 1;
  if (query.published) total += 1;
  if (query.min_bedrooms !== null) total += 1;
  for (const key of MULTI_KEYS) total += query[key].length;
  for (const key of RANGE_KEYS) {
    if (query[key].from !== null) total += 1;
    if (query[key].to !== null) total += 1;
  }
  return total;
}

export const pageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));
