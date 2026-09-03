/**
 * FINN's own filter vocabulary for "Bolig til salgs", in FINN's own order.
 * Group keys are the query-parameter names FINN uses, so URLs read the same way.
 */

export const PROPERTY_TYPES = [
  'Leilighet',
  'Enebolig',
  'Tomannsbolig',
  'Rekkehus',
  'Gårdsbruk/Småbruk',
  'Garasje/Parkering',
  'Andre',
] as const;

export const OWNERSHIP_TYPES = [
  'Aksje',
  'Andel',
  'Obligasjon',
  'Selveier',
  'Annet',
] as const;

export const LIFECYCLES = [
  'Til salgs',
  'Solgt siste 3 dager',
  'Kommer for salg',
] as const;

export const CONDITIONS = ['Brukt bolig', 'Nybygg'] as const;

export const SELLER_TYPES = ['Megler', 'Privat'] as const;

export const FACILITIES = [
  'Aircondition',
  'Alarm',
  'Balkong/Terrasse',
  'Bredbåndstilknytning',
  'Fellesvaskeri',
  'Garasje/P-plass',
  'Heis',
  'Ingen gjenboere',
  'Lademulighet',
  'Moderne',
  'Peis/Ildsted',
  'Strandlinje',
  'Turterreng',
  'Utsikt',
  'Vaktmester-/vektertjeneste',
] as const;

export const VIDEO_TYPES = ['Video', '360 visning'] as const;

export const FLOORS = [
  'Ikke 1. etasje',
  '1. etasje',
  '2. etasje',
  '3. etasje',
  '4. etasje',
  '5. etasje',
  '6. etasje',
  'Over 6. etasje',
] as const;

export const ENERGY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

/**
 * FINN's own sort options, with FINN's own values, in FINN's own order.
 * "Nærmest" is left out: it needs a reference point we do not ask for.
 */
export const SORT_OPTIONS = [
  { value: 'AREA_PROM_DESC', label: 'Areal høy-lav' },
  { value: 'AREA_PROM_ASC', label: 'Areal lav-høy' },
  { value: 'PRICE_SQM_DESC', label: 'Kvmeterpris høy-lav' },
  { value: 'PRICE_SQM_ASC', label: 'Kvmeterpris lav-høy' },
  { value: 'RELEVANCE', label: 'Mest relevant' },
  { value: 'PRICE_ASKING_DESC', label: 'Prisant høy-lav' },
  { value: 'PRICE_ASKING_ASC', label: 'Prisant lav-høy' },
  { value: 'PUBLISHED_DESC', label: 'Publisert' },
  { value: 'PRICE_DESC', label: 'Tot pris høy-lav' },
  { value: 'PRICE_ASC', label: 'Tot pris lav-høy' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const PAGE_SIZE = 50;

/**
 * Which of FINN's filters need data that only lives on the ad detail page.
 * The UI marks these so it is clear when a filter can only match enriched ads.
 */
export const DETAIL_ONLY_FILTERS = new Set([
  'facilities',
  'video_type',
  'floor_navigator',
  'energy_label',
  'construction_year',
  'plot_area',
]);
