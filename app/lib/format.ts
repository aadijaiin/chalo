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
