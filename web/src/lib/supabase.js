import {createClient} from '@supabase/supabase-js';

// The same project and publishable key the app ships with; safe to expose. Only used by the
// reset-password page, which needs the recovery session from the email link.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabaseConfigured = Boolean(url && key);

export function browserClient() {
	return createClient(url, key, {
		// The link carries the session in the URL hash; nothing should outlive this tab.
		auth: {detectSessionInUrl: true, persistSession: false, flowType: 'implicit'},
	});
}
