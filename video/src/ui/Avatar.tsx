import React from 'react';
import {Img} from 'remotion';
import {avatar} from '../theme';

export const Avatar: React.FC<{seed: string; size: number; color: string; ring?: number; style?: React.CSSProperties}> = ({
	seed,
	size,
	color,
	ring = 0.09,
	style,
}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size,
			background: color,
			padding: size * ring,
			boxSizing: 'border-box',
			boxShadow: `0 ${size * 0.08}px ${size * 0.2}px rgba(40,25,15,0.25)`,
			...style,
		}}
	>
		<Img src={avatar(seed)} style={{width: '100%', height: '100%', borderRadius: size, display: 'block'}} />
	</div>
);
