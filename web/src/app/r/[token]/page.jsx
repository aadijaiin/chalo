import {Gauge, Route, Timer} from 'lucide-react';
import Link from 'next/link';
import {Logo} from '@/components/site/Logo';
import {avatarDataUri, MEMBER_COLORS} from '@/lib/avatar';
import {formatDuration, formatKm} from '@/lib/format';
import {headline, loadRecap} from './recap';

export async function generateMetadata({params}) {
	const recap = await loadRecap((await params).token);
	if (!recap) return {title: 'Trip recap · chalo', robots: {index: false}};
	const title = `${headline(recap)} · trip recap`;
	const description = `${formatKm(recap.totalM)} together in ${formatDuration(recap.durationS)}, with ${recap.crew
		.map((m) => m.name)
		.join(', ')}.`;
	return {title, description, robots: {index: false, follow: false}, openGraph: {title, description}};
}

/** A trip recap someone shared from the app: names, distance and time. No routes or places. */
export default async function RecapPage({params}) {
	const recap = await loadRecap((await params).token);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16">
			<Logo />
			{recap ? (
				<div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
					<div>
						<p className="text-xs font-semibold uppercase tracking-widest text-primary">Trip recap</p>
						<h1 className="mt-1 text-2xl font-extrabold tracking-tight">{headline(recap)}</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{new Date(recap.startedAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Stat icon={Route} label="Together" value={formatKm(recap.totalM)} />
						<Stat icon={Timer} label="Trip took" value={formatDuration(recap.durationS)} />
					</div>
					<ul className="flex flex-col gap-2">
						{recap.crew.map((m, i) => (
							<li key={m.avatarSeed} className="flex items-center gap-3 rounded-2xl bg-background p-3">
								{/* eslint-disable-next-line @next/next/no-img-element -- a generated data URI */}
								<img
									src={avatarDataUri(m.avatarStyle, m.avatarSeed)}
									alt=""
									className="size-10 rounded-full border-[3px]"
									style={{borderColor: MEMBER_COLORS[i % MEMBER_COLORS.length]}}
								/>
								<span className="flex-1 font-bold">{m.name}</span>
								{m.topKmh ? (
									<span className="flex items-center gap-1 text-xs text-muted-foreground">
										<Gauge className="size-3.5" />
										{m.topKmh} km/h
									</span>
								) : null}
								<span className="w-16 text-right font-extrabold">{formatKm(m.distanceM)}</span>
							</li>
						))}
					</ul>
					<Link
						href="/"
						className="rounded-2xl bg-primary px-4 py-3.5 text-center font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90"
					>
						Plan your next trip with chalo
					</Link>
				</div>
			) : (
				<div className="flex w-full max-w-sm flex-col gap-2 rounded-3xl border border-border bg-card p-8 text-center">
					<h1 className="text-2xl font-extrabold">Recap not found</h1>
					<p className="text-sm text-muted-foreground">This link looks broken, or the trip was deleted.</p>
				</div>
			)}
		</main>
	);
}

function Stat({icon: Icon, label, value}) {
	return (
		<div className="rounded-2xl bg-background p-4">
			<p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				<Icon className="size-3.5" />
				{label}
			</p>
			<p className="mt-1 text-2xl font-extrabold">{value}</p>
		</div>
	);
}
