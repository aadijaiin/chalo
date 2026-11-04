'use client';

import {AnimatePresence, motion, useInView, useReducedMotion} from 'motion/react';
import {
	BatteryFull,
	BatteryLow,
	BatteryMedium,
	Coffee,
	Fuel,
	Hand,
	MapPin,
	RotateCcw,
	Route,
	Signal,
	SignalZero,
	Siren,
	Snail,
	Utensils,
	WifiOff,
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {CountUp} from '@/components/ui/CountUp';
import {Spotlight} from '@/components/ui/Spotlight';
import {cn} from '@/lib/utils';

function vibrate(ms) {
	if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

function CardHead({icon: Icon, title, body, tone = 'primary'}) {
	return (
		<div className="relative z-10 flex flex-col gap-2">
			<span
				className={cn(
					'flex size-10 items-center justify-center rounded-2xl',
					tone === 'primary' && 'bg-primary/12 text-primary',
					tone === 'sage' && 'bg-sage/15 text-sage',
					tone === 'destructive' && 'bg-destructive/12 text-destructive',
					tone === 'amber' && 'bg-amber/15 text-amber',
				)}
			>
				<Icon className="size-5" />
			</span>
			<h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
			<p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
		</div>
	);
}

/* ---------------------------------------------------------------- Pings & SOS */

const PINGS = [
	{id: 'chai', icon: Coffee, label: 'Chai stop', says: 'wants a chai stop'},
	{id: 'fuel', icon: Fuel, label: 'Fuel', says: 'needs fuel'},
	{id: 'food', icon: Utensils, label: 'Food', says: 'is hungry'},
	{id: 'wait', icon: Hand, label: 'Wait up', says: 'asked everyone to wait up'},
];

const HOLD_MS = 900;

export function PingCard({crew}) {
	const [toasts, setToasts] = useState([]);
	const [holding, setHolding] = useState(false);
	const [sos, setSos] = useState(false);
	const holdTimer = useRef(null);
	const [hint, setHint] = useState(false);
	// Keys for the toasts, and whose turn it is to ping (taking turns through the crew).
	const count = useRef(0);

	function push(t) {
		count.current += 1;
		const key = count.current;
		setToasts((list) => [{...t, key}, ...list].slice(0, 3));
	}

	function send(p) {
		vibrate(12);
		const who = crew[count.current % 3];
		push({icon: p.icon, title: p.label, body: `${who.name} ${p.says}`, avatar: who.avatar, tone: 'normal'});
	}

	function startHold() {
		setHint(false);
		setHolding(true);
		holdTimer.current = setTimeout(() => {
			setHolding(false);
			setSos(true);
			vibrate([60, 40, 60]);
			push({icon: Siren, title: 'SOS from you', body: 'Everyone can see where you are.', tone: 'sos'});
		}, HOLD_MS);
	}
	function endHold() {
		if (!holdTimer.current) return;
		clearTimeout(holdTimer.current);
		holdTimer.current = null;
		if (holding) setHint(true);
		setHolding(false);
	}

	return (
		<Spotlight className="flex flex-col gap-6 p-6 sm:p-8 lg:col-span-4 lg:row-span-2">
			<CardHead
				icon={Coffee}
				title="One-tap pings, and an SOS that can’t go off by accident"
				body="Chai, fuel, food, wait up, or your own words. Everyone gets a notification, even with the phone locked. Try it:"
			/>
			<div className="relative z-10 grid flex-1 gap-6 md:grid-cols-[1fr_1.1fr] md:items-stretch">
				<div className="flex flex-col justify-center gap-3">
					<div className="grid grid-cols-2 gap-2.5">
						{PINGS.map((p) => (
							<motion.button
								key={p.id}
								type="button"
								whileTap={{scale: 0.93}}
								whileHover={{y: -2}}
								onClick={() => send(p)}
								className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3.5 py-3 text-sm font-bold transition-colors hover:border-primary/40 hover:bg-primary/5"
							>
								<p.icon className="size-4 text-primary" />
								{p.label}
							</motion.button>
						))}
					</div>
					<button
						type="button"
						onPointerDown={startHold}
						onPointerUp={endHold}
						onPointerLeave={endHold}
						onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && startHold()}
						onKeyUp={endHold}
						onContextMenu={(e) => e.preventDefault()}
						className="relative flex h-14 select-none items-center justify-center gap-2 overflow-hidden rounded-2xl bg-destructive font-extrabold text-white shadow-[0_12px_30px_-12px_var(--destructive)] touch-none"
					>
						<motion.span
							aria-hidden
							className="absolute inset-y-0 left-0 bg-black/20"
							initial={false}
							animate={{width: holding ? '100%' : '0%'}}
							transition={{duration: holding ? HOLD_MS / 1000 : 0.25, ease: 'linear'}}
						/>
						<Siren className="relative size-5" />
						<span className="relative">{holding ? 'Keep holding…' : sos ? 'SOS sent' : 'Hold for SOS'}</span>
					</button>
					<div className="h-5 text-center text-xs font-semibold text-muted-foreground">
						<AnimatePresence mode="wait">
							{hint ? (
								<motion.span key="hint" initial={{opacity: 0, y: 4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}}>
									Hold it a little longer. A tap won’t send an SOS.
								</motion.span>
							) : sos ? (
								<motion.button
									key="reset"
									type="button"
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									onClick={() => {
										setSos(false);
										push({icon: Siren, title: 'SOS cancelled', body: 'You told everyone you’re OK.', tone: 'ok'});
									}}
									className="text-primary underline-offset-4 hover:underline"
								>
									I’m OK, cancel the SOS
								</motion.button>
							) : null}
						</AnimatePresence>
					</div>
				</div>

				{/* A lock screen with the notifications landing. */}
				<div className="clip-layer relative mx-auto flex h-full min-h-[19rem] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-[var(--map-water)] via-[var(--map-park)] to-[var(--map-land)] p-4">
					<div className="mb-3 text-center">
						<div className="font-display text-4xl font-bold tabular-nums tracking-tight text-foreground/80">9:41</div>
						<div className="text-[11px] font-semibold text-foreground/60">Saturday · on the road</div>
					</div>
					<div className="flex flex-col gap-2">
						<AnimatePresence initial={false}>
							{toasts.length === 0 ? (
								<motion.p
									key="empty"
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									className="pt-10 text-center text-xs font-semibold text-foreground/50"
								>
									Notifications from your crew land here
								</motion.p>
							) : null}
							{toasts.map((t) => (
								<motion.div
									key={t.key}
									layout
									initial={{opacity: 0, y: -24, scale: 0.94}}
									animate={{opacity: 1, y: 0, scale: 1}}
									exit={{opacity: 0, scale: 0.94, transition: {duration: 0.15}}}
									transition={{type: 'spring', stiffness: 420, damping: 30}}
									className={cn(
										'flex items-center gap-3 rounded-2xl p-3 shadow-soft',
										t.tone === 'sos' ? 'bg-destructive text-white' : 'bg-card',
									)}
								>
									{t.avatar ? (
										// eslint-disable-next-line @next/next/no-img-element -- generated data URI
										<img src={t.avatar} alt="" className="size-9 rounded-xl" />
									) : (
										<span className={cn('flex size-9 items-center justify-center rounded-xl', t.tone === 'sos' ? 'bg-white/20' : 'bg-sage/15 text-sage')}>
											<t.icon className="size-4" />
										</span>
									)}
									<span className="min-w-0 flex-1 leading-tight">
										<span className="flex items-center justify-between gap-2">
											<span className="truncate text-xs font-extrabold">{t.title}</span>
											<span className={cn('text-[10px]', t.tone === 'sos' ? 'text-white/75' : 'text-muted-foreground')}>now</span>
										</span>
										<span className={cn('block truncate text-xs', t.tone === 'sos' ? 'text-white/90' : 'text-muted-foreground')}>
											{t.body}
										</span>
									</span>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Destination & ETA */

export function EtaCard() {
	const ref = useRef(null);
	const inView = useInView(ref, {once: true, margin: '0px 0px -15% 0px'});
	const [km, setKm] = useState(42);
	const [now, setNow] = useState(() => Date.now());
	const reduce = useReducedMotion();

	useEffect(() => {
		if (!inView || reduce) return;
		const id = setInterval(() => {
			setKm((k) => (k <= 3 ? 42 : +(k - 0.7).toFixed(1)));
			setNow(Date.now());
		}, 900);
		return () => clearInterval(id);
	}, [inView, reduce]);

	const minutes = Math.round((km / 48) * 60);
	const arrival = new Date(now + minutes * 60_000).toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit'});

	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-2">
			<CardHead icon={MapPin} title="Destination & ETAs" body="Set where you’re headed. Everyone gets their own route and an ETA that learns how you drive." />
			<div ref={ref} className="relative z-10 rounded-3xl border border-border bg-[var(--map-land)] p-4">
				<svg viewBox="0 0 260 90" className="h-20 w-full" aria-hidden>
					<path d="M 12 74 C 60 70, 70 30, 120 36 S 190 70, 248 16" fill="none" stroke="var(--map-highway)" strokeWidth="10" strokeLinecap="round" />
					<motion.path
						d="M 12 74 C 60 70, 70 30, 120 36 S 190 70, 248 16"
						fill="none"
						stroke="var(--primary)"
						strokeWidth="4"
						strokeLinecap="round"
						initial={{pathLength: 0}}
						animate={inView ? {pathLength: 1} : {}}
						transition={{duration: 1.6, ease: [0.65, 0, 0.35, 1]}}
					/>
					<circle cx="248" cy="16" r="7" fill="var(--primary)" stroke="var(--card)" strokeWidth="2.5" />
					<circle cx="12" cy="74" r="6" fill="var(--crew-1)" stroke="var(--card)" strokeWidth="2.5" />
				</svg>
				<div className="mt-2 flex items-end justify-between">
					<div>
						<div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Lonavala</div>
						<div className="whitespace-nowrap font-display text-xl font-extrabold tabular-nums">
							{km} km <span className="text-muted-foreground">·</span> {minutes} min
						</div>
					</div>
					<div className="whitespace-nowrap rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold tabular-nums text-primary" suppressHydrationWarning>
						by {arrival}
					</div>
				</div>
			</div>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Fell behind */

export function BehindCard({crew}) {
	const zoya = crew[2];
	const [gap, setGap] = useState(2);
	const [alerted, setAlerted] = useState(false);

	// The server's rule: an alert at 5 km behind, cleared once back within 3 km.
	function change(v) {
		setGap(v);
		if (v >= 5 && !alerted) {
			setAlerted(true);
			vibrate(30);
		} else if (v < 3 && alerted) setAlerted(false);
	}

	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-2">
			<CardHead icon={Snail} tone="amber" title="Nobody gets left behind" body="Drop 5 km behind the group and everyone hears about it. Drag to see:" />
			<div className="relative z-10 flex flex-col gap-4">
				<div className="relative h-16 overflow-hidden rounded-2xl border border-border bg-[var(--map-land)]">
					<div className="absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--map-highway)]" />
					{/* The lead stays put; Zoya slides back as the gap grows. */}
					<div className="absolute right-6 top-1/2 size-7 -translate-y-1/2 rounded-full border-[3px] border-card bg-crew-1 shadow-soft" />
					<motion.img
						src={zoya.avatar}
						alt=""
						className="absolute top-1/2 size-9 -translate-y-1/2 rounded-full border-[3px] shadow-soft"
						style={{borderColor: zoya.color}}
						animate={{right: `calc(${12 + gap * 9}% )`}}
						transition={{type: 'spring', stiffness: 260, damping: 24}}
					/>
				</div>
				<label className="flex items-center gap-3 text-sm font-semibold">
					<span className="w-24 shrink-0 tabular-nums text-muted-foreground">{gap.toFixed(1)} km gap</span>
					<input
						type="range"
						min="0"
						max="8"
						step="0.1"
						value={gap}
						onChange={(e) => change(Number(e.target.value))}
						aria-label="How far Zoya is behind the lead"
						className="h-2 w-full cursor-pointer accent-[var(--primary)]"
					/>
				</label>
				<div className="h-11">
					<AnimatePresence mode="wait">
						{alerted ? (
							<motion.div
								key="alert"
								initial={{opacity: 0, y: 8, scale: 0.96}}
								animate={{opacity: 1, y: 0, scale: 1}}
								exit={{opacity: 0, y: -6}}
								className="flex items-center gap-2 rounded-2xl bg-amber/15 px-3 py-2.5 text-sm font-bold text-amber"
							>
								<Snail className="size-4" />
								Zoya fell {Math.round(gap)} km behind
							</motion.div>
						) : (
							<motion.p key="ok" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="pt-2.5 text-sm text-muted-foreground">
								{gap >= 3 ? 'Falling back… no alarm yet.' : 'Keeping up with the group.'}
							</motion.p>
						)}
					</AnimatePresence>
				</div>
			</div>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Stops & meetups */

const PIN_NAMES = ['Dhaba', 'Fuel', 'Regroup', 'Viewpoint', 'Chai'];
const PIN_COLORS = ['var(--crew-1)', 'var(--amber)', 'var(--sage)', 'var(--crew-2)', 'var(--primary)'];

export function PinsCard() {
	const [pins, setPins] = useState([
		{x: 30, y: 58, n: 0},
		{x: 68, y: 34, n: 2},
	]);

	function drop(e) {
		const r = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - r.left) / r.width) * 100;
		const y = ((e.clientY - r.top) / r.height) * 100;
		vibrate(8);
		setPins((list) => [...list, {x, y, n: list.length}].slice(-6));
	}

	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-3">
			<CardHead icon={MapPin} tone="sage" title="Stops and meetups" body="Drop a dhaba, a fuel pump or a regroup point. Stops join everyone’s route. Tap the map:" />
			<div className="relative z-10">
				<button
					type="button"
					onClick={drop}
					aria-label="Drop a pin on the map"
					className="clip-layer relative block h-36 w-full cursor-crosshair overflow-hidden rounded-2xl border border-border bg-[var(--map-land)]"
				>
					<svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
						<path d="M -5 50 C 20 45, 30 20, 55 28 S 85 10, 105 14" fill="none" stroke="var(--map-highway)" strokeWidth="4" />
						<path d="M 0 20 L 100 40" stroke="var(--map-road)" strokeWidth="2.5" />
						<path d="M 70 0 L 60 60" stroke="var(--map-road)" strokeWidth="2.5" />
						<ellipse cx="18" cy="16" rx="14" ry="9" fill="var(--map-park)" />
					</svg>
					<AnimatePresence>
						{pins.map((p, i) => (
							<motion.span
								key={`${p.x}-${p.y}`}
								initial={{y: -26, opacity: 0, scale: 0.6}}
								animate={{y: 0, opacity: 1, scale: 1}}
								exit={{opacity: 0, scale: 0.5}}
								transition={{type: 'spring', stiffness: 520, damping: 18}}
								className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
								style={{left: `${p.x}%`, top: `${p.y}%`}}
							>
								<span className="mb-0.5 rounded-full bg-card px-1.5 py-0.5 text-[10px] font-bold shadow-soft">
									{PIN_NAMES[p.n % PIN_NAMES.length]}
								</span>
								<MapPin className="size-6 drop-shadow" style={{color: PIN_COLORS[i % PIN_COLORS.length]}} fill="currentColor" stroke="white" />
							</motion.span>
						))}
					</AnimatePresence>
				</button>
				{pins.length > 2 ? (
					<button
						type="button"
						onClick={() => setPins((l) => l.slice(0, 2))}
						className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[11px] font-bold shadow-soft"
					>
						<RotateCcw className="size-3" />
						Reset
					</button>
				) : null}
			</div>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Battery & signal */

export function BatteryCard({crew}) {
	const rows = [
		{p: crew[0], level: 0.82, icon: BatteryFull, note: 'Live'},
		{p: crew[1], level: 0.46, icon: BatteryMedium, note: 'Live'},
		{p: crew[2], level: 0.09, icon: BatteryLow, note: 'Phone dying'},
	];
	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-3">
			<CardHead icon={BatteryMedium} tone="sage" title="Dying phone, or just quiet?" body="See everyone’s battery, and tell when someone has probably just lost signal." />
			<ul className="relative z-10 flex flex-col gap-2.5">
				{rows.map(({p, level, icon: Icon, note}, i) => (
					<li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
						{/* eslint-disable-next-line @next/next/no-img-element -- generated data URI */}
						<img src={p.avatar} alt="" className="size-8 rounded-full border-2" style={{borderColor: p.color}} />
						<span className="w-14 text-sm font-bold">{p.name}</span>
						<span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
							<motion.span
								className={cn('absolute inset-y-0 left-0 rounded-full', level < 0.2 ? 'bg-destructive' : level < 0.5 ? 'bg-amber' : 'bg-sage')}
								initial={{width: 0}}
								whileInView={{width: `${level * 100}%`}}
								viewport={{once: true}}
								transition={{duration: 1.1, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1]}}
							/>
						</span>
						<Icon className={cn('size-4', level < 0.2 ? 'text-destructive' : 'text-muted-foreground')} />
						<span className={cn('hidden w-24 text-right text-xs font-semibold sm:block', level < 0.2 ? 'text-destructive' : 'text-muted-foreground')}>
							{note}
						</span>
					</li>
				))}
				<li className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground">
					<SignalZero className="size-4 animate-pulse text-amber" />
					Kabir · probably no signal · seen 4 min ago
				</li>
			</ul>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Offline maps */

export function OfflineCard() {
	const [online, setOnline] = useState(true);
	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-3">
			<div className="flex items-start justify-between gap-4">
				<CardHead icon={WifiOff} title="Works without signal" body="Save the map along your route before the ghats. It keeps working when the network doesn’t." />
				<button
					type="button"
					role="switch"
					aria-checked={online}
					aria-label="Phone signal"
					onClick={() => {
						vibrate(10);
						setOnline((o) => !o);
					}}
					className={cn(
						'relative z-10 flex h-9 w-[4.5rem] shrink-0 items-center rounded-full p-1 transition-colors',
						online ? 'bg-sage' : 'bg-muted-foreground/40',
					)}
				>
					<motion.span
						layout
						transition={{type: 'spring', stiffness: 600, damping: 32}}
						className={cn('flex size-7 items-center justify-center rounded-full bg-card shadow-soft', online ? 'ml-auto' : '')}
					>
						{online ? <Signal className="size-3.5 text-sage" /> : <SignalZero className="size-3.5 text-muted-foreground" />}
					</motion.span>
				</button>
			</div>
			<div className="clip-layer relative z-10 h-36 overflow-hidden rounded-2xl border border-border">
				<svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
					<rect width="400" height="140" fill="var(--map-land)" />
					<path d="M 0 120 Q 80 20 160 70 T 320 50 T 420 30 L 420 140 L 0 140 Z" fill="var(--map-park)" opacity="0.7" />
					{[0, 1, 2, 3].map((i) => (
						<path key={i} d={`M -10 ${110 - i * 18} Q 120 ${50 - i * 18} 200 ${80 - i * 18} T 420 ${40 - i * 18}`} fill="none" stroke="var(--map-contour)" strokeWidth="1.2" />
					))}
					<path d="M 20 120 C 80 110, 110 40, 180 60 S 300 110, 380 30" fill="none" stroke="var(--map-highway)" strokeWidth="9" strokeLinecap="round" />
					<path d="M 20 120 C 80 110, 110 40, 180 60 S 300 110, 380 30" fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />
				</svg>
				{/* Tiles outside the saved corridor fade away when the signal goes. */}
				<motion.div
					aria-hidden
					animate={{opacity: online ? 0 : 1}}
					className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_60%,transparent_45%,var(--background-2)_80%)]"
				/>
				<AnimatePresence>
					{!online ? (
						<motion.span
							initial={{opacity: 0, y: 6}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0}}
							className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold shadow-soft"
						>
							<WifiOff className="size-3.5 text-primary" />
							No signal · using your saved map
						</motion.span>
					) : null}
				</AnimatePresence>
			</div>
		</Spotlight>
	);
}

/* ---------------------------------------------------------------- Recap */

export function RecapCard() {
	return (
		<Spotlight className="flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-3">
			<CardHead icon={Route} tone="primary" title="A recap of the trip" body="When the party ends: everyone’s route on one map, kilometres covered, top speed and stops made." />
			<div className="relative z-10">
				<div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Example trip</div>
				<div className="grid grid-cols-3 gap-2.5">
					{[
						{label: 'Together', value: 214, suffix: ' km'},
						{label: 'Top speed', value: 92, suffix: ' km/h'},
						{label: 'Stops', value: 4, suffix: ''},
					].map((s) => (
						<div key={s.label} className="rounded-2xl border border-border bg-background p-3 sm:p-4">
							<div className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{s.label}</div>
							<CountUp value={s.value} suffix={s.suffix} className="mt-1 block whitespace-nowrap font-display text-base font-extrabold tabular-nums min-[400px]:text-lg sm:text-3xl" />
						</div>
					))}
				</div>
			</div>
		</Spotlight>
	);
}
