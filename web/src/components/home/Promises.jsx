'use client';

import {motion} from 'motion/react';
import {Lock} from 'lucide-react';
import Link from 'next/link';
import {Reveal} from '@/components/ui/Reveal';

const PROMISES = [
	{title: 'Only your party', body: 'Your location goes to the party you joined, while you’re in it. Nobody else, ever.'},
	{title: 'It ends with the trip', body: 'Leave or end the party and sharing stops right away. Parties end on their own after 24 hours.'},
	{title: 'Lookouts ask first', body: 'Nobody watches until the host lets them in, and anyone can hide from lookouts.'},
	{title: 'Trails don’t linger', body: 'The route trail behind your trip recap is deleted after 30 days.'},
	{title: 'No ads, nothing sold', body: 'No ads or ad trackers. Your data isn’t sold, and your location never leaves your party.'},
	{title: 'Delete it all', body: 'Delete your account from the app or the website and your data goes with it.'},
];

/** The privacy promises on a dark band, each ticked off as it scrolls in. */
export function Promises() {
	return (
		<section className="relative overflow-hidden bg-[hsl(25_14%_10%)] py-24 text-[hsl(40_25%_95%)] sm:py-32 dark:bg-[hsl(120_6%_4%)]">
			<svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.04]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 600">
				<g fill="none" stroke="currentColor" strokeWidth="1.2">
					{Array.from({length: 7}).map((_, i) => (
						<circle key={i} cx="980" cy="120" r={80 + i * 70} />
					))}
				</g>
			</svg>
			<div className="relative mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
				<Reveal className="flex flex-col gap-5">
					<span className="flex size-14 items-center justify-center rounded-3xl bg-white/10">
						<Lock className="size-6 text-primary" />
					</span>
					<h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">Shared on your terms</h2>
					<p className="text-lg leading-relaxed text-white/65">
						Location is personal. chalo shares yours with the people you choose, for as long as the trip lasts, and no
						longer.
					</p>
					<Link href="/privacy" className="group mt-2 inline-flex w-fit items-center gap-2 font-bold text-primary">
						Read the privacy policy
						<span className="transition-transform group-hover:translate-x-1">→</span>
					</Link>
				</Reveal>
				<ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
					{PROMISES.map((p, i) => (
						<motion.li
							key={p.title}
							initial={{opacity: 0, y: 16}}
							whileInView={{opacity: 1, y: 0}}
							viewport={{once: true, margin: '0px 0px -10% 0px'}}
							transition={{duration: 0.5, delay: (i % 2) * 0.08 + Math.floor(i / 2) * 0.06}}
							className="flex gap-4"
						>
							<svg viewBox="0 0 28 28" className="mt-0.5 size-7 shrink-0" aria-hidden>
								<circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
								<motion.path
									d="M8 14.5l4 4 8-9"
									fill="none"
									stroke="var(--primary)"
									strokeWidth="2.6"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{pathLength: 0}}
									whileInView={{pathLength: 1}}
									viewport={{once: true}}
									transition={{duration: 0.5, delay: 0.25 + i * 0.07}}
								/>
							</svg>
							<span>
								<span className="block font-sans text-base font-extrabold">{p.title}</span>
								<span className="mt-1 block text-[15px] leading-relaxed text-white/60">{p.body}</span>
							</span>
						</motion.li>
					))}
				</ul>
			</div>
		</section>
	);
}
