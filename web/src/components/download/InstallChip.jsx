'use client';

import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {Check} from 'lucide-react';
import {useEffect, useState} from 'react';
import {LogoMark} from '@/components/site/Logo';

/** A little "installing → installed" loop next to the phone, so the page shows what happens next. */
export function InstallChip() {
	const reduce = useReducedMotion();
	const [pct, setPct] = useState(reduce ? 100 : 0);

	useEffect(() => {
		if (reduce) return;
		const id = setInterval(() => setPct((p) => (p >= 160 ? 0 : p + 4)), 70);
		return () => clearInterval(id);
	}, [reduce]);

	const done = pct >= 100;
	return (
		<motion.div
			initial={{opacity: 0, x: 24}}
			animate={{opacity: 1, x: 0}}
			transition={{delay: 0.6, type: 'spring', stiffness: 200, damping: 24}}
			className="absolute -left-10 bottom-16 flex w-56 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lift sm:-left-16"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
				<LogoMark size={26} />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex items-center justify-between text-xs font-extrabold">
					<AnimatePresence mode="wait" initial={false}>
						<motion.span key={done ? 'done' : 'going'} initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -4}}>
							{done ? 'chalo installed' : 'Installing chalo…'}
						</motion.span>
					</AnimatePresence>
					{done ? <Check className="size-4 text-sage" /> : <span className="tabular-nums text-muted-foreground">{Math.min(99, pct)}%</span>}
				</span>
				<span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
					<span className="block h-full rounded-full bg-primary transition-[width] duration-75" style={{width: `${Math.min(100, pct)}%`}} />
				</span>
			</span>
		</motion.div>
	);
}
