import {Logo} from '@/components/site/Logo';
import OpenInApp from './OpenInApp';

const CODE_LENGTH = 6;

function clean(raw) {
	return String(raw ?? '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase()
		.slice(0, CODE_LENGTH);
}

export async function generateMetadata({params}) {
	const code = clean((await params).code);
	return {
		title: `Join my party on chalo · ${code}`,
		description: 'Tap to join the party and see everyone on one live map.',
		openGraph: {
			title: 'Join my party on chalo',
			description: `Party code ${code}. Tap to open chalo and join.`,
		},
	};
}

/** Where invite links land: opens the app straight into the party, or shows the code to type in. */
export default async function InvitePage({params}) {
	const code = clean((await params).code);
	const valid = code.length === CODE_LENGTH;

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16">
			<Logo />
			<div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold uppercase tracking-widest text-primary">
						You&apos;re invited
					</p>
					<h1 className="text-2xl font-extrabold text-foreground">Join the party on chalo</h1>
					<p className="text-sm text-muted-foreground">
						Everyone in the party shows up on one live map, so nobody gets lost on the way.
					</p>
				</div>

				{valid ? (
					<>
						<div className="flex justify-between gap-1.5" aria-label={`Party code ${code}`}>
							{code.split('').map((c, i) => (
								<span
									key={i}
									className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground"
								>
									{c}
								</span>
							))}
						</div>
						<OpenInApp code={code} />
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						This invite link looks broken. Ask whoever sent it for the 6-character party code.
					</p>
				)}
			</div>
		</main>
	);
}
