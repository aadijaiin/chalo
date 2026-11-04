'use client';

import {motion} from 'motion/react';

export const EASE_OUT = [0.22, 1, 0.36, 1];

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({children, delay = 0, y = 24, className, as = 'div', ...rest}) {
	const Tag = motion[as];
	return (
		<Tag
			initial={{opacity: 0, y}}
			whileInView={{opacity: 1, y: 0}}
			viewport={{once: true, margin: '0px 0px -12% 0px'}}
			transition={{duration: 0.7, delay, ease: EASE_OUT}}
			className={className}
			{...rest}
		>
			{children}
		</Tag>
	);
}

/** Reveals each direct child in turn. */
export function Stagger({children, className, gap = 0.08, as = 'div'}) {
	const Tag = motion[as];
	return (
		<Tag
			initial="hidden"
			whileInView="shown"
			viewport={{once: true, margin: '0px 0px -10% 0px'}}
			variants={{shown: {transition: {staggerChildren: gap}}}}
			className={className}
		>
			{children}
		</Tag>
	);
}

export const staggerItem = {
	hidden: {opacity: 0, y: 22},
	shown: {opacity: 1, y: 0, transition: {duration: 0.6, ease: EASE_OUT}},
};
