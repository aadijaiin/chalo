'use client';

import {animate, useInView, useReducedMotion} from 'motion/react';
import {useEffect, useRef, useState} from 'react';

/** Counts up to `value` the first time it's on screen. */
export function CountUp({value, decimals = 0, duration = 1.6, suffix = '', className}) {
	const ref = useRef(null);
	const inView = useInView(ref, {once: true, margin: '0px 0px -10% 0px'});
	const reduce = useReducedMotion();
	const [shown, setShown] = useState(0);

	useEffect(() => {
		if (!inView || reduce) return;
		const controls = animate(0, value, {duration, ease: [0.22, 1, 0.36, 1], onUpdate: setShown});
		return () => controls.stop();
	}, [inView, reduce, value, duration]);

	return (
		<span ref={ref} className={className}>
			{(reduce && inView ? value : shown).toFixed(decimals)}
			{suffix}
		</span>
	);
}
