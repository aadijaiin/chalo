import {FadeImage} from '@/components/ui/FadeImage';
import {cn} from '@/lib/utils';

/**
 * A real screenshot of the app in a phone outline, shimmering until it arrives. Screens are
 * 1220×2712. The shadow sits on the outer box and the clipping on the inner one: Safari's clip
 * layer masks the shadow too, which would leave square corners around the rounded ones.
 */
export function Phone({src, alt, className, priority = false}) {
	return (
		<div className={cn('relative aspect-[1220/2712] shrink-0 rounded-[2.6rem] shadow-lift ring-1 ring-black/5', className)}>
			<div className="skeleton clip-layer absolute inset-0 overflow-hidden rounded-[2.6rem] border-[7px] border-foreground/90 dark:border-white/15">
				<FadeImage src={src} alt={alt} fill sizes="(min-width: 1024px) 340px, 60vw" className="object-cover" priority={priority} />
				<span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
			</div>
		</div>
	);
}
