import Link from 'next/link';
import {LogoMark} from './Logo';

export function SiteFooter() {
	return (
		<footer className="border-t border-border/60">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="flex items-center gap-2">
					<LogoMark size={24} />
					<span className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} chalo. Find your way, together.
					</span>
				</div>
				<nav className="flex gap-5 text-sm font-semibold text-muted-foreground">
					<Link href="/privacy" className="hover:text-foreground">
						Privacy
					</Link>
					<Link href="/terms" className="hover:text-foreground">
						Terms
					</Link>
					<Link href="/delete-account" className="hover:text-foreground">
						Delete account
					</Link>
				</nav>
			</div>
		</footer>
	);
}
