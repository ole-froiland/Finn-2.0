#!/usr/bin/env node
/**
 * Rebuilds data/locations.json — FINN's own place hierarchy.
 *
 * FINN ships the whole tree inside the search page's React payload as
 * `"Name","LEVEL.code…"` pairs, where the leading digit is the depth: 0 is a
 * county, 1 a municipality, 2 a district. Reading it from there means our area
 * filter uses FINN's exact codes, so a scrape of `location=1.20003.20041`
 * returns precisely the ads FINN files under Ås.
 *
 * The tree only shifts when Norway reorganises its municipalities, so this is
 * a once-in-a-while job rather than part of the nightly refresh.
 *
 * Usage: node scripts/scrape-locations.mjs
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { get } from './lib/http.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEARCH = 'https://www.finn.no/realestate/homes/search.html';

const html = await get(SEARCH);
if (!html) {
  process.stderr.write('Fikk ikke hentet søkesiden fra FINN.\n');
  process.exit(1);
}

// Pairs look like \"Ås\",\"1.20003.20041\",304 inside the escaped RSC payload.
const pattern = /\\"((?:[^\\"]|\\\\.)+?)\\",\\"([0-9](?:\.\d+)+)\\"(?:,(\d+))?/g;

const nodes = new Map();
for (const match of html.matchAll(pattern)) {
  const code = match[2];
  if (nodes.has(code)) continue;
  nodes.set(code, {
    name: match[1].replace(/\\\\/g, '\\'),
    code,
    count: match[3] ? Number(match[3]) : 0,
  });
}

const ids = (code) => code.split('.').slice(1);
const at = (level) => [...nodes.values()].filter((node) => node.code.startsWith(`${level}.`));
const byName = (a, b) => a.name.localeCompare(b.name, 'nb');

const tree = at(0)
  .sort(byName)
  .map((county) => ({
    ...county,
    children: at(1)
      .filter((municipality) => ids(municipality.code)[0] === ids(county.code)[0])
      .sort(byName)
      .map((municipality) => {
        const districts = at(2)
          .filter((district) => {
            const path = ids(district.code);
            return path[0] === ids(municipality.code)[0] && path[1] === ids(municipality.code)[1];
          })
          .sort(byName);
        return districts.length > 0 ? { ...municipality, children: districts } : municipality;
      }),
  }));

if (tree.length === 0) {
  process.stderr.write('Fant ingen fylker — FINN har trolig endret sideformatet.\n');
  process.exit(1);
}

writeFileSync(join(ROOT, 'data', 'locations.json'), `${JSON.stringify(tree, null, 1)}\n`);

const municipalities = tree.reduce((sum, county) => sum + (county.children?.length ?? 0), 0);
process.stdout.write(
  `Skrev data/locations.json: ${tree.length} fylker, ${municipalities} kommuner.\n`,
);
