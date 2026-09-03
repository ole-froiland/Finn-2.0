'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { searchHref, type SearchQuery } from '@/lib/finn/params';
import { SORT_OPTIONS, type SortValue } from '@/lib/finn/taxonomy';

export function SortSelect({ query }: { query: SearchQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="sorter">
      Sorter på
      <select
        value={query.sort}
        disabled={pending}
        onChange={(event) =>
          startTransition(() =>
            router.push(
              searchHref({ ...query, sort: event.target.value as SortValue, page: 1 }),
              { scroll: false },
            ),
          )
        }
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
