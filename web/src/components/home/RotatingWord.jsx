'use client';

import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useEffect, useState} from 'react';

/** Cycles through words in place, each sliding up and out like a departures board. */
export function RotatingWord({words, interval = 2200, className}) {
	const [i, setI] = useState(0);
	const reduce = useReducedMotion();

	useEffect(() => {
		if (reduce) return;
		const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
		return () => clearInterval(id);
	}, [reduce, words.length, interval]);

	return (
		<span className={`relative inline-grid overflow-hidden align-bottom ${className ?? ''}`}>
			{/* Reserve the widest word's width so the line doesn't jump. */}
			<span className="invisible col-start-1 row-start-1">{words.reduce((a, b) => (b.length > a.length ? b : a))}</span>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={words[i]}
					initial={{y: '100%', opacity: 0}}
					animate={{y: 0, opacity: 1}}
					exit={{y: '-100%', opacity: 0}}
					transition={{type: 'spring', stiffness: 260, damping: 26}}
					className="col-start-1 row-start-1"
				>
					{words[i]}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}
