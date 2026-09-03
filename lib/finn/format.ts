const nb = new Intl.NumberFormat('nb-NO');

export const formatNumber = (value: number) => nb.format(value);

/** "4 500 000 kr" — FINN always spells out the unit rather than using a symbol. */
export const formatPrice = (value: number | null) =>
  value === null ? 'Prisantydning mangler' : `${nb.format(value)} kr`;

export const formatArea = (value: number | null) =>
  value === null ? '—' : `${nb.format(value)} m²`;

const MONTHS_SHORT = [
  'jan.', 'feb.', 'mar.', 'apr.', 'mai', 'jun.',
  'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'des.',
];

const WEEKDAYS = [
  'søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag',
];

/** "torsdag 03. september" — the label FINN uses in its Visningsdato facet. */
export function viewingFacetLabel(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const monthsLong = [
    'januar', 'februar', 'mars', 'april', 'mai', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'desember',
  ];
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${WEEKDAYS[date.getUTCDay()]} ${day}. ${monthsLong[date.getUTCMonth()]}`;
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${day}. ${month} ${date.getFullYear()} kl. ${time}`;
}

/**
 * FINN's cards come from a CDN that resizes on the fly, so we can ask for the
 * width we actually render instead of always pulling the 480px variant.
 */
export function finnImage(url: string | null, width: number): string | null {
  if (!url) return null;
  return url.replace(/\/dynamic\/\d+w\//, `/dynamic/${width}w/`);
}
