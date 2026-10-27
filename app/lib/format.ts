export function timeAgo(iso: string | number) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDistance(m: number) {
  if (m < 50) return 'right here';
  if (m < 1000) return `${Math.round(m / 10) * 10} m away`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km away`;
}

export function formatDuration(s: number) {
  const mins = Math.max(1, Math.round(s / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatKm(m: number) {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

/** "42 km · 1 h 5 min", "42 km to go" without a route, or "Arrived". */
export function tripLabel(t: { remainingM: number | null; etaS: number | null }) {
  if (t.remainingM == null) return null;
  if (t.remainingM === 0) return 'Arrived';
  return t.etaS != null ? `${formatKm(t.remainingM)} · ${formatDuration(t.etaS)}` : `${formatKm(t.remainingM)} to go`;
}
