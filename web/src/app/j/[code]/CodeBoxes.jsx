'use client';

import {motion} from 'motion/react';

/** The party code, one character per box, flipping in like a departures board. */
export function CodeBoxes({code}) {
	return (
		<div className="grid grid-cols-6 gap-2" aria-label={`Party code ${code}`} style={{perspective: 600}}>
			{code.split('').map((c, i) => (
				<motion.span
					key={i}
					initial={{rotateX: -90, opacity: 0}}
					animate={{rotateX: 0, opacity: 1}}
					transition={{delay: 0.15 + i * 0.07, type: 'spring', stiffness: 260, damping: 20}}
					className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-primary font-display text-3xl font-extrabold text-primary-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)]"
				>
					{c}
				</motion.span>
			))}
		</div>
	);
}
