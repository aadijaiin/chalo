'use client';

import {useEffect, useState} from 'react';

/** Tries the app right away; if it isn't installed, the page stays put with the code to copy. */
export default function OpenInApp({code}) {
	const appUrl = `chalo://join/${code}`;
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		window.location.href = appUrl;
	}, [appUrl]);

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		} catch {}
	}

	return (
		<div className="flex flex-col gap-3">
			<a
				href={appUrl}
				className="rounded-2xl bg-[#e2725b] px-4 py-3.5 font-bold text-white transition-opacity hover:opacity-90"
			>
				Open in chalo
			</a>
			<button
				type="button"
				onClick={copy}
				className="rounded-2xl border border-black/10 dark:border-white/15 px-4 py-3 text-sm font-semibold text-foreground"
			>
				{copied ? 'Copied' : 'Copy code'}
			</button>
			<p className="text-xs text-muted-foreground">
				Nothing happened? Install chalo, then tap the link again, or enter the code on the home screen.
			</p>
		</div>
	);
}
