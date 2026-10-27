'use client';

import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {useEffect, useState} from 'react';

export function ThemeToggle() {
	const {resolvedTheme, setTheme} = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

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
