'use client';

import {motion} from 'motion/react';
import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';

const slug = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

/** "On this page": built from the article's headings, with the one you're reading highlighted. */
export function LegalToc() {
	const [items, setItems] = useState([]);
	const [active, setActive] = useState(null);

	useEffect(() => {
		const headings = [...document.querySelectorAll('.prose-page h2')];
		headings.forEach((h) => (h.id ||= slug(h.textContent)));
		queueMicrotask(() => setItems(headings.map((h) => ({id: h.id, label: h.textContent}))));
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
			},
			{rootMargin: '-20% 0px -70% 0px'},
		);
		headings.forEach((h) => io.observe(h));
		return () => io.disconnect();
	}, []);

	if (items.length === 0) return null;
	return (
		<nav aria-label="On this page" className="hidden lg:block">
			<div className="sticky top-28 flex flex-col gap-1 border-l border-border pl-4">
				<span className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">On this page</span>
				{items.map((it) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						className={cn('relative py-1 text-sm font-semibold transition-colors', active === it.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
					>
						{active === it.id ? (
							<motion.span layoutId="toc-bar" className="absolute -left-[17px] top-1 bottom-1 w-[2px] rounded-full bg-primary" />
						) : null}
						{it.label}
					</a>
				))}
			</div>
		</nav>
	);
}
