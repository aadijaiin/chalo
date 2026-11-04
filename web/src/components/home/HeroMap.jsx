'use client';

import {AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform} from 'motion/react';
import {Coffee, Flag, Navigation} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';

// The road from the city (bottom left) up through the ghats to the destination (top right).
const ROUTE =
	'M 46 452 C 96 430, 120 392, 168 380 S 250 372, 282 330 S 300 262, 352 240 S 430 214, 452 168 S 478 96, 548 74';
const ROUTE_KM = 64;
const KMH = 52;
const STOP_AT = 0.56;

// Where each person is on the route when the loop starts, and how fast they go (route per second).
const PACE = [
	{start: 0.58, speed: 0.0105},
	{start: 0.44, speed: 0.0098},
	{start: 0.2, speed: 0.0094},
	{start: 0.33, speed: 0.01},
];

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function eta(progress) {
	const km = (1 - progress) * ROUTE_KM;
	if (km < 0.3) return 'arrived';
	const min = Math.round((km / KMH) * 60);
	return `${km < 10 ? km.toFixed(1) : Math.round(km)} km · ${min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`}`;
}

/**
 * The hero's living map: the crew moves along a real path (each frame places them with
 * getPointAtLength), ETAs count down, someone asks for chai now and then, and the whole card
 * leans towards the pointer.
 */
export function HeroMap({crew}) {
	const reduce = useReducedMotion();
	const wrap = useRef(null);
	const routeRef = useRef(null);
	const markerRefs = useRef([]);
	const progressRef = useRef(PACE.map((p) => p.start));
	const [labels, setLabels] = useState(() => PACE.map((p) => eta(p.start)));
	const [ping, setPing] = useState(false);
	const [visible, setVisible] = useState(true);
	const [stop, setStop] = useState(null);

	// Tilt towards the pointer.
	const px = useMotionValue(0);
	const py = useMotionValue(0);
	const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), {stiffness: 120, damping: 18});
	const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), {stiffness: 120, damping: 18});

	function onPointerMove(e) {
		if (reduce || e.pointerType !== 'mouse') return;
		const r = wrap.current.getBoundingClientRect();
		px.set((e.clientX - r.left) / r.width - 0.5);
		py.set((e.clientY - r.top) / r.height - 0.5);
	}
	function onPointerLeave() {
		px.set(0);
		py.set(0);
	}

	// Only animate while on screen.
	useEffect(() => {
		const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {threshold: 0.05});
		io.observe(wrap.current);
		return () => io.disconnect();
	}, []);

	useEffect(() => {
		const path = routeRef.current;
		const total = path.getTotalLength();
		const s = path.getPointAtLength(STOP_AT * total);
		setStop((prev) => prev ?? {x: s.x, y: s.y});
		const place = () => {
			progressRef.current.forEach((p, i) => {
				const el = markerRefs.current[i];
				if (!el) return;
				const pt = path.getPointAtLength(clamp01(p) * total);
				el.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
				// Fade in at the start of a lap and out on arrival, so the loop never jumps.
				el.style.opacity = String(Math.min(1, p / 0.05, (1.02 - p) / 0.05));
			});
		};
		place();
		if (reduce || !visible) return;

		let raf;
		let last = performance.now();
		let lastLabel = 0;
		const tick = (now) => {
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;
			progressRef.current = progressRef.current.map((p, i) => (p >= 1.02 ? 0 : p + PACE[i].speed * dt));
			place();
			if (now - lastLabel > 500) {
				lastLabel = now;
				setLabels(progressRef.current.map((p) => eta(clamp01(p))));
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [reduce, visible]);

	// Kabir asks for chai every so often.
	useEffect(() => {
		if (reduce || !visible) return;
		let hide;
		const id = setInterval(() => {
			setPing(true);
			hide = setTimeout(() => setPing(false), 3200);
		}, 7000);
		const first = setTimeout(() => setPing(true), 1600);
		const firstHide = setTimeout(() => setPing(false), 4800);
		return () => {
			clearInterval(id);
			clearTimeout(hide);
			clearTimeout(first);
			clearTimeout(firstHide);
		};
	}, [reduce, visible]);

	return (
		<div ref={wrap} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className="relative [perspective:1400px]">
			<motion.div
				// A flat tilt: no preserve-3d or translateZ children, which Safari renders with a stray box.
				style={{rotateX, rotateY}}
				initial={{opacity: 0, y: 40, scale: 0.96}}
				animate={{opacity: 1, y: 0, scale: 1}}
				transition={{duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15}}
				className="relative"
			>
				<div className="clip-layer relative overflow-hidden rounded-[2.25rem] border border-border bg-[var(--map-land)] shadow-lift">
					<svg viewBox="0 0 600 500" className="block h-auto w-full" role="img" aria-label="Illustration: a crew of four on a live map, headed to their destination">
						<defs>
							{crew.map((p) => (
								<clipPath key={p.id} id={`clip-${p.id}`}>
									<circle r="15" />
								</clipPath>
							))}
							<pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
								<circle cx="1" cy="1" r="1" fill="var(--map-contour)" />
							</pattern>
						</defs>

						<rect width="600" height="500" fill="url(#dots)" />
						{/* Contour lines over the ghats. */}
						<g fill="none" stroke="var(--map-contour)" strokeWidth="1.4">
							{[0, 1, 2, 3, 4].map((i) => (
								<ellipse key={i} cx="420" cy="300" rx={60 + i * 34} ry={36 + i * 22} transform="rotate(-24 420 300)" />
							))}
						</g>
						{/* Parks and a lake. */}
						<path d="M 470 360 q 60 -10 90 30 q 20 50 -30 70 q -70 20 -90 -30 q -10 -50 30 -70 Z" fill="var(--map-park)" />
						<path d="M 60 120 q 50 -30 100 0 q 30 40 -10 70 q -60 30 -100 -10 q -20 -40 10 -60 Z" fill="var(--map-park)" />
						<path
							d="M -10 260 C 60 250, 110 300, 170 290 S 260 220, 330 210 S 420 300, 480 330 S 580 300, 610 320 L 610 345 C 560 330, 520 360, 470 352 S 400 270, 330 236 S 250 250, 180 312 S 60 280, -10 286 Z"
							fill="var(--map-water)"
						/>
						{/* Side roads. */}
						<g stroke="var(--map-road-edge)" strokeWidth="9" fill="none" strokeLinecap="round">
							<path d="M 0 380 L 200 360 L 330 420 L 600 410" />
							<path d="M 120 0 L 160 160 L 282 330" />
							<path d="M 352 240 L 300 120 L 340 0" />
						</g>
						<g stroke="var(--map-road)" strokeWidth="6" fill="none" strokeLinecap="round">
							<path d="M 0 380 L 200 360 L 330 420 L 600 410" />
							<path d="M 120 0 L 160 160 L 282 330" />
							<path d="M 352 240 L 300 120 L 340 0" />
						</g>
						{/* The highway, then the trip's route drawn on top of it. */}
						<path d={ROUTE} fill="none" stroke="var(--map-road-edge)" strokeWidth="18" strokeLinecap="round" />
						<path d={ROUTE} fill="none" stroke="var(--map-highway)" strokeWidth="13" strokeLinecap="round" />
						<motion.path
							ref={routeRef}
							d={ROUTE}
							fill="none"
							stroke="var(--primary)"
							strokeWidth="5"
							strokeLinecap="round"
							initial={{pathLength: 0}}
							animate={{pathLength: 1}}
							transition={{duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: 0.4}}
						/>

						{/* The chai stop on the way. */}
						{stop ? (
							<g transform={`translate(${stop.x} ${stop.y})`}>
								<circle r="12" fill="var(--crew-1)" stroke="var(--card)" strokeWidth="3" />
								<circle r="3.5" fill="#fff" />
							</g>
						) : null}

						{/* Destination. */}
						<g transform="translate(548 74)">
							<circle r="22" fill="var(--primary)" opacity="0.18">
								{!reduce ? <animate attributeName="r" values="16;28;16" dur="2.4s" repeatCount="indefinite" /> : null}
							</circle>
							<circle r="15" fill="var(--primary)" stroke="var(--card)" strokeWidth="3" />
							<foreignObject x="-8" y="-8" width="16" height="16">
								<Flag className="size-4 text-white" strokeWidth={2.6} />
							</foreignObject>
						</g>

						{/* The crew. */}
						{crew.map((p, i) => (
							<g key={p.id} ref={(el) => (markerRefs.current[i] = el)}>
								{p.id === 'aadi' ? (
									<circle
										r="15"
										fill={p.color}
										opacity="0.35"
										className="animate-ping-ring"
										style={{transformBox: 'fill-box', transformOrigin: 'center'}}
									/>
								) : null}
								<g transform="translate(0 -22)">
									<path d="M -7 12 L 0 21 L 7 12 Z" fill={p.color} />
									<circle r="18" fill={p.color} />
									<image href={p.avatar} x="-15" y="-15" width="30" height="30" clipPath={`url(#clip-${p.id})`} />
									<g transform="translate(0 -30)">
										<rect x={-p.name.length * 3.6 - 8} y="-10" width={p.name.length * 7.2 + 16} height="18" rx="9" fill={p.color} />
										<text textAnchor="middle" y="3.5" fontSize="10.5" fontWeight="800" fill="#fff" style={{fontFamily: 'var(--font-jakarta)'}}>
											{p.id === 'aadi' ? 'You' : p.name}
										</text>
									</g>
								</g>
							</g>
						))}
					</svg>

					{/* Kabir's ping, tied to his marker's last known spot on screen. */}
					<AnimatePresence>
						{ping ? (
							<motion.div
								initial={{opacity: 0, y: 10, scale: 0.85}}
								animate={{opacity: 1, y: 0, scale: 1}}
								exit={{opacity: 0, y: -6, scale: 0.9}}
								transition={{type: 'spring', stiffness: 420, damping: 26}}
								className="absolute left-[8%] top-[10%] flex items-center gap-2.5 rounded-2xl border border-border bg-card py-2 pl-2 pr-3.5 shadow-lift"
							>
								<span className="flex size-8 items-center justify-center rounded-xl bg-amber/15 text-amber">
									<Coffee className="size-4" />
								</span>
								<span className="text-left leading-tight">
									<span className="block text-xs font-extrabold">Chai stop?</span>
									<span className="block text-[11px] text-muted-foreground">Kabir · just now</span>
								</span>
							</motion.div>
						) : null}
					</AnimatePresence>
				</div>

				{/* Floating crew card, like the app's bottom rail. */}
				<motion.div
					initial={{opacity: 0, y: 24}}
					animate={{opacity: 1, y: 0}}
					transition={{duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1]}}
					className="absolute -bottom-8 left-1/2 flex w-[92%] -translate-x-1/2 gap-2 sm:-bottom-10 sm:gap-2.5"
				>
					{[3, 0, 1].map((i) => {
						const p = crew[i];
						return (
							<div
								key={p.id}
								className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-lift sm:p-2.5"
							>
								{/* eslint-disable-next-line @next/next/no-img-element -- generated data URI */}
								<img src={p.avatar} alt="" className="size-8 shrink-0 rounded-full border-2 sm:size-9" style={{borderColor: p.color}} />
								<span className="min-w-0 leading-tight">
									<span className="block truncate text-xs font-extrabold sm:text-sm">{p.id === 'aadi' ? 'You' : p.name}</span>
									<span className="block truncate text-[10px] tabular-nums text-muted-foreground sm:text-[11px]">{labels[i]}</span>
								</span>
							</div>
						);
					})}
				</motion.div>

				{/* Destination chip. */}
				<motion.div
					initial={{opacity: 0, x: 20}}
					animate={{opacity: 1, x: 0}}
					transition={{duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1]}}
					className="absolute -right-3 top-[18%] hidden items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3.5 shadow-lift sm:flex"
				>
					<span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Navigation className="size-3.5" />
					</span>
					<span className="text-xs font-bold">Lonavala</span>
					<span className="text-xs tabular-nums text-muted-foreground">{labels[3]}</span>
				</motion.div>

			</motion.div>
		</div>
	);
}
