'use client';

import {useRef} from 'react';
import {cn} from '@/lib/utils';

/**
 * A card with a soft light that follows the pointer, set through CSS variables so it never
 * re-renders React. On touch screens it just stays a card.
 */
export function Spotlight({className, children, as: Tag = 'div', ...rest}) {
	const ref = useRef(null);
	function onMove(e) {
		const r = ref.current.getBoundingClientRect();
		ref.current.style.setProperty('--sx', `${e.clientX - r.left}px`);
		ref.current.style.setProperty('--sy', `${e.clientY - r.top}px`);
	}
	return (
		<Tag
			ref={ref}
			onPointerMove={onMove}
			className={cn(
				'group/spot relative overflow-hidden rounded-4xl border border-border bg-card shadow-soft',
				"before:pointer-events-none before:absolute before:inset-0 before:z-0 before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:before:opacity-100",
				'before:bg-[radial-gradient(420px_circle_at_var(--sx)_var(--sy),color-mix(in_oklab,var(--primary)_12%,transparent),transparent_65%)]',
				className,
			)}
			{...rest}
		>
			{children}
		</Tag>
	);
}
