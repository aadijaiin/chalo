import {Download, FileDown, Globe, MonitorSmartphone, ShieldCheck, Smartphone, Sparkles, TriangleAlert} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {InstallChip} from '@/components/download/InstallChip';
import {Phone} from '@/components/site/Phone';
import {SiteFooter} from '@/components/site/SiteFooter';
import {SiteHeader} from '@/components/site/SiteHeader';
import {Button} from '@/components/ui/Button';
import {Reveal, Stagger, staggerItem} from '@/components/ui/Reveal';
import {MotionLi} from '@/components/home/MotionLi';
import {SITE} from '@/lib/site';
import latest from '../../../public/download/latest.json';

export const metadata = {
	title: 'Download chalo for Android',
	description: 'Get the chalo app for Android: live location for your crew, on one map.',
};

const STEPS = [
	{icon: FileDown, title: 'Download', body: `Tap the button. Your browser saves chalo.apk (${latest.size ?? 'about 50 MB'}).`},
	{
		icon: MonitorSmartphone,
		title: 'Open it',
		body: 'Open it from the download notification or your Downloads. If Android asks, allow your browser to install apps.',
	},
	{icon: Sparkles, title: 'Install & sign up', body: 'Tap Install, open chalo, and make your account. Start a party or join one with a code.'},
];

/** The Android app, straight from the newest release, until it's in the Play Store. */
export default async function DownloadPage() {
	const qr = await QRCode.toString(`${SITE.url}/download`, {type: 'svg', margin: 0, color: {dark: '#26211dff', light: '#00000000'}});

	return (
		<>
			<SiteHeader />
			<main className="overflow-hidden">
				<section className="grain relative pb-20 pt-32 sm:pt-40">
					<div aria-hidden className="pointer-events-none absolute -right-40 -top-20 size-[40rem] rounded-full bg-primary/15 blur-[120px]" />
					<div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
						<div className="flex flex-col gap-7">
							<Reveal>
								<span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur">
									<Smartphone className="size-3.5 text-sage" />
									Android · version {latest.version}
								</span>
							</Reveal>
							<Reveal delay={0.06}>
								<h1 className="text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
									Get chalo
									<br />
									<span className="text-primary">for Android</span>
								</h1>
							</Reveal>
							<Reveal delay={0.12}>
								<p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
									chalo isn&apos;t in the Play Store yet, so you install it straight from here. Same app, and it tells you
									when there&apos;s a new version.
								</p>
							</Reveal>
							<Reveal delay={0.18} className="flex flex-col gap-5 sm:flex-row sm:items-center">
								<Button href={SITE.apkUrl} magnetic>
									<Download className="size-5" />
									Download chalo.apk
								</Button>
								<dl className="flex gap-5 text-sm">
									<div>
										<dt className="text-muted-foreground">Size</dt>
										<dd className="font-bold">{latest.size ?? '~50 MB'}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Version</dt>
										<dd className="font-bold">{latest.version}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Price</dt>
										<dd className="font-bold">Free</dd>
									</div>
								</dl>
							</Reveal>
							<Reveal delay={0.24} className="hidden items-center gap-4 rounded-3xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur lg:flex lg:w-fit">
								<div className="rounded-2xl bg-white p-2.5 [&_svg]:size-24" dangerouslySetInnerHTML={{__html: qr}} />
								<p className="max-w-[14rem] text-sm text-muted-foreground">
									<strong className="block text-foreground">On a computer?</strong>
									Scan this with your Android phone to open this page there.
								</p>
							</Reveal>
						</div>

						<Reveal delay={0.1} className="relative mx-auto w-64 sm:w-72">
							<Phone src="/screens/map.webp" alt="The chalo live map with the crew on the road" priority className="w-full -rotate-3" />
							<InstallChip />
						</Reveal>
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
					<Reveal>
						<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps, about a minute</h2>
					</Reveal>
					<Stagger as="ol" className="mt-10 grid gap-4 md:grid-cols-3">
						{STEPS.map(({icon: Icon, title, body}, i) => (
							<MotionLi key={title} variants={staggerItem} className="relative flex flex-col gap-4 rounded-4xl border border-border bg-card p-6 shadow-soft">
								<span className="absolute right-6 top-5 font-display text-5xl font-extrabold text-foreground/[0.07]">{i + 1}</span>
								<span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
									<Icon className="size-5" />
								</span>
								<h3 className="text-xl font-extrabold">{title}</h3>
								<p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
							</MotionLi>
						))}
					</Stagger>
				</section>

				<section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
					<Reveal className="grid gap-6 rounded-4xl border border-border bg-card p-6 shadow-soft sm:grid-cols-[1fr_auto] sm:p-8">
						<div className="flex flex-col gap-3">
							<span className="flex size-11 items-center justify-center rounded-2xl bg-amber/15 text-amber">
								<TriangleAlert className="size-5" />
							</span>
							<h2 className="font-sans text-xl font-extrabold">“Unsafe app” or a Play Protect warning?</h2>
							<p className="text-[15px] leading-relaxed text-muted-foreground">
								Android shows this for any app that doesn&apos;t come from the Play Store. Tap <strong className="text-foreground">More details</strong>,
								then <strong className="text-foreground">Install anyway</strong>. chalo is built from{' '}
								<a href="https://github.com/aadijaiin/chalo" className="font-semibold text-primary hover:underline">
									public source code
								</a>
								.
							</p>
						</div>
						{/* A sketch of the dialog, with the taps to make. */}
						<div aria-hidden className="mx-auto w-56 rounded-3xl border border-border bg-background p-4 text-sm shadow-soft">
							<div className="flex items-center gap-2 font-bold">
								<ShieldCheck className="size-4 text-sage" />
								Play Protect
							</div>
							<p className="mt-2 text-xs text-muted-foreground">Android double-checks apps that don&apos;t come from the Play Store.</p>
							<div className="mt-3 flex flex-col gap-1.5 text-xs font-bold">
								<span className="relative rounded-xl bg-primary/12 px-3 py-2 text-primary">
									1 · More details
									<span className="absolute -right-1.5 -top-1.5 size-3 animate-ping-ring rounded-full bg-primary" />
								</span>
								<span className="rounded-xl bg-muted px-3 py-2">2 · Install anyway</span>
							</div>
						</div>
					</Reveal>
					<Reveal delay={0.08} className="flex flex-col gap-3 rounded-4xl border border-border bg-card p-6 shadow-soft sm:p-8">
						<span className="flex size-11 items-center justify-center rounded-2xl bg-sage/15 text-sage">
							<Globe className="size-5" />
						</span>
						<h2 className="font-sans text-xl font-extrabold">On iPhone?</h2>
						<p className="text-[15px] leading-relaxed text-muted-foreground">
							chalo isn&apos;t on the App Store yet. The host of a trip can send you a watch link to follow the crew in
							your browser, no app needed.
						</p>
						<Link href="/#lookouts" className="mt-auto font-bold text-primary hover:underline">
							How watch links work →
						</Link>
					</Reveal>
				</section>
			</main>
			<SiteFooter />
		</>
	);
}
