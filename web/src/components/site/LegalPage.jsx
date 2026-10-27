import {SITE} from '@/lib/site';
import {SiteFooter} from './SiteFooter';
import {SiteHeader} from './SiteHeader';

export function LegalPage({title, updated, children}) {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
				<h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
				<p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
				<div className="prose-page mt-6">{children}</div>
			</main>
			<SiteFooter />
		</>
	);
}

/** How to reach us about data and accounts. */
export function Contact() {
	return SITE.contactEmail ? (
		<a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
	) : (
		<span>the support address listed on chalo&apos;s app store page</span>
	);
}
