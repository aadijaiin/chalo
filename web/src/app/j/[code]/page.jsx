import {Eye, Users} from 'lucide-react';
import {Logo} from '@/components/site/Logo';
import {CodeBoxes} from './CodeBoxes';
import OpenInApp from './OpenInApp';

const CODE_LENGTH = 6;

function clean(raw) {
	return String(raw ?? '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase()
		.slice(0, CODE_LENGTH);
}

export async function generateMetadata({params, searchParams}) {
	const code = clean((await params).code);
	if ((await searchParams).as === 'lookout') {
		return {
			title: 'Follow our trip on chalo',
			description: 'See the crew live on one map. Your own location stays private.',
			openGraph: {
				title: 'Follow our trip on chalo',
				description: 'Tap to watch the crew live on the map. Your location isn’t shared.',
			},
		};
	}
	return {
		title: `Join my party on chalo · ${code}`,
		description: 'Tap to join the party and see everyone on one live map.',
		openGraph: {
			title: 'Join my party on chalo',
			description: `Party code ${code}. Tap to open chalo and join.`,
		},
	};
}

/**
 * Where invite links land, styled as a boarding pass: opens the app straight into the party, or
 * shows the code to type in. Lookout links (?as=lookout) invite someone to follow along.
 */
export default async function InvitePage({params, searchParams}) {
	const code = clean((await params).code);
	const valid = code.length === CODE_LENGTH;
	const lookout = (await searchParams).as === 'lookout';

	return (
		<main className="grain relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden bg-background px-4 py-16">
			<div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
			<Logo className="relative" />

			<div className="relative w-full max-w-md">
				<div className="overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-lift">
					<div className="relative flex flex-col gap-6 p-7 sm:p-8">
						<div className="flex items-center justify-between">
							<span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
								{lookout ? <Eye className="size-3.5" /> : <Users className="size-3.5" />}
								{lookout ? 'Be a lookout' : 'You’re invited'}
							</span>
							<span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">chalo pass</span>
						</div>
						<div className="flex flex-col gap-2">
							<h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
								{lookout ? 'Follow the trip on chalo' : 'Join the party on chalo'}
							</h1>
							<p className="text-[15px] leading-relaxed text-muted-foreground">
								{lookout
									? 'See the whole crew live on one map, and hear about arrivals and SOS. Your own location isn’t shared with anyone. The host lets you in.'
									: 'Everyone in the party shows up on one live map, so nobody gets lost on the way.'}
							</p>
						</div>
						{valid ? (
							<div>
								<div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Party code</div>
								<CodeBoxes code={code} />
							</div>
						) : null}
					</div>

					{/* The tear line between the pass and its stub. */}
					<div aria-hidden className="relative h-6">
						<span className="absolute -left-3 top-0 size-6 rounded-full border border-border bg-background" />
						<span className="absolute -right-3 top-0 size-6 rounded-full border border-border bg-background" />
						<span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-border" />
					</div>

					<div className="p-7 pt-4 sm:p-8 sm:pt-4">
						{valid ? (
							<OpenInApp code={code} lookout={lookout} />
						) : (
							<p className="text-sm text-muted-foreground">This invite link looks broken. Ask whoever sent it for the 6-character party code.</p>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
