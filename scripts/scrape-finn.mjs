#!/usr/bin/env node
/**
 * Harvests "Bolig til salgs" from finn.no into data/listings.json.
 *
 * FINN caps any single search at roughly fifty pages, so the catalogue is
 * walked one municipality at a time using FINN's own location codes. That
 * stays under the cap and, as a bonus, tells us which county and municipality
 * every ad belongs to — which the result cards themselves never say.
 *
 * Usage:
 *   node scripts/scrape-finn.mjs                       # everything
 *   node scripts/scrape-finn.mjs --county=Oslo         # one county
 *   node scripts/scrape-finn.mjs --max-municipalities=25
 *   node scripts/scrape-finn.mjs --concurrency=3 --delay=400
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { get, pool, sleep } from './lib/http.mjs';
import { parseSearchPage } from './lib/parse-finn.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SEARCH = 'https://www.finn.no/realestate/homes/search.html';

// FINN stops paginating here; the per-municipality walk keeps us well clear.
const MAX_PAGES = 50;

function options(argv) {
  const flags = new Map(
    argv
      .filter((arg) => arg.startsWith('--'))
      .map((arg) => {
        const [key, value = 'true'] = arg.slice(2).split('=');
        return [key, value];
      }),
  );
  return {
    county: flags.get('county') ?? null,
    maxMunicipalities: Number(flags.get('max-municipalities') ?? Infinity),
    concurrency: Number(flags.get('concurrency') ?? 4),
    delay: Number(flags.get('delay') ?? 250),
    dryRun: flags.get('dry-run') === 'true',
  };
}

const log = (message) => process.stdout.write(`${message}\n`);

/** Every municipality, carrying its county along for the ride. */
function municipalities(locations, countyFilter) {
  const targets = [];
  for (const county of locations) {
    if (countyFilter && county.name.toLowerCase() !== countyFilter.toLowerCase()) continue;
    for (const municipality of county.children ?? []) {
      targets.push({
        countyCode: county.code,
        county: county.name,
        municipalityCode: municipality.code,
        municipality: municipality.name,
        expected: municipality.count,
      });
    }
  }
  // Busiest first, so a run cut short still covers the bulk of the market.
  return targets.sort((a, b) => b.expected - a.expected);
}

async function harvestMunicipality(target, now, delay) {
  const found = new Map();
  let reported = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      `${SEARCH}?location=${encodeURIComponent(target.municipalityCode)}` +
      `&sort=PUBLISHED_DESC${page > 1 ? `&page=${page}` : ''}`;

    const html = await get(url);
    if (!html) break;

    const { listings, totals } = parseSearchPage(html, { ...target, now });
    if (reported === null) reported = totals.ads;

    let fresh = 0;
    for (const listing of listings) {
      if (!found.has(listing.id)) {
        found.set(listing.id, listing);
        fresh += 1;
      }
    }

    // A page that adds nothing new means we have wrapped around the end.
    if (listings.length === 0 || fresh === 0) break;
    if (reported !== null && found.size >= reported) break;

    await sleep(delay);
  }

  return { listings: [...found.values()], reported };
}

async function main() {
  const config = options(process.argv.slice(2));
  const now = new Date();

  const locations = JSON.parse(readFileSync(join(DATA, 'locations.json'), 'utf8'));
  const targets = municipalities(locations, config.county).slice(
    0,
    Number.isFinite(config.maxMunicipalities) ? config.maxMunicipalities : undefined,
  );

  log(`Henter ${targets.length} kommuner (${config.concurrency} parallelle, ${config.delay} ms pause)`);

  // Keep the date we first saw each ad, so "Nye i dag" stays meaningful.
  let previous = [];
  try {
    previous = JSON.parse(readFileSync(join(DATA, 'listings.json'), 'utf8'));
  } catch {
    log('Ingen tidligere datasett — starter fra tomt.');
  }
  const before = new Map(previous.map((listing) => [listing.id, listing]));

  const collected = new Map();
  let done = 0;
  let failures = 0;

  await pool(targets, config.concurrency, async (target) => {
    try {
      const { listings } = await harvestMunicipality(target, now, config.delay);
      for (const listing of listings) {
        const seen = before.get(listing.id);
        collected.set(listing.id, {
          ...listing,
          // Carry forward both the first-seen date and any enrichment we have.
          firstSeen: seen?.firstSeen ?? listing.firstSeen,
          energyLabel: seen?.energyLabel ?? null,
          facilities: seen?.facilities ?? null,
          floor: seen?.floor ?? null,
          constructionYear: seen?.constructionYear ?? null,
          plotArea: seen?.plotArea ?? null,
          hasVideo: seen?.hasVideo ?? null,
          has360: seen?.has360 ?? null,
        });
      }
      done += 1;
      log(
        `  [${String(done).padStart(3)}/${targets.length}] ${target.county} › ${target.municipality}: ` +
          `${listings.length} annonser (totalt ${collected.size})`,
      );
    } catch (error) {
      failures += 1;
      log(`  ! ${target.county} › ${target.municipality}: ${error.message}`);
    }
  });

  const listings = [...collected.values()];
  log(`\nFerdig: ${listings.length} annonser fra ${done} kommuner, ${failures} feilet.`);

  if (config.dryRun) {
    log('--dry-run: skriver ingen filer.');
    return;
  }

  const meta = {
    updatedAt: now.toISOString(),
    total: listings.length,
    finnReportedTotal: targets.reduce((sum, target) => sum + target.expected, 0),
    enriched: listings.filter((listing) => listing.energyLabel !== null).length,
    source: 'finn.no/realestate/homes',
  };

  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, 'listings.json'), JSON.stringify(listings));
  writeFileSync(join(DATA, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  log(`Skrev data/listings.json (${(JSON.stringify(listings).length / 1e6).toFixed(1)} MB)`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
