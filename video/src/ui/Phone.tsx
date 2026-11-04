import React from 'react';
import {C} from '../theme';

/** A phone outline at a given height (Android screen ratio 1220×2712). */
export const Phone: React.FC<{height: number; children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({
	height,
	children,
	style,
	glow,
}) => {
	const width = (height * 1220) / 2712;
	const border = height * 0.014;
	return (
		<div
			style={{
				width,
				height,
				borderRadius: height * 0.06,
				background: C.ink,
				padding: border,
				boxSizing: 'border-box',
				boxShadow: `0 ${height * 0.04}px ${height * 0.09}px -${height * 0.02}px rgba(40,25,15,0.35)${glow ? `, 0 0 ${height * 0.12}px ${glow}` : ''}`,
				...style,
			}}
		>
			<div style={{width: '100%', height: '100%', borderRadius: height * 0.05, overflow: 'hidden', position: 'relative', background: C.sand}}>
				{children}
			</div>
		</div>
	);
};
