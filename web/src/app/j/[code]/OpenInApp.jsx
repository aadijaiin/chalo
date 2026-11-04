'use client';

import {AnimatePresence, motion} from 'motion/react';
import {Check, Copy, Download, ExternalLink} from 'lucide-react';
import Link from 'next/link';
import {useEffect, useState} from 'react';

/** Tries the app right away; if it isn't installed, the page stays put with the code to copy. */
export default function OpenInApp({code, lookout = false}) {
	const appUrl = `chalo://join/${code}${lookout ? '?as=lookout' : ''}`;
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
			<motion.a
				href={appUrl}
				whileTap={{scale: 0.97}}
				className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-colors hover:bg-primary-strong"
			>
				<ExternalLink className="size-4" />
				{lookout ? 'Watch in chalo' : 'Open in chalo'}
			</motion.a>
			<div className="grid grid-cols-2 gap-2">
				<motion.button
					type="button"
					whileTap={{scale: 0.96}}
					onClick={copy}
					className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-bold transition-colors hover:bg-muted"
				>
					<AnimatePresence mode="wait" initial={false}>
						<motion.span
							key={copied ? 'done' : 'copy'}
							initial={{opacity: 0, y: 6}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0, y: -6}}
							className="flex items-center gap-2"
						>
							{copied ? <Check className="size-4 text-sage" /> : <Copy className="size-4" />}
							{copied ? 'Copied' : 'Copy code'}
						</motion.span>
					</AnimatePresence>
				</motion.button>
				<Link
					href="/download"
					className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-bold transition-colors hover:bg-muted"
				>
					<Download className="size-4" />
					Get the app
				</Link>
			</div>
			<p className="text-center text-xs leading-relaxed text-muted-foreground">
				{lookout
					? 'Nothing happened? Get the app, then tap the link again, or enter the code on its home screen and choose “Just watch”.'
					: 'Nothing happened? Get the app, then tap the link again, or enter the code on its home screen.'}
			</p>
		</div>
	);
}
