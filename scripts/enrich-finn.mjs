#!/usr/bin/env node
/**
 * Fills in the fields that only exist on a FINN ad's own page — energy label,
 * facilities, floor, construction year and plot size — for ads already in
 * data/listings.json.
 *
 * The search result cards do not carry these, so the filters that depend on
 * them stay empty until this has run. It is incremental and resumable: ads
 * that already have an energy label are skipped, so a nightly job with a
 * modest --limit fills the catalogue in over a few days and thereafter only
 * has to cover newly published ads.
 *
 * Usage:
 *   node scripts/enrich-finn.mjs --limit=500
 *   node scripts/enrich-finn.mjs --limit=20 --verbose   # check the parser
 *   node scripts/enrich-finn.mjs --refresh              # redo enriched ads too
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { get, pool, sleep } from './lib/http.mjs';
import { parseAdPage } from './lib/parse-ad.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

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
    limit: Number(flags.get('limit') ?? 500),
    concurrency: Number(flags.get('concurrency') ?? 3),
    delay: Number(flags.get('delay') ?? 350),
    refresh: flags.get('refresh') === 'true',
    verbose: flags.get('verbose') === 'true',
  };
}

const log = (message) => process.stdout.write(`${message}\n`);

async function main() {
  const config = options(process.argv.slice(2));

  const listings = JSON.parse(readFileSync(join(DATA, 'listings.json'), 'utf8'));
  const meta = JSON.parse(readFileSync(join(DATA, 'meta.json'), 'utf8'));

  // Newest ads first: those are the ones a visitor is most likely to filter on.
  const pending = listings
    .filter((listing) => config.refresh || listing.energyLabel === null)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, config.limit);

  log(`Beriker ${pending.length} av ${listings.length} annonser.`);

  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  let done = 0;
  let failed = 0;

  await pool(pending, config.concurrency, async (listing) => {
    try {
      const html = await get(listing.url);
      if (!html) {
        failed += 1;
        return;
      }
      const details = parseAdPage(html);
      Object.assign(byId.get(listing.id), details);
      done += 1;
      if (config.verbose) log(`  ${listing.id} → ${JSON.stringify(details)}`);
      else if (done % 25 === 0) log(`  ${done}/${pending.length}`);
      await sleep(config.delay);
    } catch (error) {
      failed += 1;
      log(`  ! ${listing.id}: ${error.message}`);
    }
  });

  const enriched = [...byId.values()];
  meta.enriched = enriched.filter((listing) => listing.energyLabel !== null).length;

  writeFileSync(join(DATA, 'listings.json'), JSON.stringify(enriched));
  writeFileSync(join(DATA, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

  log(`\nFerdig: ${done} beriket, ${failed} feilet. Totalt beriket: ${meta.enriched}.`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
