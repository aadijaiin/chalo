import Link from 'next/link';

/** The chalo mark (same as the app's): a location pin whose head is two travellers side by side. */
export function LogoMark({size = 32}) {
	return (
		<svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
			<path
				d="M24 3C14.6 3 7 10.4 7 19.6 7 31.7 24 45 24 45s17-13.3 17-25.4C41 10.4 33.4 3 24 3Z"
				fill="var(--primary)"
			/>
			<circle cx="18.5" cy="19" r="5" fill="#fff" />
			<circle cx="29.5" cy="19" r="5" fill="#fff" opacity="0.75" />
		</svg>
	);
}

export function Logo() {
	return (
		<Link href="/" className="flex items-center gap-2" aria-label="chalo home">
			<LogoMark />
			<span className="text-xl font-extrabold tracking-tight">chalo</span>
		</Link>
	);
}
