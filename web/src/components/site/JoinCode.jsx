'use client';

import {AnimatePresence, motion} from 'motion/react';
import {ArrowRight, Eye} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';
import {cn} from '@/lib/utils';

const LENGTH = 6;
const clean = (raw) => raw.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, LENGTH);

/**
 * Six boxes over one hidden input, like the app: paste, backspace and the keyboard's Go just work.
 * A short code shakes; a full one flashes and opens the invite page, which opens the app.
 */
export function JoinCode() {
	const router = useRouter();
	const input = useRef(null);
	const [code, setCode] = useState('');
	const [focused, setFocused] = useState(false);
	const [shake, setShake] = useState(0);
	const [going, setGoing] = useState(false);

	function go(asLookout = false) {
		if (code.length < LENGTH) {
			setShake((n) => n + 1);
			input.current?.focus();
			return;
		}
		setGoing(true);
		setTimeout(() => router.push(`/j/${code}${asLookout ? '?as=lookout' : ''}`), 380);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				go();
			}}
			className="flex flex-col gap-4"
		>
			<div key={shake} className={cn('relative grid grid-cols-6 gap-2', shake > 0 && 'animate-shake')} onClick={() => input.current?.focus()}>
				{Array.from({length: LENGTH}).map((_, i) => {
					const char = code[i];
					const current = focused && i === Math.min(code.length, LENGTH - 1);
					return (
						<div
							key={i}
							className={cn(
								'flex aspect-[4/5] items-center justify-center rounded-2xl border-2 bg-background font-display text-2xl font-extrabold transition-colors sm:text-3xl',
								going ? 'border-sage bg-sage/10 text-sage' : current ? 'border-primary' : char ? 'border-foreground/20' : 'border-border',
							)}
						>
							<AnimatePresence mode="popLayout">
								{char ? (
									<motion.span key={char + i} initial={{y: 12, opacity: 0, scale: 0.6}} animate={{y: 0, opacity: 1, scale: 1}} transition={{type: 'spring', stiffness: 600, damping: 24}}>
										{char}
									</motion.span>
								) : current ? (
									<span className="h-7 w-[3px] animate-pulse rounded-full bg-primary" />
								) : null}
							</AnimatePresence>
						</div>
					);
				})}
				<input
					ref={input}
					value={code}
					onChange={(e) => setCode(clean(e.target.value))}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					aria-label="Party code"
					autoCapitalize="characters"
					autoComplete="one-time-code"
					spellCheck={false}
					maxLength={LENGTH}
					className="absolute inset-0 cursor-text opacity-0"
				/>
			</div>
			<div className="flex flex-col gap-2 sm:flex-row">
				<motion.button
					type="submit"
					whileTap={{scale: 0.97}}
					className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-colors hover:bg-primary-strong"
				>
					Join the party
					<ArrowRight className="size-4" />
				</motion.button>
				<motion.button
					type="button"
					whileTap={{scale: 0.97}}
					onClick={() => go(true)}
					className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3.5 text-sm font-bold transition-colors hover:bg-muted"
				>
					<Eye className="size-4" />
					Just watch
				</motion.button>
			</div>
		</form>
	);
}
