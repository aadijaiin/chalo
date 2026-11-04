import {SITE} from '@/lib/site';
import {LegalToc} from './LegalToc';
import {SiteFooter} from './SiteFooter';
import {SiteHeader} from './SiteHeader';

export function LegalPage({title, updated, children}) {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
				<div className="max-w-2xl">
					<span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Last updated {updated}</span>
					<h1 className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
				</div>
				<div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_14rem]">
					<article className="prose-page max-w-2xl">{children}</article>
					<LegalToc />
				</div>
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
