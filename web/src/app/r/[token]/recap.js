import {publicRpc} from '@/lib/supabase';

export function clean(raw) {
	return String(raw ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
}

/** The stats-only recap card behind a /r/<token> link, or null. */
export async function loadRecap(rawToken) {
	const token = clean(rawToken);
	if (!token) return null;
	return publicRpc('recap_card', {token}).catch(() => null);
}

export function headline(recap) {
	return recap.destination ? `${recap.name} → ${recap.destination}` : recap.name;
}
