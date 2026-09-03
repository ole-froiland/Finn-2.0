#!/usr/bin/env node
/**
 * Seeds data/listings.json from a saved finn.no search page.
 *
 * This exists so the site has real ads to render before the full harvest has
 * run. A national search page does not say which municipality an ad belongs
 * to, so the location is inferred from the address — good enough to populate
 * the area filter, but `scrape-finn.mjs` is what produces authoritative data,
 * because it walks one municipality at a time and therefore always knows.
 *
 * Usage: node scripts/seed-from-html.mjs <saved-page.html> [more.html …]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseSearchPage } from './lib/parse-finn.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

const locations = JSON.parse(readFileSync(join(DATA, 'locations.json'), 'utf8'));

/** Place name → location, preferring the most specific match available. */
const places = new Map();
for (const county of locations) {
  for (const municipality of county.children ?? []) {
    for (const area of municipality.children ?? []) {
      places.set(area.name.toLowerCase(), {
        countyCode: county.code,
        county: county.name,
        municipalityCode: municipality.code,
        municipality: municipality.name,
      });
    }
    places.set(municipality.name.toLowerCase(), {
      countyCode: county.code,
      county: county.name,
      municipalityCode: municipality.code,
      municipality: municipality.name,
    });
  }
  // Fall back to the county itself, which covers "…, Oslo".
  places.set(county.name.toLowerCase(), {
    countyCode: county.code,
    county: county.name,
    municipalityCode: '',
    municipality: '',
  });
}

const files = process.argv.slice(2);
if (files.length === 0) {
  process.stderr.write('Bruk: node scripts/seed-from-html.mjs <fil.html> …\n');
  process.exit(1);
}

const now = new Date();
const collected = new Map();
let unplaced = 0;

for (const file of files) {
  const { listings } = parseSearchPage(readFileSync(file, 'utf8'), {
    now,
    countyCode: '',
    county: '',
    municipalityCode: '',
    municipality: '',
  });

  for (const listing of listings) {
    const place = (listing.address.split(',').pop() ?? '').trim().toLowerCase();
    const match = places.get(place);
    if (!match) {
      unplaced += 1;
      continue;
    }
    collected.set(listing.id, { ...listing, ...match });
  }
}

const listings = [...collected.values()];
const meta = {
  updatedAt: now.toISOString(),
  total: listings.length,
  finnReportedTotal: null,
  enriched: 0,
  source: 'finn.no/realestate/homes (seed)',
};

writeFileSync(join(DATA, 'listings.json'), JSON.stringify(listings));
writeFileSync(join(DATA, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
process.stdout.write(
  `Skrev ${listings.length} annonser til data/listings.json (${unplaced} uten stedstreff).\n`,
);
