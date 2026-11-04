'use client';

import {AnimatePresence, motion} from 'motion/react';
import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {useSyncExternalStore} from 'react';

const noSubscribe = () => () => {};

export function ThemeToggle() {
	const {resolvedTheme, setTheme} = useTheme();
	// false while server-rendering and hydrating, true after: the theme is only known in the browser.
	const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);

	const dark = mounted && resolvedTheme === 'dark';
	return (
		<motion.button
			type="button"
			whileTap={{scale: 0.9}}
			onClick={() => setTheme(dark ? 'light' : 'dark')}
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			className="relative flex size-10 items-center justify-center overflow-hidden rounded-full text-foreground transition-colors hover:bg-muted"
		>
			<AnimatePresence initial={false} mode="popLayout">
				{mounted ? (
					<motion.span
						key={dark ? 'sun' : 'moon'}
						initial={{y: 16, rotate: -60, opacity: 0}}
						animate={{y: 0, rotate: 0, opacity: 1}}
						exit={{y: -16, rotate: 60, opacity: 0}}
						transition={{type: 'spring', stiffness: 400, damping: 26}}
						className="flex"
					>
						{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
					</motion.span>
				) : null}
			</AnimatePresence>
		</motion.button>
	);
}
