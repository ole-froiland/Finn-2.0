import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Dataset, Listing, LocationNode } from './types';

const DATA_DIR = join(process.cwd(), 'data');

/**
 * The dataset is a few megabytes, so it is read once per server instance and
 * kept in module scope rather than re-parsed on every request.
 */
let cached: Dataset | null = null;
let cachedLocations: LocationNode[] | null = null;

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as T;
  } catch {
    // A missing dataset should degrade to an empty site, never a failed build.
    return fallback;
  }
}

export function getDataset(): Dataset {
  if (cached) return cached;

  const listings = readJson<Listing[]>('listings.json', []);
  const meta = readJson<Dataset['meta']>('meta.json', {
    updatedAt: new Date(0).toISOString(),
    total: listings.length,
    finnReportedTotal: null,
    enriched: 0,
    source: 'finn.no',
  });

  cached = { listings, meta: { ...meta, total: listings.length } };
  return cached;
}

export function getLocations(): LocationNode[] {
  cachedLocations ??= readJson<LocationNode[]>('locations.json', []);
  return cachedLocations;
}

export function getListing(id: string): Listing | undefined {
  return getDataset().listings.find((listing) => listing.id === id);
}

/** Flat lookup from a FINN location code to its display name. */
export function locationNames(): Map<string, string> {
  const names = new Map<string, string>();
  const walk = (nodes: LocationNode[]) => {
    for (const node of nodes) {
      names.set(node.code, node.name);
      if (node.children) walk(node.children);
    }
  };
  walk(getLocations());
  return names;
}
