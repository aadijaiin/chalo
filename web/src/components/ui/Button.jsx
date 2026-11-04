'use client';

import {motion, useMotionValue, useSpring} from 'motion/react';
import Link from 'next/link';
import {useRef} from 'react';
import {cn} from '@/lib/utils';

const VARIANTS = {
	primary:
		'bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] hover:bg-primary-strong',
	ink: 'bg-foreground text-background hover:bg-foreground/90',
	outline: 'border border-border bg-card text-foreground hover:border-foreground/25 hover:bg-muted',
	ghost: 'text-foreground hover:bg-muted',
};

const SIZES = {
	md: 'h-11 gap-2 rounded-2xl px-5 text-sm',
	lg: 'h-14 gap-2.5 rounded-2xl px-6 text-base',
};

/**
 * The site's button. With `magnetic`, it leans a little towards the pointer, which makes the
 * main calls to action feel alive without moving far enough to miss a click.
 */
export function Button({href, variant = 'primary', size = 'lg', magnetic = false, className, children, ...rest}) {
	const ref = useRef(null);
	const x = useSpring(useMotionValue(0), {stiffness: 300, damping: 20, mass: 0.4});
	const y = useSpring(useMotionValue(0), {stiffness: 300, damping: 20, mass: 0.4});

	function onMove(e) {
		if (!magnetic || !ref.current) return;
		const r = ref.current.getBoundingClientRect();
		x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
		y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
	}
	function onLeave() {
		x.set(0);
		y.set(0);
	}

	const classes = cn(
		'relative inline-flex select-none items-center justify-center whitespace-nowrap font-bold transition-[background-color,border-color,color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50',
		VARIANTS[variant],
		SIZES[size],
		className,
	);
	const motionProps = {
		ref,
		style: magnetic ? {x, y} : undefined,
		whileTap: {scale: 0.96},
		onPointerMove: onMove,
		onPointerLeave: onLeave,
		className: classes,
	};

	if (href) {
		const external = /^https?:/.test(href);
		return external ? (
			<motion.a href={href} {...motionProps} {...rest}>
				{children}
			</motion.a>
		) : (
			<MotionLink href={href} {...motionProps} {...rest}>
				{children}
			</MotionLink>
		);
	}
	return (
		<motion.button type="button" {...motionProps} {...rest}>
			{children}
		</motion.button>
	);
}

const MotionLink = motion.create(Link);
