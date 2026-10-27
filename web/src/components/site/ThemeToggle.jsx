'use client';

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
		<button
			type="button"
			onClick={() => setTheme(dark ? 'light' : 'dark')}
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-border"
		>
			{mounted ? dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" /> : null}
		</button>
	);
}
