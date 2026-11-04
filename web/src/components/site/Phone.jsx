import Image from 'next/image';
import {cn} from '@/lib/utils';

/** A real screenshot of the app in a phone outline. Screens are 1220×2712 (Android). */
export function Phone({src, alt, className, priority = false}) {
	return (
		<div
			className={cn(
				'relative aspect-[1220/2712] shrink-0 overflow-hidden rounded-[2.6rem] border-[7px] border-foreground/90 bg-card shadow-lift ring-1 ring-black/5 dark:border-white/15',
				className,
			)}
		>
			<Image src={src} alt={alt} fill sizes="(min-width: 1024px) 340px, 60vw" className="object-cover" priority={priority} />
			<span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
		</div>
	);
}
