import {Download, Smartphone} from 'lucide-react';
import QRCode from 'qrcode';
import {JoinCode} from '@/components/site/JoinCode';
import {Button} from '@/components/ui/Button';
import {Reveal} from '@/components/ui/Reveal';
import {SITE} from '@/lib/site';

/** The end of the page: get the app, or jump straight into a party with a code. */
export async function GetStarted() {
	// On a laptop, the quickest way onto a phone is a QR code.
	const qr = await QRCode.toString(`${SITE.url}/download`, {type: 'svg', margin: 0, color: {dark: '#26211dff', light: '#00000000'}});

	return (
		<section className="relative py-24 sm:py-32">
			<div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
				<Reveal className="grain relative overflow-hidden rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-lift sm:p-12">
					<svg aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-80 text-white/15" viewBox="0 0 200 200">
						<g fill="none" stroke="currentColor" strokeWidth="1.5">
							{[30, 50, 70, 90].map((r) => (
								<circle key={r} cx="100" cy="100" r={r} />
							))}
						</g>
					</svg>
					<div className="relative flex h-full flex-col justify-between gap-10 sm:flex-row sm:items-end">
						<div className="flex max-w-md flex-col gap-5">
							<span className="flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
								<Smartphone className="size-3.5" />
								Android
							</span>
							<h2 className="text-4xl font-extrabold leading-[1] tracking-tight sm:text-5xl">Chalo, let’s go.</h2>
							<p className="text-lg leading-relaxed text-white/85">
								Get the app, start a party, and send the code. Your crew is on the map in a minute.
							</p>
							<Button href="/download" variant="ink" magnetic className="w-fit bg-white text-[hsl(25_12%_14%)] hover:bg-white/90">
								<Download className="size-5" />
								Download for Android
							</Button>
						</div>
						<div className="hidden shrink-0 flex-col items-center gap-2 sm:flex">
							<div className="rounded-3xl bg-white p-4 shadow-lift [&_svg]:size-32" dangerouslySetInnerHTML={{__html: qr}} />
							<span className="text-xs font-semibold text-white/80">Scan with your phone</span>
						</div>
					</div>
				</Reveal>

				<Reveal delay={0.1} id="join" className="rounded-[2.5rem] border border-border bg-card p-8 shadow-soft sm:p-10">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-2">
							<h2 className="text-3xl font-extrabold tracking-tight">Got a party code?</h2>
							<p className="text-muted-foreground">Type the six characters a friend sent you. We’ll open chalo straight into the party.</p>
						</div>
						<JoinCode />
					</div>
				</Reveal>
			</div>
		</section>
	);
}
