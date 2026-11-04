'use client';

import {AnimatePresence, motion, useInView, useScroll, useSpring} from 'motion/react';
import {FadeImage} from '@/components/ui/FadeImage';
import {useEffect, useRef, useState} from 'react';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';

const STEPS = [
	{
		title: 'Start a party, share the code',
		body: 'Give it a name and you get six characters. Send the invite link; friends tap it and they’re in the lobby.',
		shot: '/screens/lobby.webp',
		alt: 'The party lobby with the crew, their ETAs and the lookouts',
	},
	{
		title: 'Everyone’s on one map',
		body: 'Set the destination and stops. Each phone routes itself, so every person has their own ETA, even when locked.',
		shot: '/screens/map.webp',
		alt: 'The live map with the crew on the road to Lonavala',
	},
	{
		title: 'Family follows from home',
		body: 'Add a lookout or send a web link. They see the crew and get the alerts that matter, and share nothing.',
		shot: '/screens/lookout.webp',
		alt: 'A lookout following the crew on the map',
	},
	{
		title: 'When it ends, sharing stops',
		body: 'End the party (or it ends itself after 24 hours) and everyone stops sharing. What’s left is the recap.',
		shot: '/screens/recap.webp',
		alt: 'The trip recap with everyone’s route, distance and top speed',
	},
];

/** Steps on the left; a sticky phone on the right that follows along as you scroll. */
export function HowItWorks() {
	const [active, setActive] = useState(0);
	const listRef = useRef(null);
	const {scrollYProgress} = useScroll({target: listRef, offset: ['start 60%', 'end 60%']});
	const rail = useSpring(scrollYProgress, {stiffness: 160, damping: 30});

	return (
		<section id="how" className="relative py-24 sm:py-32">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionHeading eyebrow="How it works" title="Up and running in a minute" lead="Four steps from “where is everyone?” to a map of the whole trip." />

				<div className="mt-16 grid gap-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
					<ol ref={listRef} className="relative flex flex-col">
						{/* The rail fills as you scroll through the steps. */}
						<span aria-hidden className="absolute bottom-6 left-[1.2rem] top-6 w-[3px] rounded-full bg-border" />
						<motion.span aria-hidden style={{scaleY: rail}} className="absolute bottom-6 left-[1.2rem] top-6 w-[3px] origin-top rounded-full bg-primary" />
						{STEPS.map((s, i) => (
							<Step key={s.title} step={s} index={i} active={active === i} onActive={() => setActive(i)} />
						))}
					</ol>

					<div className="relative hidden lg:block">
						{/* Sized by the window's height so the whole phone (and its dots) always fits on screen. */}
						<div className="sticky top-24 flex flex-col items-center">
							<div className="relative aspect-[1220/2712] h-[min(calc(100svh-11rem),44rem)] max-w-full rounded-[2.6rem] shadow-lift">
							<div className="skeleton clip-layer absolute inset-0 overflow-hidden rounded-[2.6rem] border-[7px] border-foreground/90 dark:border-white/15">
								<AnimatePresence initial={false}>
									<motion.div
										key={active}
										initial={{opacity: 0, scale: 1.04}}
										animate={{opacity: 1, scale: 1}}
										exit={{opacity: 0}}
										transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
										className="absolute inset-0"
									>
										<FadeImage src={STEPS[active].shot} alt={STEPS[active].alt} fill sizes="352px" className="object-cover" />
									</motion.div>
								</AnimatePresence>
							</div>
							</div>
							<div className="mt-5 flex justify-center gap-1.5">
								{STEPS.map((s, i) => (
									<span key={s.title} className={cn('h-1.5 rounded-full transition-all duration-500', active === i ? 'w-6 bg-primary' : 'w-1.5 bg-border')} />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Step({step, index, active, onActive}) {
	const ref = useRef(null);
	const inView = useInView(ref, {margin: '-45% 0px -45% 0px'});
	useEffect(() => {
		if (inView) onActive();
	}, [inView, onActive]);

	return (
		<li ref={ref} className="relative flex gap-6 pb-16 last:pb-0 lg:min-h-[58vh] lg:pb-0">
			<motion.span
				animate={{scale: active ? 1 : 0.86, backgroundColor: active ? 'var(--primary)' : 'var(--card)', color: active ? '#fff' : 'var(--muted-foreground)'}}
				transition={{type: 'spring', stiffness: 400, damping: 28}}
				className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-border font-display text-lg font-extrabold shadow-soft"
			>
				{index + 1}
			</motion.span>
			<div className="flex flex-col gap-3 pt-1">
				<motion.h3 animate={{opacity: active ? 1 : 0.45}} className="text-2xl font-extrabold tracking-tight sm:text-3xl">
					{step.title}
				</motion.h3>
				<motion.p animate={{opacity: active ? 1 : 0.5}} className="max-w-md text-lg leading-relaxed text-muted-foreground">
					{step.body}
				</motion.p>
				{/* On small screens the screenshot sits with its step. */}
				<div className="relative mt-4 aspect-[1220/2712] w-56 rounded-[2rem] shadow-lift lg:hidden">
					<div className="skeleton clip-layer absolute inset-0 overflow-hidden rounded-[2rem] border-[6px] border-foreground/90 dark:border-white/15">
						<FadeImage src={step.shot} alt={step.alt} fill sizes="224px" className="object-cover" />
					</div>
				</div>
			</div>
		</li>
	);
}
