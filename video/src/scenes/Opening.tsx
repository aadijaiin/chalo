import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../timeline';
import {C, CAST, display, text} from '../theme';
import {Avatar} from '../ui/Avatar';
import {Backdrop} from '../ui/Backdrop';
import {Caption} from '../ui/Caption';
import {useLayout} from '../ui/layout';
import {LogoMark} from '../ui/Logo';

type Who = keyof typeof CAST;
// The group chat on every trip. Times are seconds into the scene; the pile-up speeds up.
const BUBBLES: {who: Who; text: string; t: number}[] = [
	{who: 'kabir', text: 'where are you??', t: 0.2},
	{who: 'riya', text: 'reached?', t: 0.55},
	{who: 'zoya', text: 'bhai location bhej', t: 0.9},
	{who: 'aadi', text: '5 min away', t: 1.25},
	{who: 'kabir', text: 'WHERE ARE YOU', t: 1.6},
	{who: 'riya', text: 'which exit did you take', t: 1.85},
	{who: 'zoya', text: 'my phone is at 9%', t: 2.1},
	{who: 'aadi', text: 'still 5 min', t: 2.3},
	{who: 'kabir', text: 'hello???', t: 2.5},
	{who: 'riya', text: 'call me', t: 2.65},
	{who: 'zoya', text: 'network gone', t: 2.8},
	{who: 'kabir', text: 'kahan ho', t: 2.95},
];

/** Night. The group chat explodes with "where are you", the phone buzzing on the table. */
export const Hook: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const end = scene.frames;
	// Everything gets sucked into the centre at the end, becoming the pin in the next scene.
	const collapse = interpolate(frame, [end - 12, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	const buzz = Math.sin(frame * 2.6) * interpolate(frame % 24, [0, 6, 7, 24], [0, 4, 0, 0]);

	const area = L.portrait
		? {x: 70, y: 150, w: L.width - 140, h: L.height * 0.52}
		: {x: L.width * 0.52, y: 110, w: L.width * 0.4, h: L.height - 220};

	return (
		<AbsoluteFill>
			<Backdrop dark />
			<div style={{position: 'absolute', left: area.x, top: area.y, width: area.w, height: area.h, transform: `translateX(${buzz}px)`}}>
				{BUBBLES.map((b, i) => {
					const at = Math.round(b.t * fps);
					const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 240}});
					if (frame < at) return null;
					// Later bubbles land further down and shuffle older ones up and out.
					const row = i - Math.max(0, BUBBLES.filter((x) => Math.round(x.t * fps) <= frame).length - 9);
					const left = i % 2 === 0;
					const y = row * (area.h / 9.5);
					const p = CAST[b.who];
					const cx = area.w / 2;
					const cy = area.h / 2;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								top: interpolate(collapse, [0, 1], [y, cy]),
								left: left ? interpolate(collapse, [0, 1], [0, cx - 100]) : undefined,
								right: left ? undefined : interpolate(collapse, [0, 1], [0, cx - 100]),
								display: 'flex',
								flexDirection: left ? 'row' : 'row-reverse',
								alignItems: 'center',
								gap: 14,
								opacity: interpolate(row, [-2, 0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (1 - collapse),
								transform: `scale(${interpolate(s, [0, 1], [0.6, 1]) * (1 - collapse * 0.7)}) rotate(${(i % 3) - 1}deg)`,
								transformOrigin: left ? 'left center' : 'right center',
							}}
						>
							<Avatar seed={p.seed} size={52} color={p.color} />
							<div
								style={{
									background: left ? '#2C302C' : C.primary,
									color: '#FFF6EE',
									fontFamily: text,
									fontWeight: 700,
									fontSize: L.portrait ? 36 : 32,
									padding: '14px 22px',
									borderRadius: 26,
									borderBottomLeftRadius: left ? 6 : 26,
									borderBottomRightRadius: left ? 26 : 6,
									whiteSpace: 'nowrap',
								}}
							>
								{b.text}
							</div>
						</div>
					);
				})}
			</div>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} dark />
			))}
		</AbsoluteFill>
	);
};

