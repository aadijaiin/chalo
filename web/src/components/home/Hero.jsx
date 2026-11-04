import {ArrowRight, Download} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {Reveal} from '@/components/ui/Reveal';
import {HeroMap} from './HeroMap';
import {RotatingWord} from './RotatingWord';

const FACTS = ['Free', 'No ads', 'Works offline', 'Stops when the trip ends'];

export function Hero({crew}) {
	return (
		<section className="grain relative overflow-hidden pb-28 pt-32 sm:pt-40">
			{/* Warm light behind the map and a faint topo texture across the page. */}
			<div aria-hidden className="pointer-events-none absolute -right-32 top-0 size-[44rem] rounded-full bg-primary/15 blur-[120px]" />
			<div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 size-[30rem] rounded-full bg-sage/15 blur-[110px]" />
			<Topography />

			<div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
				<div className="flex flex-col gap-8">
					<Reveal>
						<span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 text-sm font-semibold shadow-soft">
							<span className="relative flex size-6 items-center justify-center rounded-full bg-sage/15">
								<span className="absolute size-2 animate-ping-ring rounded-full bg-sage" />
								<span className="size-2 rounded-full bg-sage" />
							</span>
							Live location for your crew
						</span>
					</Reveal>

					<Reveal delay={0.08}>
						<h1 className="text-[2.9rem] font-extrabold leading-[0.95] tracking-[-0.035em] min-[400px]:text-[3.2rem] sm:text-7xl lg:text-[4.6rem] xl:text-[5.2rem]">
							<span className="sm:whitespace-nowrap">Find your way,</span>
							<br />
							<span className="relative text-primary">
								together.
								<svg aria-hidden viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full text-primary/35" preserveAspectRatio="none">
									<path d="M2 14 C 60 4, 120 18, 180 9 S 270 6, 298 12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
								</svg>
							</span>
						</h1>
					</Reveal>

					<Reveal delay={0.16}>
						<div className="flex flex-col gap-3">
							<p className="font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
								Made for{' '}
								<RotatingWord
									className="text-primary"
									words={['road trips', 'bike rides', 'treks', 'wedding convoys', 'airport runs', 'college trips']}
								/>
							</p>
							<p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
								One live map for the whole crew: everyone&apos;s route and ETA, pings like &ldquo;chai stop?&rdquo;, and
								family who can follow along from home.
							</p>
						</div>
					</Reveal>

					<Reveal delay={0.24} className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<Button href="/download" magnetic>
							<Download className="size-5" />
							Get it for Android
						</Button>
						<Button href="#join" variant="outline">
							I have a party code
							<ArrowRight className="size-4" />
						</Button>
					</Reveal>

					<Reveal delay={0.32}>
						<ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
							{FACTS.map((f) => (
								<li key={f} className="flex items-center gap-2">
									<svg viewBox="0 0 16 16" className="size-4 text-sage" aria-hidden>
										<path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									{f}
								</li>
							))}
						</ul>
					</Reveal>
				</div>

				<div className="mx-auto w-full max-w-[34rem] lg:max-w-none">
					<HeroMap crew={crew} />
				</div>
			</div>
		</section>
	);
}

/** Contour lines, like a hiking map, very faint. */
function Topography() {
	return (
		<svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-foreground/[0.05]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
			<g fill="none" stroke="currentColor" strokeWidth="1.2">
				{Array.from({length: 9}).map((_, i) => (
					<path
						key={i}
						d={`M -50 ${120 + i * 70} C 200 ${60 + i * 70}, 360 ${220 + i * 70}, 620 ${130 + i * 70} S 1000 ${40 + i * 70}, 1260 ${150 + i * 70}`}
					/>
				))}
			</g>
		</svg>
	);
}
