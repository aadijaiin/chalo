'use client';

import Lenis from 'lenis';
import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

// Clears the floating header when landing on a section. Lenis already honours the page's
// scroll-padding-top (globals.css) for this, so only the native fallback needs it.
const HEADER_OFFSET = -96;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

let lenis = null;

/** Scrolls to an element or "#id", smoothly when we can, instantly for reduced motion. */
export function scrollToTarget(target, {immediate = false} = {}) {
	const el = typeof target === 'string' ? document.querySelector(target) : target;
	if (!el) return false;
	if (lenis) {
		// A link in the mobile menu is tapped while scrolling is paused behind it: the menu is
		// closing, so resume first, or the page is still clipped and the glide goes nowhere.
		if (lenis.isStopped) lockScroll(false);
		lenis.scrollTo(el, {duration: 1.3, easing: easeOutExpo, immediate});
	} else {
		const top = el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
		window.scrollTo({top, behavior: immediate ? 'auto' : 'smooth'});
	}
	return true;
}

/** Pauses page scrolling (e.g. behind the mobile menu) and resumes it. */
export function lockScroll(locked) {
	if (lenis) (locked ? lenis.stop() : lenis.start());
	document.documentElement.style.overflow = locked ? 'hidden' : '';
}

/**
 * Buttery scrolling for the whole site: eased wheel scrolling, and every in-page link (the nav,
 * the footer, buttons like "I have a party code") glides to its section instead of jumping.
 * Off for people who ask for reduced motion, where links still land in the right place.
 */
export function SmoothScroll() {
	const pathname = usePathname();

	useEffect(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduce) {
			lenis = new Lenis({duration: 1.15, easing: easeOutExpo, smoothWheel: true, wheelMultiplier: 0.95});
			let raf = requestAnimationFrame(function tick(time) {
				lenis?.raf(time);
				raf = requestAnimationFrame(tick);
			});
			return () => {
				cancelAnimationFrame(raf);
				lenis?.destroy();
				lenis = null;
			};
		}
	}, []);

	// Same-page anchor links, wherever they are on the page. Listening in the capture phase gets
	// here before Next's <Link>, which would otherwise jump straight to the section.
	useEffect(() => {
		function onClick(e) {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const a = e.target.closest?.('a[href]');
			if (!a || a.target === '_blank') return;
			const url = new URL(a.href, window.location.href);
			if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
			if (!scrollToTarget(url.hash)) return;
			// Next's <Link> still runs its onClick (closing the mobile menu), then skips its own jump.
			e.preventDefault();
			history.pushState(null, '', url.hash);
		}
		document.addEventListener('click', onClick, {capture: true});
		return () => document.removeEventListener('click', onClick, {capture: true});
	}, []);

	// Arriving from another page with a #section (e.g. /privacy → /#faq): glide there once it's laid out.
	useEffect(() => {
		if (!window.location.hash) return;
		const id = setTimeout(() => scrollToTarget(window.location.hash), 120);
		return () => clearTimeout(id);
	}, [pathname]);

	return null;
}
