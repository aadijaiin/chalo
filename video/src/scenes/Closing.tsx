import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../timeline';
import {C, CAST, display, text} from '../theme';
import {Avatar} from '../ui/Avatar';
import {Backdrop} from '../ui/Backdrop';
import {Caption} from '../ui/Caption';
import {useLayout} from '../ui/layout';
import {LogoMark} from '../ui/Logo';
import {Phone} from '../ui/Phone';

/** Mom's phone: the lookout view, the crew moving on a little map, nobody seeing her. */
const LookoutScreen: React.FC<{h: number}> = ({h}) => {
	const frame = useCurrentFrame();
	const crew = [
		{k: 'riya' as const, x: 72, y: 26},
		{k: 'kabir' as const, x: 55, y: 44},
		{k: 'zoya' as const, x: 34, y: 62},
	];
	return (
		<div style={{position: 'absolute', inset: 0, background: C.mapLand}}>
			<svg viewBox="0 0 100 220" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
				<ellipse cx="80" cy="180" rx="30" ry="22" fill={C.mapPark} />
				<path d="M 0 120 C 30 130, 40 80, 70 90 S 90 40, 100 36" fill="none" stroke={C.mapWater} strokeWidth="8" />
				<path d="M 18 210 C 28 170, 30 150, 34 140 S 50 105, 55 98 S 66 70, 72 60 S 86 32, 92 20" fill="none" stroke={C.mapHighway} strokeWidth="5" strokeLinecap="round" />
			</svg>
			<div
				style={{
					position: 'absolute',
					left: '6%',
					right: '6%',
					top: '6%',
					background: C.card,
					borderRadius: 40,
					padding: `${h * 0.012}px ${h * 0.02}px`,
					fontFamily: text,
					fontWeight: 800,
					fontSize: h * 0.022,
					color: C.ink,
					display: 'flex',
					alignItems: 'center',
					gap: 10,
					boxShadow: '0 8px 20px rgba(40,25,15,0.15)',
				}}
			>
				<svg width={h * 0.026} height={h * 0.026} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.4">
					<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
				Lookout
				<span style={{color: C.muted, fontWeight: 600}}>· the crew can&apos;t see you</span>
			</div>
			{crew.map((c, i) => {
				const p = CAST[c.k];
				const drift = (frame * 0.06 + i) % 6;
				return (
					<div key={c.k} style={{position: 'absolute', left: `${c.x + drift}%`, top: `${c.y - drift * 1.4}%`, transform: 'translate(-50%,-50%)'}}>
						<Avatar seed={p.seed} size={h * 0.075} color={p.color} />
					</div>
				);
			})}
			<div style={{position: 'absolute', left: '5%', right: '5%', bottom: '4%', display: 'flex', flexDirection: 'column', gap: h * 0.01}}>
				{crew.map((c, i) => {
					const p = CAST[c.k];
					return (
						<div key={c.k} style={{display: 'flex', alignItems: 'center', gap: 12, background: C.card, borderRadius: 22, padding: h * 0.012, fontFamily: text}}>
							<Avatar seed={p.seed} size={h * 0.045} color={p.color} />
							<div style={{lineHeight: 1.15}}>
								<div style={{fontWeight: 800, fontSize: h * 0.02, color: C.ink}}>{p.name}</div>
								<div style={{fontWeight: 600, fontSize: h * 0.017, color: C.muted}}>{[18, 24, 31][i] - Math.floor(frame / 15)} km to go</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

/** "And me? I'm watching from home. As a lookout, without sharing her own location." */
export const Mom: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const enter = spring({frame, fps, config: {damping: 20, stiffness: 120}});
	const crewIn = spring({frame: frame - (scene.lines[1]?.from ?? 30) + 4, fps, config: {damping: 18, stiffness: 140}});
	const h = L.portrait ? L.height * 0.46 : L.height * 0.74;
	const w = (h * 1220) / 2712;
	const momPhone = {left: L.portrait ? L.width / 2 - w - 20 : L.width * 0.58 - w / 2, top: L.portrait ? 170 : (L.height - h) / 2};
	const crewPhone = {left: L.portrait ? L.width / 2 + 20 : L.width * 0.82 - w / 2, top: momPhone.top + (L.portrait ? 0 : 50)};
	return (
		<AbsoluteFill>
			<Backdrop />
			{/* Mom, at home. */}
			<div
				style={{
					position: 'absolute',
					left: momPhone.left + w * 0.5 - 80,
					top: momPhone.top - 70,
					zIndex: 2,
					display: 'flex',
					alignItems: 'center',
					gap: 14,
					background: C.card,
					borderRadius: 40,
					padding: '10px 22px 10px 10px',
					boxShadow: '0 16px 30px -10px rgba(60,35,20,0.3)',
					fontFamily: text,
					fontWeight: 800,
					fontSize: 28,
					color: C.ink,
					transform: `scale(${enter})`,
				}}
			>
				<Avatar seed={CAST.mom.seed} size={60} color={CAST.mom.color} />
				Mom · at home
			</div>
			<div style={{position: 'absolute', ...momPhone, transform: `translateY(${(1 - enter) * 120}px) rotate(${-3 * enter}deg)`, opacity: enter}}>
				<Phone height={h}>
					<LookoutScreen h={h} />
				</Phone>
			</div>
			{/* And the crew's phone: they can see who's watching. */}
			<div style={{position: 'absolute', ...crewPhone, transform: `translateY(${(1 - crewIn) * 160}px) rotate(${3 * crewIn}deg)`, opacity: crewIn}}>
				<Phone height={h}>
					<OffthreadVideo src={staticFile('footage/s3.mp4')} startFrom={Math.round(6.6 * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</Phone>
			</div>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 90} />
			))}
		</AbsoluteFill>
	);
};

/** "Trip's over, sharing stops. Just memories... and the recap!" */
export const Recap: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const enter = spring({frame, fps, config: {damping: 18, stiffness: 120}});
	const zoom = interpolate(frame, [0, scene.frames], [1.12, 1], {easing: Easing.out(Easing.quad)});
	const stamp = spring({frame: frame - 6, fps, config: {damping: 10, stiffness: 200}});
	const box = L.portrait
		? {left: 60, top: 220, width: L.width - 120}
		: {left: L.width * 0.5, top: 170, width: L.width * 0.44};
	const height = (box.width * 720) / 1104;
	return (
		<AbsoluteFill>
			<Backdrop />
			<div
				style={{
					position: 'absolute',
					...box,
					height,
					borderRadius: 44,
					overflow: 'hidden',
					boxShadow: '0 40px 80px -30px rgba(60,35,20,0.4)',
					border: `2px solid ${C.border}`,
					transform: `translateY(${(1 - enter) * 100}px)`,
					opacity: enter,
				}}
			>
				<Img src={staticFile('footage/recap-map.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
			</div>
			{/* Stamped like a trip journal. */}
			<div
				style={{
					position: 'absolute',
					left: box.left + box.width - 330,
					top: box.top + height - 70,
					transform: `rotate(-8deg) scale(${interpolate(stamp, [0, 1], [2, 1])})`,
					opacity: stamp,
					border: `5px solid ${C.primary}`,
					borderRadius: 18,
					padding: '10px 24px',
					fontFamily: display,
					fontWeight: 800,
					fontSize: 44,
					color: C.primary,
					background: 'rgba(250,247,242,0.92)',
					letterSpacing: 1,
				}}
			>
				TRIP RECAP
			</div>
			<div style={{position: 'absolute', left: box.left + 30, top: box.top + height + 40, display: 'flex'}}>
				{(['riya', 'kabir', 'zoya', 'aadi'] as const).map((k, i) => {
					const s = spring({frame: frame - 10 - i * 4, fps, config: {damping: 12, stiffness: 200}});
					return <Avatar key={k} seed={CAST[k].seed} size={84} color={CAST[k].color} style={{marginLeft: i ? -22 : 0, transform: `scale(${s})`}} />;
				})}
			</div>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 90} />
			))}
		</AbsoluteFill>
	);
};

