'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, BellRing, Trash2 } from 'lucide-react';

import { countActiveFilters, type SearchQuery } from '@/lib/finn/params';

const STORAGE_KEY = 'hjemly:saved-searches';

type SavedSearch = {
  id: string;
  name: string;
  /** The query string, so a saved search is just a link we can restore. */
  query: string;
  savedAt: string;
};

function read(): SavedSearch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    // Anything could be in storage; only keep entries that still look right.
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is SavedSearch =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as SavedSearch).id === 'string' &&
            typeof (item as SavedSearch).query === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function write(searches: SavedSearch[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Private windows and blocked site data both land here; nothing to do.
  }
}

/** A short human name for a search, built from what the visitor actually picked. */
function describe(query: SearchQuery, locationNames: Record<string, string>): string {
  const parts: string[] = [];
  if (query.q) parts.push(`“${query.q}”`);
  parts.push(...query.location.map((code) => locationNames[code] ?? code));
  parts.push(...query.property_type);
  if (query.min_bedrooms !== null) parts.push(`${query.min_bedrooms}+ soverom`);
  if (query.price.to !== null) parts.push(`under ${Math.round(query.price.to / 1_000_000)} mill.`);

  return parts.length > 0 ? parts.slice(0, 4).join(', ') : 'Alle boliger';
}

export function SavedSearches({
  query,
  currentQueryString,
  locationNames,
}: {
  query: SearchQuery;
  currentQueryString: string;
  locationNames: Record<string, string>;
}) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount so server and client render the same markup first.
  useEffect(() => {
    setSearches(read());
    setReady(true);
  }, []);

  const savedAlready = searches.some((item) => item.query === currentQueryString);

  const save = () => {
    const entry: SavedSearch = {
      id: `${Date.now()}-${searches.length}`,
      name: describe(query, locationNames),
      query: currentQueryString,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...searches].slice(0, 20);
    setSearches(next);
    write(next);
  };

  const remove = (id: string) => {
    const next = searches.filter((item) => item.id !== id);
    setSearches(next);
    write(next);
  };

  return (
    <div className="saved">
      <button
        type="button"
        className={`rail__save${savedAlready ? ' rail__save--done' : ''}`}
        onClick={save}
        disabled={savedAlready}
      >
        {savedAlready ? <BellRing size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
        {savedAlready ? 'Søket er lagret' : 'Lagre søk'}
        {!savedAlready && countActiveFilters(query) > 0 && (
          <span className="saved__count">{countActiveFilters(query)} filtre</span>
        )}
      </button>

      {ready && searches.length > 0 && (
        <div className="saved__list">
          <h2 className="filter__title">Dine lagrede søk</h2>
          <ul>
            {searches.map((item) => (
              <li key={item.id}>
                <Link href={item.query ? `/?${item.query}` : '/'} scroll={false}>
                  {item.name}
                </Link>
                <button type="button" onClick={() => remove(item.id)} aria-label={`Slett ${item.name}`}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          <p className="rail__note">Lagres i denne nettleseren.</p>
        </div>
      )}
    </div>
  );
}
