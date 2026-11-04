import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../timeline';
import {C, CAST, display, text} from '../theme';
import {Avatar} from '../ui/Avatar';
import {Backdrop} from '../ui/Backdrop';
import {Caption} from '../ui/Caption';
import {useLayout} from '../ui/layout';
import {Phone} from '../ui/Phone';

/** Where the phone goes: right of centre in 16:9, top-centre in 9:16, easing in from below. */
function usePhoneSlot(scale = 1) {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLayout();
	const h = L.phoneH * scale;
	const w = (h * 1220) / 2712;
	const enter = spring({frame, fps, config: {damping: 20, stiffness: 120}});
	return {
		h,
		w,
		left: L.portrait ? (L.width - w) / 2 : L.width * 0.7 - w / 2,
		top: L.portrait ? 110 : (L.height - h) / 2,
		style: {transform: `translateY(${(1 - enter) * 120}px) rotate(${(1 - enter) * 4}deg)`, opacity: Math.min(1, enter * 1.5)},
	};
}

/** A floating card that pops out beside the phone. */
const Float: React.FC<{at: number; x: number; y: number; children: React.ReactNode; until?: number}> = ({at, x, y, children, until}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 200}});
	const out = until ? interpolate(frame, [until, until + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	if (frame < at) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, opacity: out, transformOrigin: 'center'}}>
			{children}
		</div>
	);
};

const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: 18,
			background: C.card,
			borderRadius: 30,
			padding: '20px 28px 20px 20px',
			boxShadow: '0 30px 60px -20px rgba(60,35,20,0.35)',
			border: `2px solid ${C.border}`,
			fontFamily: text,
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{children}
	</div>
);

const Footage: React.FC<{src: string; startFrom: number; rate?: number}> = ({src, startFrom, rate = 1}) => {
	const {fps} = useVideoConfig();
	return (
		<OffthreadVideo
			src={staticFile(src)}
			startFrom={Math.round(startFrom * fps)}
			playbackRate={rate}
			muted
			style={{width: '100%', height: '100%', objectFit: 'cover'}}
		/>
	);
};

/** "Start a party, send the code... and everyone's in." The real lobby, sped up, as friends join. */
export const Party: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slot = usePhoneSlot();
	const L = useLayout();
	const code = '9V7CDA';
	return (
		<AbsoluteFill>
			<Backdrop />
			<div style={{position: 'absolute', left: slot.left, top: slot.top, ...slot.style}}>
				<Phone height={slot.h}>
					<Footage src="footage/s1.mp4" startFrom={11.6} rate={2.6} />
				</Phone>
			</div>
			{/* The code, big, flipping in like a departures board. */}
			<div style={{position: 'absolute', left: 120, top: L.height * 0.17, display: 'flex', gap: 10, perspective: 800}}>
				{L.portrait
					? null
					: code.split('').map((ch, i) => {
							const s = spring({frame: frame - 4 - i * 3, fps, config: {damping: 14, stiffness: 180}});
							return (
								<div
									key={i}
									style={{
										width: 78,
										height: 96,
										borderRadius: 20,
										background: C.primary,
										color: '#fff',
										fontFamily: display,
										fontWeight: 800,
										fontSize: 58,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										transform: `rotateX(${(1 - s) * -90}deg)`,
										opacity: s,
										boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.12)',
									}}
								>
									{ch}
								</div>
							);
						})}
			</div>
			{(['kabir', 'zoya'] as const).map((k, i) => {
				const p = CAST[k];
				const at = scene.lines[1] ? scene.lines[1].from - 6 + i * 7 : 30 + i * 8;
				return (
					<Float key={k} at={at} x={L.portrait ? L.width - 380 : slot.left - 200} y={(L.portrait ? L.height * 0.42 : slot.top + slot.h * 0.55) + i * 110}>
						<Card>
							<Avatar seed={p.seed} size={56} color={p.color} />
							<span style={{fontWeight: 800, fontSize: 30, color: C.ink}}>{p.name} joined</span>
						</Card>
					</Float>
				);
			})}
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 90} />
			))}
		</AbsoluteFill>
	);
};

