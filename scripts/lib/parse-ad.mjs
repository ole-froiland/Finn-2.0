/**
 * Pulls the key facts out of a FINN ad page.
 *
 * NOTE: unlike parse-finn.mjs, this one was written without a saved ad page to
 * check against, so treat it as a first cut. It deliberately works off the
 * Norwegian *labels* FINN prints ("Byggeår", "Energimerking", "Tomteareal")
 * rather than off class names or DOM structure, because labels are what FINN
 * is least likely to change and what survives a redesign. Run
 * `node scripts/enrich-finn.mjs --limit=20 --verbose` and eyeball the output
 * against the live ads before trusting a full pass.
 */

const decode = (text) =>
  text
    .replace(/<!--.*?-->/gs, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

/**
 * Whole page as flat text, with a marker where each tag was, so that a label
 * and its value stay separable but the text between them does not run together.
 */
const flatten = (html) =>
  decode(
    html
      .replace(/<script.*?<\/script>/gs, ' ')
      .replace(/<style.*?<\/style>/gs, ' ')
      .replace(/<[^>]+>/g, '\u0001'),
  )
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/\u0001[\s\u0001]*/g, '\u0001');

const NUM = '[\\d\\s\\u00a0\\u202f]';

function toNumber(text) {
  if (!text) return null;
  const digits = String(text).replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

/** Value printed straight after a label, whether in a table cell or a <dl>. */
function labelled(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escaped}\\u0001{0,3}\\s*([^\\u0001]{1,60})`, 'i'));
  return match ? match[1].trim() : null;
}

const FACILITIES = [
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
];

/** FINN prints some facilities under wordier names than its facet uses. */
const FACILITY_ALIASES = {
  'Balkong/Terrasse': ['Balkong', 'Terrasse'],
  'Garasje/P-plass': ['Garasje', 'Parkering', 'P-plass'],
  'Peis/Ildsted': ['Peis', 'Ildsted'],
  'Vaktmester-/vektertjeneste': ['Vaktmester', 'Vektertjeneste'],
};

export function parseAdPage(html) {
  const text = flatten(html);

  // "Energimerking" is followed by a grade and a colour, e.g. "C - Oransje".
  const energyRaw = labelled(text, 'Energimerking') ?? labelled(text, 'Energikarakter');
  const energyMatch = energyRaw?.match(/\b([A-G])\b/);

  const floorRaw = labelled(text, 'Etasje');
  const constructionRaw = labelled(text, 'Byggeår');
  const plotRaw = labelled(text, 'Tomteareal') ?? labelled(text, 'Tomt');

  const facilitiesSection = text.match(/Fasiliteter([\s\S]{0,900})/i)?.[1] ?? '';
  const facilities = FACILITIES.filter((facility) => {
    const names = [facility, ...(FACILITY_ALIASES[facility] ?? [])];
    return names.some((name) => facilitiesSection.includes(name));
  });

  return {
    energyLabel: energyMatch ? energyMatch[1] : null,
    floor: toNumber(floorRaw?.match(/^\d+/)?.[0] ?? null),
    constructionYear: (() => {
      const year = toNumber(constructionRaw?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[0] ?? null);
      return year && year >= 1500 && year <= new Date().getFullYear() + 5 ? year : null;
    })(),
    plotArea: toNumber(plotRaw?.match(new RegExp(`${NUM}+`))?.[0] ?? null),
    facilities: facilities.length > 0 ? facilities : null,
    hasVideo: /\bVideo\b/i.test(text) ? true : false,
    has360: /360[\s-]?(visning|graders)/i.test(text) ? true : false,
  };
}
