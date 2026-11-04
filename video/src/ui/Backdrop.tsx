import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Warm sand with slowly drifting contour lines, like the website. `dark` for night scenes. */
export const Backdrop: React.FC<{dark?: boolean}> = ({dark}) => {
	const frame = useCurrentFrame();
	const drift = frame * 0.25;
	return (
		<AbsoluteFill style={{background: dark ? `radial-gradient(ellipse at 70% 20%, #2A1F1A, ${C.night} 70%)` : `radial-gradient(ellipse at 75% 15%, #FBE3D9, ${C.sand} 60%)`}}>
			<svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0}}>
				<g fill="none" stroke={dark ? 'rgba(255,240,230,0.05)' : 'rgba(80,55,35,0.07)'} strokeWidth="1.4" transform={`translate(${-drift % 60} 0)`}>
					{Array.from({length: 11}).map((_, i) => (
						<path key={i} d={`M -80 ${80 + i * 66} C 200 ${30 + i * 66}, 380 ${200 + i * 66}, 640 ${110 + i * 66} S 1020 ${30 + i * 66}, 1300 ${140 + i * 66}`} />
					))}
				</g>
			</svg>
		</AbsoluteFill>
	);
};
