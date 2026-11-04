'use client';

import Image from 'next/image';
import {useState} from 'react';
import {cn} from '@/lib/utils';

/** next/image that fades in once loaded; put it on a .skeleton so the wait shimmers instead of flashing. */
export function FadeImage({alt, className, onLoad, ...props}) {
	const [loaded, setLoaded] = useState(false);
	return (
		<Image
			{...props}
			alt={alt}
			onLoad={(e) => {
				setLoaded(true);
				onLoad?.(e);
			}}
			className={cn('transition-opacity duration-500 ease-out', loaded ? 'opacity-100' : 'opacity-0', className)}
		/>
	);
}
