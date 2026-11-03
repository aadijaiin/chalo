import {Download, ShieldCheck, Smartphone} from 'lucide-react';
import Link from 'next/link';
import {SiteFooter} from '@/components/site/SiteFooter';
import {SiteHeader} from '@/components/site/SiteHeader';
import {SITE} from '@/lib/site';
import latest from '../../../public/download/latest.json';

export const metadata = {
	title: 'Download chalo for Android',
	description: 'Get the chalo app for Android: live location for your crew, on one map.',
};

const STEPS = [
	{title: 'Download the app', body: 'Tap the button. Your browser saves chalo.apk (about 50 MB).'},
	{
		title: 'Open it',
		body: 'Open the download from the notification or your Downloads. If Android asks, allow your browser to install apps.',
	},
	{title: 'Install and sign up', body: 'Tap Install, then open chalo and create your account.'},
];

/** The Android app, straight from the newest release, until it's in the Play Store. */
export default function DownloadPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6">
				<div className="flex flex-col gap-4">
					<span className="inline-flex w-fit items-center gap-2 rounded-full bg-sage/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sage">
						<Smartphone className="size-3.5" />
						Android · version {latest.version}
					</span>
					<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Get chalo for Android</h1>
					<p className="text-lg text-muted-foreground">
						chalo isn&apos;t in the Play Store yet, so you install it straight from here. It&apos;s the same app,
						and it tells you when there&apos;s a new version.
					</p>
					<a
						href={SITE.apkUrl}
						className="inline-flex h-14 w-fit items-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90"
					>
						<Download className="size-5" />
						Download chalo.apk
					</a>
				</div>

				<ol className="flex flex-col gap-5">
					{STEPS.map((s, i) => (
						<li key={s.title} className="flex gap-4">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
								{i + 1}
							</span>
							<div>
								<h2 className="text-lg font-bold">{s.title}</h2>
								<p className="text-muted-foreground">{s.body}</p>
							</div>
						</li>
					))}
				</ol>

				<div className="flex gap-4 rounded-3xl border border-border bg-card p-6">
					<ShieldCheck className="size-6 shrink-0 text-sage" />
					<div className="flex flex-col gap-2 text-[15px] leading-relaxed text-muted-foreground">
						<p>
							<strong className="text-foreground">&ldquo;Unsafe app&rdquo; or Play Protect warning?</strong> Android
							shows it for apps that don&apos;t come from the Play Store. Choose <em>More details → Install anyway</em>.
							The app is built from this project&apos;s{' '}
							<a href="https://github.com/aadijaiin/chalo" className="font-semibold text-primary hover:underline">
								public source code
							</a>
							.
						</p>
						<p>
							<strong className="text-foreground">On iPhone?</strong> chalo isn&apos;t on the App Store yet. Your
							friends can still send you a watch link to follow their trip in the browser.
						</p>
					</div>
				</div>

				<p className="text-sm text-muted-foreground">
					Already have a party code? <Link href="/#join" className="font-semibold text-primary hover:underline">Join from here</Link>.
				</p>
			</main>
			<SiteFooter />
		</>
	);
}