/** Daylight. The pin drops, the route draws itself, the crew pops on: chalo. */
export const Reveal: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const drop = spring({frame: frame - 2, fps, config: {damping: 9, stiffness: 140, mass: 0.8}});
	const draw = interpolate(frame, [8, 8 + fps * 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const word = spring({frame: frame - 10, fps, config: {damping: 15, stiffness: 160}});
	const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});

	const box = L.portrait
		? {x: 60, y: 330, w: L.width - 120, h: L.height * 0.42}
		: {x: L.width * 0.48, y: 120, w: L.width * 0.46, h: L.height - 240};
	const ROUTE = 'M 40 360 C 120 340, 160 290, 230 280 S 330 270, 360 220 S 400 150, 470 130 S 560 90, 600 40';
	const crew = (['zoya', 'kabir', 'aadi', 'riya'] as const).map((k, i) => ({...CAST[k], k, at: 0.25 + i * 0.18}));

	return (
		<AbsoluteFill style={{opacity: fadeIn}}>
			<Backdrop />
			<div
				style={{
					position: 'absolute',
					left: box.x,
					top: box.y,
					width: box.w,
					height: box.h,
					borderRadius: 48,
					overflow: 'hidden',
					background: C.mapLand,
					boxShadow: '0 40px 80px -30px rgba(60,35,20,0.35)',
					border: `2px solid ${C.border}`,
				}}
			>
				<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" style={{width: '100%', height: '100%'}}>
					<ellipse cx="120" cy="90" rx="90" ry="55" fill={C.mapPark} />
					<ellipse cx="540" cy="320" rx="110" ry="60" fill={C.mapPark} />
					<path d="M -10 230 C 80 215, 140 270, 220 255 S 360 180, 450 200 S 600 270, 660 250 L 660 275 C 600 290, 520 230, 450 225 S 330 205, 230 280 S 80 245, -10 255 Z" fill={C.mapWater} />
					<g stroke="#E9E1D3" strokeWidth="10" fill="none" strokeLinecap="round">
						<path d="M 0 330 L 260 310 L 640 360" />
						<path d="M 200 0 L 240 160 L 360 220" />
					</g>
					<path d={ROUTE} fill="none" stroke={C.mapHighway} strokeWidth="16" strokeLinecap="round" />
					<path d={ROUTE} fill="none" stroke={C.primary} strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
				</svg>
				{crew.map((p, i) => {
					const pts = [
						[0.17, 0.82],
						[0.36, 0.69],
						[0.56, 0.52],
						[0.74, 0.32],
					][i];
					const s = spring({frame: frame - Math.round((p.at + 0.9) * fps), fps, config: {damping: 11, stiffness: 200}});
					return (
						<div key={p.k} style={{position: 'absolute', left: `${pts[0] * 100}%`, top: `${pts[1] * 100}%`, transform: `translate(-50%, -100%) scale(${s})`}}>
							<Avatar seed={p.seed} size={L.portrait ? 92 : 84} color={p.color} />
						</div>
					);
				})}
				{/* The destination pin drops in with a bounce. */}
				<div style={{position: 'absolute', left: '92%', top: '6%', transform: `translate(-50%, ${interpolate(drop, [0, 1], [-400, 0])}px)`}}>
					<LogoMark size={L.portrait ? 120 : 110} />
				</div>
			</div>
			{/* The wordmark. */}
			<div
				style={{
					position: 'absolute',
					left: L.portrait ? 0 : 120,
					right: L.portrait ? 0 : undefined,
					top: L.portrait ? L.height * 0.06 : L.height * 0.16,
					display: 'flex',
					justifyContent: L.portrait ? 'center' : 'flex-start',
					alignItems: 'center',
					gap: 22,
					opacity: word,
					transform: `translateY(${(1 - word) * 30}px)`,
				}}
			>
				<LogoMark size={88} />
				<span style={{fontFamily: display, fontWeight: 800, fontSize: 120, letterSpacing: -4, color: C.ink}}>chalo</span>
			</div>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 60} />
			))}
		</AbsoluteFill>
	);
};
