'use client';

import {AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring} from 'motion/react';
import {Download, Menu, X} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';
import {lockScroll} from '@/components/ui/SmoothScroll';
import {cn} from '@/lib/utils';
import {Logo} from './Logo';
import {ThemeToggle} from './ThemeToggle';

const NAV = [
	{href: '/#features', id: 'features', label: 'Features'},
	{href: '/#lookouts', id: 'lookouts', label: 'Lookouts'},
	{href: '/#how', id: 'how', label: 'How it works'},
	{href: '/#faq', id: 'faq', label: 'FAQ'},
];

/** Which home section is under the header right now, for the nav highlight. */
function useActiveSection(enabled) {
	const [active, setActive] = useState(null);
	useEffect(() => {
		if (!enabled) return;
		const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
			},
			{rootMargin: '-45% 0px -50% 0px'},
		);
		sections.forEach((s) => observer.observe(s));
		return () => observer.disconnect();
	}, [enabled]);
	return enabled ? active : null;
}

/** A floating pill that tightens once you scroll, with a progress line along its bottom edge. */
export function SiteHeader() {
	const pathname = usePathname();
	const home = pathname === '/';
	const {scrollY, scrollYProgress} = useScroll();
	const progress = useSpring(scrollYProgress, {stiffness: 200, damping: 30, restDelta: 0.001});
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const active = useActiveSection(home);

	useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

	// Lock the page behind the menu while it's open.
	useEffect(() => {
		lockScroll(open);
		return () => lockScroll(false);
	}, [open]);

	return (
		<>
			<header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
				<motion.div
					animate={{maxWidth: scrolled ? 920 : 1152}}
					transition={{type: 'spring', stiffness: 260, damping: 32}}
					className={cn(
						'pointer-events-auto relative flex h-14 w-full items-center justify-between gap-3 rounded-full px-2 pl-4 transition-[background-color,box-shadow,border-color] duration-300',
						scrolled || open
							? 'border border-border/70 bg-background/75 shadow-soft backdrop-blur-xl'
							: 'border border-transparent bg-transparent',
					)}
				>
					<Logo />

					<nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
						{NAV.map((n) => (
							<Link
								key={n.id}
								href={n.href}
								className={cn(
									'relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
									active === n.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
								)}
							>
								{active === n.id ? (
									<motion.span
										layoutId="nav-pill"
										className="absolute inset-0 -z-10 rounded-full bg-muted"
										transition={{type: 'spring', stiffness: 380, damping: 32}}
									/>
								) : null}
								{n.label}
							</Link>
						))}
					</nav>

					<div className="flex items-center gap-1">
						<ThemeToggle />
						<Link
							href="/download"
							className="hidden h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background transition-transform hover:scale-[1.03] active:scale-95 sm:flex"
						>
							<Download className="size-4" />
							Get the app
						</Link>
						<button
							type="button"
							onClick={() => setOpen((o) => !o)}
							aria-label={open ? 'Close menu' : 'Open menu'}
							aria-expanded={open}
							className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted md:hidden"
						>
							<AnimatePresence initial={false} mode="popLayout">
								<motion.span
									key={open ? 'x' : 'menu'}
									initial={{rotate: -90, opacity: 0}}
									animate={{rotate: 0, opacity: 1}}
									exit={{rotate: 90, opacity: 0}}
									transition={{duration: 0.18}}
									className="flex"
								>
									{open ? <X className="size-5" /> : <Menu className="size-5" />}
								</motion.span>
							</AnimatePresence>
						</button>
					</div>

					<motion.span
						aria-hidden
						style={{scaleX: progress}}
						className={cn(
							'absolute inset-x-6 -bottom-px h-[2px] origin-left rounded-full bg-primary transition-opacity',
							scrolled && home ? 'opacity-100' : 'opacity-0',
						)}
					/>
				</motion.div>
			</header>

			<AnimatePresence>
				{open ? (
					<motion.div
						initial={{opacity: 0}}
						animate={{opacity: 1}}
						exit={{opacity: 0}}
						className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xl md:hidden"
						onClick={() => setOpen(false)}
					>
						<motion.nav
							initial="hidden"
							animate="shown"
							exit="hidden"
							variants={{shown: {transition: {staggerChildren: 0.05, delayChildren: 0.05}}}}
							className="flex flex-col gap-1 px-6 pt-28"
							aria-label="Menu"
						>
							{[...NAV, {href: '/download', id: 'download', label: 'Get the app'}, {href: '/privacy', id: 'privacy', label: 'Privacy'}].map((n) => (
								<motion.div
									key={n.id}
									variants={{hidden: {opacity: 0, y: 16}, shown: {opacity: 1, y: 0}}}
									transition={{type: 'spring', stiffness: 380, damping: 30}}
								>
									<Link
										href={n.href}
										onClick={() => setOpen(false)}
										className="block border-b border-border/60 py-4 font-display text-3xl font-extrabold tracking-tight"
									>
										{n.label}
									</Link>
								</motion.div>
							))}
						</motion.nav>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
}
