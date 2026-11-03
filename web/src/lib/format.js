export function formatKm(m) {
	if (m == null) return '';
	return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function formatDuration(s) {
	if (!s || s < 60) return '<1 min';
	const h = Math.floor(s / 3600);
	const min = Math.round((s % 3600) / 60);
	return h ? `${h} h ${min} min` : `${min} min`;
}

export function timeAgo(iso) {
	const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return 'just now';
	if (s < 3600) return `${Math.floor(s / 60)} min ago`;
	return `${Math.floor(s / 3600)} h ago`;
}
