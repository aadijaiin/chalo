import React from 'react';
import {C} from '../theme';

/** The chalo mark: a pin whose head is two travellers side by side. */
export const LogoMark: React.FC<{size: number; color?: string}> = ({size, color = C.primary}) => (
	<svg width={size} height={size} viewBox="0 0 48 48">
		<path d="M24 3C14.6 3 7 10.4 7 19.6 7 31.7 24 45 24 45s17-13.3 17-25.4C41 10.4 33.4 3 24 3Z" fill={color} />
		<circle cx="18.5" cy="19" r="5" fill="#fff" />
		<circle cx="29.5" cy="19" r="5" fill="#fff" opacity="0.75" />
	</svg>
);
