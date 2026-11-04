import {Flag, Gauge, Route, Timer} from 'lucide-react';
import {Logo} from '@/components/site/Logo';
import {Button} from '@/components/ui/Button';
import {CountUp} from '@/components/ui/CountUp';
import {Reveal} from '@/components/ui/Reveal';
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

/** A trip recap someone shared from the app, as a poster: names, distance and time. No routes or places. */
export default async function RecapPage({params}) {
	const recap = await loadRecap((await params).token);

	if (!recap) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16">
				<Logo />
				<div className="flex w-full max-w-sm flex-col gap-2 rounded-[2rem] border border-border bg-card p-8 text-center shadow-soft">
					<h1 className="text-2xl font-extrabold">Recap not found</h1>
					<p className="text-sm text-muted-foreground">This link looks broken, or the trip was deleted.</p>
				</div>
			</main>
		);
	}

	const longest = Math.max(1, ...recap.crew.map((m) => m.distanceM));
	const totalKm = recap.totalM / 1000;

	return (
		<main className="grain relative flex min-h-screen flex-col items-center gap-10 overflow-hidden bg-background px-4 py-14 sm:py-20">
			<div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
			<Logo className="relative" />

			<Reveal className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-lift">
				<div className="relative overflow-hidden bg-primary p-8 text-primary-foreground sm:p-10">
					<svg aria-hidden viewBox="0 0 400 200" className="absolute inset-0 h-full w-full text-white/15" preserveAspectRatio="xMidYMid slice">
						<path d="M -10 170 C 60 150, 90 70, 170 90 S 300 170, 410 40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" />
					</svg>
					<div className="relative flex flex-col gap-2">
						<span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
							Trip recap ·{' '}
							{new Date(recap.startedAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}
						</span>
						<h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">{recap.name}</h1>
						{recap.destination ? (
							<span className="flex items-center gap-2 text-lg font-semibold text-white/90">
								<Flag className="size-4" />
								{recap.destination}
							</span>
						) : null}
					</div>
				</div>

				<div className="grid grid-cols-2 border-b border-border">
					<div className="flex flex-col gap-1 border-r border-border p-6 sm:p-8">
						<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
							<Route className="size-3.5" />
							Together
						</span>
						<CountUp value={totalKm} decimals={totalKm < 10 ? 1 : 0} suffix=" km" className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl" />
					</div>
					<div className="flex flex-col gap-1 p-6 sm:p-8">
						<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
							<Timer className="size-3.5" />
							Trip took
						</span>
						<span className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{formatDuration(recap.durationS)}</span>
					</div>
				</div>

				<ol className="flex flex-col gap-1 p-4 sm:p-6">
					{recap.crew.map((m, i) => (
						<li key={m.avatarSeed} className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3">
							{/* A bar behind each row, as long as their share of the longest distance. */}
							<span
								aria-hidden
								className="absolute inset-y-1 left-0 rounded-2xl opacity-[0.12]"
								style={{width: `${Math.max(8, (m.distanceM / longest) * 100)}%`, background: MEMBER_COLORS[i % MEMBER_COLORS.length]}}
							/>
							<span className="relative w-5 text-center font-display text-sm font-extrabold text-muted-foreground">{i + 1}</span>
							{/* eslint-disable-next-line @next/next/no-img-element -- a generated data URI */}
							<img
								src={avatarDataUri(m.avatarStyle, m.avatarSeed)}
								alt=""
								className="relative size-11 rounded-full border-[3px]"
								style={{borderColor: MEMBER_COLORS[i % MEMBER_COLORS.length]}}
							/>
							<span className="relative flex-1 text-lg font-bold">{m.name}</span>
							{m.topKmh ? (
								<span className="relative flex items-center gap-1 text-xs font-semibold text-muted-foreground">
									<Gauge className="size-3.5" />
									{m.topKmh} km/h
								</span>
							) : null}
							<span className="relative w-20 text-right font-display text-lg font-extrabold tabular-nums">{formatKm(m.distanceM)}</span>
						</li>
					))}
				</ol>
			</Reveal>

			<Reveal delay={0.1} className="relative flex flex-col items-center gap-3 text-center">
				<p className="text-muted-foreground">Next trip, take the whole crew on one map.</p>
				<Button href="/" magnetic>
					Plan yours with chalo
				</Button>
			</Reveal>
		</main>
	);
}
