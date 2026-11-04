import Link from 'next/link';
import {LogoMark} from './Logo';

const LINKS = [
	{
		title: 'App',
		items: [
			{href: '/download', label: 'Download for Android'},
			{href: '/#join', label: 'Join with a code'},
			{href: '/#features', label: 'Features'},
			{href: '/#lookouts', label: 'Lookouts'},
		],
	},
	{
		title: 'Your data',
		items: [
			{href: '/privacy', label: 'Privacy policy'},
			{href: '/terms', label: 'Terms'},
			{href: '/delete-account', label: 'Delete your account'},
		],
	},
	{
		title: 'Project',
		items: [{href: 'https://github.com/aadijaiin/chalo', label: 'Source on GitHub'}],
	},
];

/** A route that ends at the wordmark: the site's last word is "chalo" (let's go). */
export function SiteFooter() {
	return (
		<footer className="relative overflow-hidden border-t border-border/60 bg-background-2">
			<div className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 sm:px-6 md:grid-cols-[1.2fr_2fr]">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<LogoMark size={28} />
						<span className="font-display text-lg font-extrabold">chalo</span>
					</div>
					<p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
						Live location for your crew, on one map. Made for road trips, group rides and everyone waiting at
						home.
					</p>
				</div>
				<div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
					{LINKS.map((group) => (
						<div key={group.title} className="flex flex-col gap-3">
							<h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
								{group.title}
							</h3>
							<ul className="flex flex-col gap-2">
								{group.items.map((item) => (
									<li key={item.href}>
										<Link
											href={item.href}
											className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>

			<div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6">
				<svg viewBox="0 0 1200 120" className="absolute inset-x-0 top-2 h-24 w-full text-primary/40" aria-hidden preserveAspectRatio="none">
					<path
						d="M0 90 C 180 20, 320 120, 520 60 S 860 10, 1000 70 S 1150 90, 1200 40"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeDasharray="2 12"
						strokeLinecap="round"
					/>
				</svg>
				<p
					aria-hidden
					className="select-none bg-gradient-to-b from-foreground/[0.11] to-foreground/[0.02] bg-clip-text pb-2 text-center font-display text-[22vw] font-extrabold leading-[0.8] tracking-tighter text-transparent md:text-[15rem]"
				>
					chalo
				</p>
			</div>

			<div className="border-t border-border/60">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<span>© {new Date().getFullYear()} chalo. Find your way, together.</span>
					<span>No ads. Your location is never sold.</span>
				</div>
			</div>
		</footer>
	);
}