/** "Everyone's route. Everyone's ETA. Even with my phone locked." */
export const LiveMap: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slot = usePhoneSlot();
	const L = useLayout();
	const lockAt = scene.lines[1]?.from ?? scene.frames;
	const lock = interpolate(frame, [lockAt - 4, lockAt + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const etas = [
		{k: 'riya' as const, km: 41, min: 48},
		{k: 'kabir' as const, km: 43, min: 52},
		{k: 'zoya' as const, km: 45, min: 55},
	];
	const tick = Math.floor(frame / 12);
	return (
		<AbsoluteFill>
			<Backdrop />
			<div style={{position: 'absolute', left: slot.left, top: slot.top, ...slot.style}}>
				<Phone height={slot.h}>
					<Footage src="footage/s2.mp4" startFrom={0} rate={1.5} />
					{/* Locked: the screen goes dark and the sharing notification is what's left. */}
					<div style={{position: 'absolute', inset: 0, background: `rgba(18,20,18,${lock * 0.9})`}} />
					<div
						style={{
							position: 'absolute',
							left: '6%',
							right: '6%',
							top: '22%',
							opacity: lock,
							transform: `translateY(${(1 - lock) * 20}px)`,
							textAlign: 'center',
							color: '#fff',
							fontFamily: display,
						}}
					>
						<div style={{fontSize: slot.h * 0.085, fontWeight: 700}}>9:41</div>
						<div
							style={{
								marginTop: slot.h * 0.04,
								background: 'rgba(255,255,255,0.14)',
								borderRadius: 24,
								padding: '18px 20px',
								textAlign: 'left',
								fontFamily: text,
								fontSize: slot.h * 0.022,
							}}
						>
							<div style={{fontWeight: 800}}>Sharing your location · Lonavala ride</div>
							<div style={{opacity: 0.8, marginTop: 4}}>Your party can see you on the map.</div>
						</div>
					</div>
				</Phone>
			</div>
			{!L.portrait
				? etas.map((e, i) => {
						const p = CAST[e.k];
						const km = Math.max(1, e.km - tick * 0.3).toFixed(0);
						return (
							<Float key={e.k} at={6 + i * 5} x={slot.left - 230 + (i % 2) * 40} y={slot.top + 120 + i * 140} until={lockAt + 4}>
								<Card>
									<Avatar seed={p.seed} size={56} color={p.color} />
									<span style={{fontWeight: 800, fontSize: 30, color: C.ink}}>{p.name}</span>
									<span style={{fontWeight: 600, fontSize: 26, color: C.muted}}>
										{km} km · {Math.max(1, e.min - tick)} min
									</span>
								</Card>
							</Float>
						);
					})
				: null}
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 90} />
			))}
		</AbsoluteFill>
	);
};

