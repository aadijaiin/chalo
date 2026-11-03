import Image from 'next/image';
import {cn} from '@/lib/utils';

/** A real screenshot of the app in a simple phone outline. Screens are 1220×2712 (Android). */
export function Phone({src, alt, className, priority = false}) {
	return (
		<div
			className={cn(
				'relative aspect-[1220/2712] shrink-0 overflow-hidden rounded-[2.4rem] border-[6px] border-foreground/90 bg-card shadow-2xl shadow-black/20 dark:border-white/15',
				className,
			)}
		>
			<Image src={src} alt={alt} fill sizes="(min-width: 1024px) 340px, 60vw" className="object-cover" priority={priority} />
		</div>
	);
}
