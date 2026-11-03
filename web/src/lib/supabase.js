import {createClient} from '@supabase/supabase-js';

// The same project and publishable key the app ships with; safe to expose. Used by the
// reset-password page, and (signed out) by the watch and recap link pages.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabaseConfigured = Boolean(url && key);

export function browserClient() {
	return createClient(url, key, {
		// The link carries the session in the URL hash; nothing should outlive this tab.
		auth: {detectSessionInUrl: true, persistSession: false, flowType: 'implicit'},
	});
}

/** Calls one of the public link RPCs (watch_party, recap_card) without a session. */
export async function publicRpc(fn, args) {
	if (!supabaseConfigured) return null;
	const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
		method: 'POST',
		headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
		body: JSON.stringify(args),
		cache: 'no-store',
	});
	if (!res.ok) throw new Error(`${fn} failed: ${res.status}`);
	return res.json();
}