/** "Chalo!" from everyone, then the logo, the line and where to get it. */
export const End: React.FC<{scene: Scene; credits: string}> = ({scene, credits}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const shoutAt = scene.lines[0]?.from ?? 10;
	const lineAt = scene.lines[1]?.from ?? shoutAt + 20;
	const burst = spring({frame: frame - shoutAt + 2, fps, config: {damping: 9, stiffness: 180}});
	const logo = spring({frame: frame - lineAt + 6, fps, config: {damping: 14, stiffness: 140}});
	const cta = spring({frame: frame - lineAt - 14, fps, config: {damping: 16, stiffness: 140}});
	const fadeOut = interpolate(frame, [scene.frames - 12, scene.frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const k = ['riya', 'kabir', 'zoya', 'aadi'] as const;
	const avatarSize = L.portrait ? 170 : 150;
	return (
		<AbsoluteFill style={{background: C.primary, opacity: fadeOut}}>
			<svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0}}>
				<g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2">
					{[120, 220, 320, 420, 520].map((r) => (
						<circle key={r} cx="600" cy="400" r={r * (0.9 + burst * 0.1)} />
					))}
				</g>
			</svg>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40}}>
				{/* Everyone jumps in for the shout. */}
				<div style={{display: 'flex', gap: 18, transform: `translateY(${interpolate(logo, [0, 1], [0, -40])}px) scale(${1 - logo * 0.35})`}}>
					{k.map((p, i) => {
						const s = spring({frame: frame - shoutAt + 2 - i * 2, fps, config: {damping: 8, stiffness: 220}});
						const hop = Math.sin(Math.min(1, Math.max(0, (frame - shoutAt - i * 2) / 10)) * Math.PI) * 30;
						return <Avatar key={p} seed={CAST[p].seed} size={avatarSize} color="#fff" ring={0.06} style={{transform: `translateY(${-hop}px) scale(${s})`}} />;
					})}
				</div>
				{/* The shout itself, until the logo takes over. */}
				<div
					style={{
						position: 'absolute',
						top: L.portrait ? '56%' : '58%',
						fontFamily: display,
						fontWeight: 800,
						fontSize: L.portrait ? 230 : 210,
						letterSpacing: -6,
						color: '#fff',
						opacity: burst * (1 - logo),
						transform: `scale(${0.6 + burst * 0.4}) rotate(-4deg)`,
					}}
				>
					Chalo!
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 24, opacity: logo, transform: `scale(${0.8 + logo * 0.2})`}}>
					<LogoMark size={L.portrait ? 130 : 120} color="#fff" />
					<span style={{fontFamily: display, fontWeight: 800, fontSize: L.portrait ? 170 : 160, letterSpacing: -6, color: '#fff'}}>chalo</span>
				</div>
				<div style={{fontFamily: display, fontWeight: 700, fontSize: L.portrait ? 60 : 58, color: 'rgba(255,255,255,0.92)', opacity: logo}}>
					{scene.lines[1]?.text ?? 'Find your way, together.'}
				</div>
				<div
					style={{
						marginTop: 10,
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						background: '#fff',
						color: C.ink,
						borderRadius: 30,
						padding: '22px 36px',
						fontFamily: text,
						fontWeight: 800,
						fontSize: L.portrait ? 40 : 36,
						opacity: cta,
						transform: `translateY(${(1 - cta) * 30}px)`,
						boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
					}}
				>
					Download for Android · chalo.aadijain.dev
				</div>
			</AbsoluteFill>
			<div style={{position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', fontFamily: text, fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,0.72)', opacity: cta}}>
				{credits}
			</div>
		</AbsoluteFill>
	);
};
