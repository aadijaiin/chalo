'use client';

import {motion, useReducedMotion} from 'motion/react';
import {LogoMark} from './Logo';

const LOOP = 'M 40 120 C 80 40, 160 40, 170 100 S 110 170, 90 120 S 160 30, 230 70 S 290 170, 240 160 S 200 80, 280 60';

/** A pin wandering a looping route that never arrives. */
export function LostMap() {
	const reduce = useReducedMotion();
	return (
		<div aria-hidden className="relative h-48 w-80 overflow-hidden rounded-[2rem] border border-border bg-[var(--map-land)] shadow-lift">
			<svg viewBox="0 0 320 190" className="absolute inset-0 h-full w-full">
				<g fill="none" stroke="var(--map-contour)" strokeWidth="1.2">
					{[0, 1, 2, 3].map((i) => (
						<ellipse key={i} cx="160" cy="95" rx={40 + i * 34} ry={22 + i * 20} />
					))}
				</g>
				<path d={LOOP} fill="none" stroke="var(--map-highway)" strokeWidth="9" strokeLinecap="round" />
				<path d={LOOP} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" className={reduce ? '' : 'animate-dash'} />
			</svg>
			<motion.div
				className="absolute left-0 top-0"
				style={{offsetPath: `path('${LOOP}')`, offsetRotate: '0deg'}}
				initial={{offsetDistance: '0%'}}
				animate={reduce ? {offsetDistance: '55%'} : {offsetDistance: ['0%', '100%', '0%']}}
				transition={{duration: 9, repeat: Infinity, ease: 'easeInOut'}}
			>
				<div className="-translate-x-1/2 -translate-y-full">
					<LogoMark size={34} className="drop-shadow-md" />
				</div>
			</motion.div>
		</div>
	);
}
