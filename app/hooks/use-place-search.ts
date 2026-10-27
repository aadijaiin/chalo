import { searchPlaces, type Place } from '@/lib/places';
import * as React from 'react';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 350;

/** Debounced place search near you; drops stale answers when you keep typing. */
export function usePlaceSearch(query: string, near: { latitude: number; longitude: number } | null) {
  const [results, setResults] = React.useState<Place[]>([]);
  const [searching, setSearching] = React.useState(false);
  const q = query.trim();
  // Re-centre the bias only when you've moved a fair bit, not on every GPS tick.
  const nearKey = near ? `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}` : '';

  React.useEffect(() => {
    if (q.length < MIN_CHARS) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchPlaces(q, near, ctrl.signal)
        .then(setResults)
        .catch((e) => e.name !== 'AbortError' && setResults([]))
        .finally(() => !ctrl.signal.aborted && setSearching(false));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, nearKey]);

  return { results, searching, active: q.length >= MIN_CHARS };
}
