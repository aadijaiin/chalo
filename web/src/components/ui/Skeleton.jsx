import {cn} from '@/lib/utils';

/** A shimmering placeholder in the shape of what's coming. */
export function Skeleton({className, ...rest}) {
	return <div aria-hidden className={cn('skeleton rounded-2xl', className)} {...rest} />;
}
