#!/usr/bin/env node
/**
 * Checks the filter engine against expectations computed independently from
 * data/listings.json, by asking the running site and comparing hit counts.
 *
 * Start the dev server first, then: node scripts/verify-search.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const listings = JSON.parse(readFileSync(join(ROOT, 'data', 'listings.json'), 'utf8'));
const origin = process.env.SITE_ORIGIN ?? 'http://localhost:3000';
const base = `${origin}/realestate/homes/search`;

const county = (code) => listings.filter((l) => l.countyCode === code).length;

/** Each case states the query string and works out the answer the long way. */
const cases = [
  ['', listings.length],
  ['location=0.20061', county('0.20061')],
  ['property_type=Leilighet', listings.filter((l) => l.propertyType === 'Leilighet').length],
  ['ownership_type=Andel', listings.filter((l) => l.ownership === 'Andel').length],
  ['price_to=3000000', listings.filter((l) => l.price !== null && l.price <= 3_000_000).length],
  [
    'price_from=3000000&price_to=5000000',
    listings.filter(
      (l) => l.price !== null && (l.priceMax ?? l.price) >= 3_000_000 && l.price <= 5_000_000,
    ).length,
  ],
  ['min_bedrooms=3', listings.filter((l) => l.bedrooms !== null && l.bedrooms >= 3).length],
  ['area_from=100', listings.filter((l) => l.area !== null && (l.areaMax ?? l.area) >= 100).length],
  ['is_new_property=Nybygg', listings.filter((l) => l.isNewBuild).length],
  [
    'location=0.20061&property_type=Leilighet',
    listings.filter((l) => l.countyCode === '0.20061' && l.propertyType === 'Leilighet').length,
  ],
];

let pass = 0;
let fail = 0;

for (const [query, want] of cases) {
  const html = await (await fetch(`${base}${query ? `?${query}` : ''}`)).text();
  const match = html.match(/class="results__count"[\s\S]*?<strong>([\d\s ]+)<\/strong>/);
  const got = match ? Number(match[1].replace(/\D/g, '')) : Number.NaN;
  const ok = got === want;
  ok ? (pass += 1) : (fail += 1);
  process.stdout.write(
    `${ok ? 'PASS' : 'FAIL'}  ${(query || '(ingen filtre)').padEnd(50)} vil ${want}, fikk ${got}\n`,
  );
}

process.stdout.write(`\n${pass} bestått, ${fail} feilet\n`);
process.exit(fail ? 1 : 0);
