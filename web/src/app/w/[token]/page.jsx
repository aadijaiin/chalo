import {Logo} from '@/components/site/Logo';
import {publicRpc} from '@/lib/supabase';
import WatchMap from './WatchMap';

export const metadata = {
	title: 'Follow the trip live · chalo',
	description: 'See the crew live on one map. Your own location isn’t shared.',
	robots: {index: false, follow: false},
	openGraph: {
		title: 'Follow our trip live on chalo',
		description: 'Tap to see the crew on the map, right in your browser. No app needed.',
	},
};

function clean(raw) {
	return String(raw ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
}

/** A watch link: the crew live on a map, for family who don't have the app. Read-only. */
export default async function WatchPage({params}) {
	const token = clean((await params).token);
	const initial = token ? await publicRpc('watch_party', {token}).catch(() => null) : null;

	if (!initial) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16">
				<Logo />
				<div className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
					<h1 className="text-2xl font-extrabold">This trip isn&apos;t live</h1>
					<p className="text-sm text-muted-foreground">
						The party has ended, or the link was turned off. Location sharing has stopped.
					</p>
				</div>
			</main>
		);
	}

	return <WatchMap token={token} initial={initial} />;
}
