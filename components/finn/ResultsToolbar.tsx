'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Map as MapIcon, List } from 'lucide-react';

import { searchHref, type SearchQuery } from '@/lib/finn/params';
import { SORT_OPTIONS, type SortValue } from '@/lib/finn/taxonomy';

/**
 * The row FINN puts above its results: the map toggle and the sort dropdown.
 * The filter toggle lives with the rail itself, since it owns that state.
 */
export function ResultsToolbar({ query }: { query: SearchQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (next: SearchQuery) =>
    startTransition(() => router.push(searchHref(next), { scroll: false }));

  return (
    <div className="toolbar">
      <button
        type="button"
        className="toolbar__map"
        aria-pressed={query.map}
        onClick={() => go({ ...query, map: !query.map, page: 1 })}
      >
        {query.map ? <List size={18} aria-hidden="true" /> : <MapIcon size={18} aria-hidden="true" />}
        {query.map ? 'Vis liste' : 'Vis på kart'}
      </button>

      <label className="sorter">
        Sortér på
        <select
          value={query.sort}
          disabled={pending}
          onChange={(event) => go({ ...query, sort: event.target.value as SortValue, page: 1 })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
