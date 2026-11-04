'use client';

import {AnimatePresence, motion} from 'motion/react';
import {useEffect, useState} from 'react';
import {LogoMark} from './Logo';

const MIN_MS = 450;
const MAX_MS = 2500;

/**
 * The first paint is this: the logo and a filling line, until the fonts are in and the page is
 * interactive, so a cold load never shows fonts swapping or sections popping in. It's in the
 * server HTML (so it covers the page from the very first frame) and fades out once ready; a
 * <noscript> rule in the layout hides it when JavaScript is off.
 */
export function PageLoader() {
	const [done, setDone] = useState(false);

	useEffect(() => {
		const started = performance.now();
		let cancelled = false;
		const finish = () => {
			if (cancelled) return;
			const wait = Math.max(0, MIN_MS - (performance.now() - started));
			setTimeout(() => !cancelled && setDone(true), wait);
		};
		// Fonts ready, or give up waiting: never hold the page hostage to a slow font server.
		Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, MAX_MS))]).then(finish);
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<AnimatePresence>
			{done ? null : (
				<motion.div
					id="page-loader"
					key="loader"
					aria-hidden
					exit={{opacity: 0, transition: {duration: 0.45, ease: [0.22, 1, 0.36, 1]}}}
					className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background"
				>
					<motion.div exit={{scale: 0.9, y: -8}} transition={{duration: 0.4}} className="flex flex-col items-center gap-6">
						<div className="relative">
							<span className="absolute inset-x-2 -bottom-2 h-2 animate-[loader-shadow_1.1s_ease-in-out_infinite] rounded-full bg-foreground/10 blur-[2px]" />
							<div className="animate-[loader-bob_1.1s_ease-in-out_infinite]">
								<LogoMark size={56} />
							</div>
						</div>
						<div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
							<span className="block h-full w-1/3 animate-[loader-line_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
