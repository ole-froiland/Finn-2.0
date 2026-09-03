/**
 * Turns a finn.no real-estate search page into structured listings.
 *
 * FINN renders results server-side, so every field we need is present in the
 * markup. We match on the stable, semantic hooks FINN puts on its cards
 * (`sf-search-ad`, `sf-realestate-location`, the `finnkode` link) rather than
 * on utility classes, which churn between deploys.
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

const stripTags = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** "12 301 090 kr" and "1 234,5" alike collapse to a plain number. */
function toNumber(text) {
  if (text === null || text === undefined) return null;
  const digits = String(text).replace(/,\d+$/, '').replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

/** Digits, ordinary spaces and the two non-breaking spaces FINN mixes in. */
const NUM = '[\\d\\s\\u00a0\\u202f]';

/**
 * Reads "51 m²" as [51, null], and a new-build project's
 * "3 490 000 - 7 490 000 kr" as [3490000, 7490000].
 */
function parseSpan(text, unit) {
  const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const span = text.match(new RegExp(`(${NUM}+)-(${NUM}+)\\s*${escaped}`));
  if (span) return [toNumber(span[1]), toNumber(span[2])];
  const single = text.match(new RegExp(`(${NUM}+)\\s*${escaped}`));
  return [single ? toNumber(single[1]) : null, null];
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, mai: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, des: 11,
};

/**
 * "Visning - 15. sep. kl. 16:15" carries no year, so we resolve it against the
 * harvest date and roll forward when the month has already passed.
 */
export function parseViewingDate(text, now = new Date()) {
  if (!text) return null;
  const match = text.match(/(\d{1,2})\.\s*([a-zæøå]{3})/i);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) return null;

  const day = Number(match[1]);
  let year = now.getUTCFullYear();
  // A date more than six months behind us is almost certainly next year's.
  if (Date.UTC(year, month, day) < now.getTime() - 182 * 24 * 3600 * 1000) year += 1;

  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** The total FINN itself reports: "41 163 treff i 26 883 annonser". */
export function parseTotals(html) {
  const text = stripTags(html.replace(/<script.*?<\/script>/gs, ''));
  const match = text.match(new RegExp(`(${NUM}+)treff i(${NUM}+)annonser`));
  if (!match) return { hits: null, ads: null };
  return { hits: toNumber(match[1]), ads: toNumber(match[2]) };
}

const first = (text, pattern) => {
  const match = text.match(pattern);
  return match ? match[1] : null;
};

const OWNERSHIPS = ['Selveier', 'Andel', 'Aksje', 'Obligasjon', 'Annet'];
const TYPES = [
  'Leilighet', 'Enebolig', 'Tomannsbolig', 'Rekkehus',
  'Gårdsbruk/Småbruk', 'Garasje/Parkering', 'Andre',
];

function parseCard(article, context) {
  const id = first(article, /finnkode=(\d+)/);
  if (!id) return null;

  const heading = article.match(
    /<a[^>]*class="[^"]*sf-search-ad-link[^"]*"[^>]*>([\s\S]*?)<\/a>/,
  );
  const title = heading ? stripTags(heading[1]) : '';
  if (!title) return null;

  const address = stripTags(first(article, /sf-realestate-location[^>]*>([\s\S]*?)<\/div>/) ?? '');
  const image = first(article, /<img[^>]+alt="Bilde[^"]*"[^>]+src="([^"]+)"/);
  const agencyLogo = first(article, /<img[^>]+alt="Megler logo"[^>]+src="([^"]+)"/);
  const accent = first(article, /border-color:\s*(#[0-9a-fA-F]{3,8})/);

  // The bold row holds size and asking price: "51 m²" then "950 000 kr".
  const boldText = stripTags(first(article, /font-bold"[^>]*>([\s\S]*?)<\/div>/) ?? '');
  const [area, areaMax] = parseSpan(boldText, 'm²');
  const [price, priceMax] = parseSpan(boldText, 'kr');

  // The subtle line below: totals, shared cost, ownership, type, bedrooms.
  const facts = stripTags(
    first(article, /text-xs s-text-subtle flex flex-col[^"]*"[^>]*>([\s\S]*?)<\/div>/) ?? '',
  );
  const totalRaw = first(facts, new RegExp(`Totalpris:\\s*(${NUM}+(?:-${NUM}+)?)\\s*kr`));
  const [totalPrice, totalPriceMax] = totalRaw ? parseSpan(`${totalRaw} kr`, 'kr') : [null, null];
  const sharedCost = toNumber(first(facts, new RegExp(`Fellesutg\\.?:\\s*(${NUM}+)\\s*kr`)));
  const bedrooms = toNumber(first(facts, /(\d+)\s*soverom/));

  // The rounded pill on the right carries the viewing, when there is one.
  const pills = [...article.matchAll(/rounded-full[^>]*>([^<]{2,60})<\/span>/g)]
    .map((match) => decode(match[1]).trim());
  const viewing = pills.find((pill) => pill.startsWith('Visning')) ?? null;

  const cardText = stripTags(article);
  const status = /\bSolgt\b/.test(cardText)
    ? 'Solgt'
    : /Kommer for salg/.test(cardText)
      ? 'Kommer for salg'
      : 'Til salgs';

  return {
    id,
    title,
    url: `https://www.finn.no/realestate/homes/ad.html?finnkode=${id}`,
    image,
    agency:
      stripTags(
        first(article, /<span class="text-xs s-text-subtle whitespace-normal">([\s\S]*?)<\/span>/) ?? '',
      ) || null,
    agencyLogo,
    accent,
    address,
    area,
    areaMax,
    price,
    priceMax,
    totalPrice,
    totalPriceMax,
    sharedCost,
    ownership: OWNERSHIPS.find((value) => facts.includes(value)) ?? null,
    propertyType: TYPES.find((value) => facts.includes(value)) ?? null,
    bedrooms,
    viewing,
    viewingDate: parseViewingDate(viewing, context.now),
    countyCode: context.countyCode,
    county: context.county,
    municipalityCode: context.municipalityCode,
    municipality: context.municipality,
    status,
    // A project quotes a span of prices rather than one figure.
    isNewBuild: priceMax !== null || totalPriceMax !== null || /Nybygg/i.test(cardText),
    isPrivate: !agencyLogo,
    firstSeen: context.now.toISOString(),
    energyLabel: null,
    facilities: null,
    floor: null,
    constructionYear: null,
    plotArea: null,
    hasVideo: null,
    has360: null,
  };
}

export function parseSearchPage(html, context) {
  const articles = html.match(/<article class="[^"]*sf-search-ad[^"]*"[\s\S]*?<\/article>/g) ?? [];
  const listings = [];
  for (const article of articles) {
    const listing = parseCard(article, context);
    if (listing) listings.push(listing);
  }
  return { listings, totals: parseTotals(html) };
}
