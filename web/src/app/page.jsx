import {
	BatteryMedium,
	Coffee,
	Eye,
	EyeOff,
	Flag,
	MapPin,
	Route,
	ShieldCheck,
	Siren,
	Snail,
	Users,
	WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import {JoinCode} from '@/components/site/JoinCode';
import {Phone} from '@/components/site/Phone';
import {SiteFooter} from '@/components/site/SiteFooter';
import {SiteHeader} from '@/components/site/SiteHeader';
import {SITE} from '@/lib/site';

const FEATURES = [
	{
		icon: Users,
		title: 'Everyone on one map',
		body: 'Start a party, share the code, and the whole crew shows up live with their own avatar. Pins glide as people move.',
	},
	{
		icon: Flag,
		title: 'Destination and ETAs',
		body: 'Set where you’re headed and everyone gets their own route, distance left and an ETA that learns how you actually drive.',
	},
	{
		icon: Coffee,
		title: 'One-tap pings',
		body: 'Chai stop, fuel, food, wait up, or your own words. Everyone gets a notification, even with their phone locked.',
	},
	{
		icon: Siren,
		title: 'SOS that can’t go off by accident',
		body: 'Hold to send. It stays up until you’re OK, and the crew can jump straight to where you are.',
	},
	{
		icon: MapPin,
		title: 'Stops and meetups',
		body: 'Long-press to drop a dhaba, a fuel pump or a regroup point. Stops become part of everyone’s route.',
	},
	{
		icon: Snail,
		title: 'Nobody gets left behind',
		body: 'If someone drops 5 km behind the group, everyone hears about it. Tap their avatar for a route to go meet them.',
	},
	{
		icon: WifiOff,
		title: 'Works without signal',
		body: 'Save the map along your route before the ghats, and it keeps working when the network doesn’t.',
	},
	{
		icon: BatteryMedium,
		title: 'Dying phone, or just quiet?',
		body: 'See each person’s battery, and chalo tells you when someone has probably just lost signal.',
	},
	{
		icon: Eye,
		title: 'Lookouts for the folks at home',
		body: 'Parents can follow the trip live without joining it. They see the crew; nobody sees them.',
	},
	{
		icon: Route,
		title: 'A recap of the trip',
		body: 'When the party ends: everyone’s route on one map, kilometres covered, top speed and stops made.',
	},
];

const STEPS = [
	{title: 'Start a party', body: 'Give it a name and you get a six-character code.'},
	{title: 'Share the code', body: 'Send the invite link. Friends tap it and they’re in.'},
	{title: 'Chalo', body: 'Everyone’s on the map until the party ends. Then sharing stops for all.'},
];

const LOOKOUT_POINTS = [
	{
		icon: Eye,
		title: 'The whole crew, live',
		body: 'Everyone’s position, their route and ETA to the destination, updating as they drive.',
	},
	{
		icon: Siren,
		title: 'Only the alerts that matter',
		body: 'SOS, arrivals and anyone falling behind. None of the chai-stop chatter.',
	},
	{
		icon: EyeOff,
		title: 'Nothing of theirs is shared',
		body: 'A lookout never posts a location. The crew sees who’s watching, anyone can hide from lookouts, and the host can remove one.',
	},
];

const PROMISES = [
	'Your location is only shared with a party you’ve joined, and only while you’re in it.',
	'Leave or end the party and sharing stops right away. Parties also end by themselves after 24 hours.',
	'Lookouts never share their location, and everyone in the party can see who’s watching.',
	'Route trails for the trip recap are deleted after 30 days.',
	'No ads, and we don’t sell your data.',
];

function StoreButtons() {
	const stores = [
		{label: 'Get it on Google Play', href: SITE.playStoreUrl},
		{label: 'Download on the App Store', href: SITE.appStoreUrl},
	].filter((s) => s.href);

	if (stores.length === 0) {
		return (
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<span className="inline-flex h-14 items-center rounded-2xl bg-foreground px-6 font-bold text-background">
					Coming soon to Android and iPhone
				</span>
				<Link href="#join" className="px-2 font-bold text-primary hover:underline">
					Have a party code?
				</Link>
			</div>
		);
	}
	return (
		<div className="flex flex-wrap gap-3">
			{stores.map((s) => (
				<a
					key={s.href}
					href={s.href}
					className="inline-flex h-14 items-center rounded-2xl bg-foreground px-6 font-bold text-background transition-opacity hover:opacity-90"
				>
					{s.label}
				</a>
			))}
		</div>
	);
}

export default function Home() {
	return (
		<>
			<SiteHeader />
			<main>
				<section className="relative overflow-hidden">
					<div className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-primary/10 blur-3xl" />
					<div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
						<div className="flex flex-col gap-7">
							<span className="inline-flex w-fit items-center gap-2 rounded-full bg-sage/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sage">
								<span className="size-2 rounded-full bg-sage" />
								For road trips and group rides
							</span>
							<h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
								Find your way, <span className="text-primary">together.</span>
							</h1>
							<p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
								Start a party and everyone in it shows up on one live map, so you always know
								who&apos;s ahead, who&apos;s behind, and when they&apos;ll get there.
							</p>
							<StoreButtons />
						</div>
						<div className="flex justify-center lg:justify-end">
							<Phone src="/screens/map.webp" alt="The chalo live map with the crew and their ETAs" className="w-72 sm:w-80" priority />
						</div>
					</div>
				</section>

				<section id="features" className="scroll-mt-16 border-t border-border/60 bg-card/40">
					<div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
						<div className="max-w-2xl">
							<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Everything the group chat can&apos;t do</h2>
							<p className="mt-3 text-lg text-muted-foreground">
								No more “where are you?” every ten minutes. chalo keeps the whole crew in step.
							</p>
						</div>
						<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map(({icon: Icon, title, body}) => (
								<div key={title} className="rounded-3xl border border-border bg-card p-6">
									<div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10">
										<Icon className="size-5 text-primary" />
									</div>
									<h3 className="font-bold">{title}</h3>
									<p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
					<div className="grid items-center gap-14 lg:grid-cols-2">
						<div className="flex justify-center gap-3 sm:gap-5">
							<Phone src="/screens/lobby.webp" alt="A party lobby with the destination, ETA and the crew" className="w-[46%] max-w-72" />
							<Phone src="/screens/recap.webp" alt="A trip recap with everyone's route" className="mt-12 w-[46%] max-w-72" />
						</div>
						<div>
							<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Up and running in a minute</h2>
							<ol className="mt-8 flex flex-col gap-6">
								{STEPS.map((s, i) => (
									<li key={s.title} className="flex gap-4">
										<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
											{i + 1}
										</span>
										<div>
											<h3 className="text-lg font-bold">{s.title}</h3>
											<p className="text-muted-foreground">{s.body}</p>
										</div>
									</li>
								))}
							</ol>
						</div>
					</div>
				</section>

				<section id="lookouts" className="scroll-mt-16 border-t border-border/60 bg-primary/5">
					<div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
						<div>
							<span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
								<Eye className="size-3.5" />
								New · Lookouts
							</span>
							<h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
								Let the folks at home follow along
							</h2>
							<p className="mt-3 max-w-xl text-lg text-muted-foreground">
								Add your parents as lookouts and they can watch the trip live, without being on it. It
								only goes one way: they see the crew, and nobody sees them.
							</p>
							<ul className="mt-8 flex flex-col gap-5">
								{LOOKOUT_POINTS.map(({icon: Icon, title, body}) => (
									<li key={title} className="flex gap-4">
										<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm">
											<Icon className="size-5 text-primary" />
										</span>
										<div>
											<h3 className="font-bold">{title}</h3>
											<p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
										</div>
									</li>
								))}
							</ul>
							<p className="mt-8 text-sm text-muted-foreground">
								In the party lobby, tap <strong className="text-foreground">Add a lookout</strong> and send
								the link. No app on their end? Send a <strong className="text-foreground">web link</strong>{' '}
								and they can follow along in the browser until the trip ends.
							</p>
						</div>
						<div className="relative flex justify-center lg:justify-end">
							<Phone src="/screens/lookout.webp" alt="A lookout following the crew on the live map" className="w-64 sm:w-80" />
							<div className="absolute bottom-10 left-0 flex max-w-64 items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-black/10 backdrop-blur sm:left-4 lg:-left-6">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
									<Eye className="size-4 text-primary" />
								</span>
								<div className="text-left">
									<p className="text-sm font-bold leading-tight">Mom is watching Lonavala ride</p>
									<p className="text-xs text-muted-foreground">Her location isn&apos;t shared.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-y border-border/60 bg-sage/10">
					<div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
						<div>
							<div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-sage/20">
								<ShieldCheck className="size-6 text-sage" />
							</div>
							<h2 className="text-3xl font-extrabold tracking-tight">Shared on your terms</h2>
							<p className="mt-3 text-muted-foreground">
								Location is personal. chalo shares yours with the people you choose, for as long
								as the trip lasts, and no longer.
							</p>
							<Link href="/privacy" className="mt-5 inline-block font-bold text-primary hover:underline">
								Read the privacy policy
							</Link>
						</div>
						<ul className="grid gap-3 sm:grid-cols-2">
							{PROMISES.map((p) => (
								<li key={p} className="rounded-3xl bg-card p-5 text-[15px] leading-relaxed sm:last:odd:col-span-2">
									{p}
								</li>
							))}
						</ul>
					</div>
				</section>

				<section id="join" className="scroll-mt-16 mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
					<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Got a party code?</h2>
					<p className="max-w-md text-muted-foreground">
						Enter the six characters your friend sent you and we&apos;ll open chalo straight into the party.
					</p>
					<JoinCode />
				</section>
			</main>
			<SiteFooter />
		</>
	);
}
