import Link from 'next/link';
import {Logo} from './Logo';
import {ThemeToggle} from './ThemeToggle';

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Logo />
				<nav className="flex items-center gap-1 sm:gap-2">
					<Link
						href="/#features"
						className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
					>
						Features
					</Link>
					<Link
						href="/#join"
						className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
					>
						Join a party
					</Link>
					<Link
						href="/privacy"
						className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
					>
						Privacy
					</Link>
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
}