/** "Chai stop? One tap. Emergency? Hold for SOS." */
export const Pings: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slot = usePhoneSlot();
	const L = useLayout();
	const sosAt = scene.lines[2]?.from ?? scene.frames;
	const sosMode = interpolate(frame, [sosAt - 6, sosAt + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const hold = interpolate(frame, [sosAt + 4, sosAt + 4 + fps * 1.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
	const sent = frame > sosAt + 4 + fps * 1.1;
	const pulse = sent ? (frame % 20) / 20 : 0;
	const btn = slot.h * 0.36;
	return (
		<AbsoluteFill>
			<Backdrop />
			<div style={{position: 'absolute', left: slot.left, top: slot.top, ...slot.style}}>
				<Phone height={slot.h} glow={sent ? 'rgba(229,72,77,0.45)' : undefined}>
					<Footage src="footage/s2.mp4" startFrom={8} rate={1} />
					<div style={{position: 'absolute', inset: 0, background: `rgba(229,72,77,${sosMode * 0.2})`}} />
					{/* The hold-to-send SOS, as in the app: the ring fills, a tap alone won't send it. */}
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: '58%',
							width: btn,
							height: btn,
							transform: `translate(-50%, -50%) scale(${0.85 + sosMode * 0.15})`,
							opacity: sosMode,
						}}
					>
						{sent ? (
							<div style={{position: 'absolute', inset: 0, borderRadius: btn, border: `6px solid ${C.destructive}`, transform: `scale(${1 + pulse * 0.8})`, opacity: 1 - pulse}} />
						) : null}
						<svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0}}>
							<circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
							<circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - hold} transform="rotate(-90 50 50)" />
						</svg>
						<div
							style={{
								position: 'absolute',
								inset: '10%',
								borderRadius: btn,
								background: C.destructive,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#fff',
								fontFamily: display,
								fontWeight: 800,
								fontSize: btn * 0.2,
								textAlign: 'center',
								lineHeight: 1,
								boxShadow: '0 20px 40px -10px rgba(229,72,77,0.6)',
							}}
						>
							{sent ? 'SOS sent' : 'SOS'}
						</div>
					</div>
				</Phone>
			</div>
			{/* Kabir's chai ping, landing as a notification. */}
			<Float at={(scene.lines[0]?.from ?? 0) + 2} x={L.portrait ? 70 : slot.left - 260} y={L.portrait ? L.height * 0.47 : slot.top + slot.h * 0.18} until={sosAt - 6}>
				<Card>
					<div style={{width: 64, height: 64, borderRadius: 20, background: '#F7E6CF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>
						<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M10 2v2M14 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1M6 2v2" />
						</svg>
					</div>
					<div>
						<div style={{fontWeight: 800, fontSize: 32, color: C.ink}}>Chai stop?</div>
						<div style={{fontWeight: 600, fontSize: 24, color: C.muted}}>Kabir · just now</div>
					</div>
				</Card>
			</Float>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 90} />
			))}
		</AbsoluteFill>
	);
};

/** "Zoya's falling behind! ...and now everyone knows." */
export const Behind: React.FC<{scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slot = usePhoneSlot();
	const L = useLayout();
	const p = CAST.zoya;
	const gap = interpolate(frame, [4, fps * 1.4], [1, 7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const track = L.portrait ? L.width - 140 : 560;
	return (
		<AbsoluteFill>
			<Backdrop />
			<div style={{position: 'absolute', left: slot.left, top: slot.top, ...slot.style}}>
				<Phone height={slot.h}>
					<Footage src="footage/s2.mp4" startFrom={22.6} rate={1} />
				</Phone>
			</div>
			{/* The gap opening up on a little road. */}
			<div style={{position: 'absolute', left: L.portrait ? 70 : 120, top: L.portrait ? L.height * 0.665 : L.height * 0.76, width: track, height: 140}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 52, height: 16, borderRadius: 16, background: C.mapHighway}} />
				<div style={{position: 'absolute', right: 0, top: 30, display: 'flex'}}>
					{(['riya', 'kabir'] as const).map((k, i) => (
						<Avatar key={k} seed={CAST[k].seed} size={60} color={CAST[k].color} style={{marginLeft: i ? -16 : 0}} />
					))}
				</div>
				<div style={{position: 'absolute', top: 24, right: interpolate(gap, [1, 7], [110, track - 72])}}>
					<Avatar seed={p.seed} size={72} color={p.color} />
				</div>
				<div style={{position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center', fontFamily: display, fontWeight: 800, fontSize: 34, color: C.amber}}>
					{gap.toFixed(0)} km behind
				</div>
			</div>
			{scene.lines.map((l) => (
				<Caption key={l.id} line={l} offsetY={L.portrait ? 0 : 20} />
			))}
		</AbsoluteFill>
	);
};
