import Link from 'next/link';
import {cn} from '@/lib/utils';

/** The chalo mark (same as the app's): a location pin whose head is two travellers side by side. */
export function LogoMark({size = 32, className}) {
	return (
		<svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
			<path
				d="M24 3C14.6 3 7 10.4 7 19.6 7 31.7 24 45 24 45s17-13.3 17-25.4C41 10.4 33.4 3 24 3Z"
				fill="var(--primary)"
			/>
			<circle cx="18.5" cy="19" r="5" fill="#fff" className="origin-[18.5px_19px] transition-transform duration-300 group-hover/logo:-translate-y-0.5" />
			<circle
				cx="29.5"
				cy="19"
				r="5"
				fill="#fff"
				opacity="0.75"
				className="origin-[29.5px_19px] transition-transform delay-75 duration-300 group-hover/logo:-translate-y-0.5"
			/>
		</svg>
	);
}

export function Logo({className}) {
	return (
		<Link href="/" className={cn('group/logo flex items-center gap-2', className)} aria-label="chalo home">
			<LogoMark className="transition-transform duration-300 group-hover/logo:-rotate-6 group-hover/logo:scale-105" />
			<span className="font-display text-xl font-extrabold tracking-tight">chalo</span>
		</Link>
	);
}
