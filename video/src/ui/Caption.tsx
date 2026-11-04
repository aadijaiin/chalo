import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Placed} from '../timeline';
import {C, CAST, display, text} from '../theme';
import {Avatar} from './Avatar';
import {useLayout} from './layout';
import {LogoMark} from './Logo';

/**
 * The line being spoken: who's speaking (avatar + name, or the chalo mark for the narrator) and
 * the words, each landing as it's said (from ElevenLabs' word timings; whole line otherwise).
 */
export const Caption: React.FC<{line: Placed; dark?: boolean; offsetY?: number}> = ({line, dark, offsetY = 0}) => {
	const frame = useCurrentFrame() - line.from;
	const {fps} = useVideoConfig();
	const L = useLayout();
	// Stay a beat after the line, but be gone before the next line's caption arrives.
	const holdFrames = Math.min(line.frames + Math.round(0.35 * fps), (line.until ?? Infinity) - 8);
	if (frame < -4 || frame > holdFrames + 8) return null;

	const enter = spring({frame: frame + 4, fps, config: {damping: 18, stiffness: 180}});
	const leave = interpolate(frame, [holdFrames, holdFrames + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const who = line.who as keyof typeof CAST | 'narrator' | 'crew';
	const person = who in CAST ? CAST[who as keyof typeof CAST] : null;
	const ink = dark ? '#FFF6EE' : C.ink;

	const words = line.words.length ? line.words : line.text.split(' ').map((t, i, all) => ({text: t, start: (i / all.length) * line.duration * 0.6, end: 0}));
	const size = L.caption.size * (line.text.length > 34 ? 0.82 : 1);

	return (
		<div
			style={{
				position: 'absolute',
				left: L.caption.left,
				right: L.portrait ? L.caption.right : undefined,
				width: L.portrait ? undefined : L.width * 0.4,
				top: L.caption.top !== undefined ? L.caption.top + offsetY : undefined,
				bottom: L.caption.bottom !== undefined ? L.caption.bottom - offsetY : undefined,
				textAlign: L.caption.align,
				opacity: leave,
				transform: `translateY(${(1 - enter) * 30}px)`,
			}}
		>
			<div style={{display: 'inline-flex', alignItems: 'center', gap: 16, marginBottom: 22, opacity: enter}}>
				{person ? (
					<Avatar seed={person.seed} size={64} color={person.color} />
				) : who === 'crew' ? (
					<div style={{display: 'flex'}}>
						{(['riya', 'kabir', 'zoya', 'aadi'] as const).map((p, i) => (
							<Avatar key={p} seed={CAST[p].seed} size={58} color={CAST[p].color} style={{marginLeft: i ? -18 : 0}} />
						))}
					</div>
				) : (
					<div style={{width: 64, height: 64, borderRadius: 64, background: dark ? 'rgba(255,255,255,0.1)' : C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(40,25,15,0.15)'}}>
						<LogoMark size={40} />
					</div>
				)}
				<span
					style={{
						fontFamily: text,
						fontWeight: 800,
						fontSize: 28,
						letterSpacing: 2,
						textTransform: 'uppercase',
						color: person ? person.color : who === 'crew' ? C.primary : dark ? 'rgba(255,246,238,0.7)' : C.muted,
					}}
				>
					{person ? person.name : who === 'crew' ? 'Everyone' : 'chalo'}
				</span>
			</div>
			<div style={{fontFamily: display, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: -1.5, color: ink}}>
				{words.map((w, i) => {
					const at = Math.round(w.start * fps);
					const shown = spring({frame: frame - at, fps, config: {damping: 16, stiffness: 220}});
					const active = frame >= at && frame <= Math.round((w.end || w.start + 0.35) * fps) + 3;
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								marginRight: size * 0.24,
								opacity: interpolate(shown, [0, 1], [0.12, 1]),
								transform: `translateY(${(1 - shown) * size * 0.25}px)`,
								color: active && !dark ? C.primaryDeep : active ? '#FFB49F' : undefined,
							}}
						>
							{w.text}
						</span>
					);
				})}
			</div>
		</div>
	);
};
