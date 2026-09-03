'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'hjemly:favourites';

function read(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    // Private windows and blocked site data both land here; treat as empty.
    return [];
  }
}

export function FavouriteButton({ id, title }: { id: string; title: string }) {
  const [saved, setSaved] = useState(false);

  // Read after mount so the server and client markup agree on first paint.
  useEffect(() => setSaved(read().includes(id)), [id]);

  const toggle = () => {
    const next = saved ? read().filter((item) => item !== id) : [...read(), id];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Losing the write is fine; the toggle still reflects this session.
    }
    setSaved(!saved);
  };

  return (
    <button
      type="button"
      className="card__fav"
      aria-pressed={saved}
      aria-label={saved ? `Fjern ${title} fra favoritter` : `Legg ${title} til favoritter`}
      onClick={toggle}
    >
      <Heart size={20} />
    </button>
  );
}
