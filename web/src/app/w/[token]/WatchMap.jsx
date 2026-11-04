'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import {AnimatePresence, motion} from 'motion/react';
import {BatteryLow, Bell, BellRing, Eye, Flag, Siren} from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import {useTheme} from 'next-themes';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Logo} from '@/components/site/Logo';
import {avatarDataUri, MEMBER_COLORS} from '@/lib/avatar';
import {formatDuration, formatKm, timeAgo} from '@/lib/format';
import {publicRpc} from '@/lib/supabase';

const STYLE = {
	light: 'https://tiles.openfreemap.org/styles/liberty',
	dark: 'https://tiles.openfreemap.org/styles/dark',
};
const POLL_MS = 10_000;

// What each alert says, here and in the browser notification.
const ALERTS = {
	sos: {label: 'SOS', says: (m) => `${m.name} needs help`, tone: 'bg-destructive text-white'},
	behind: {label: 'Fell behind', says: (m) => `${m.name} fell ${m.alert.message ?? 'far'} behind`, tone: 'bg-amber-500 text-white'},
	arrived: {label: 'Arrived', says: (m) => `${m.name} arrived`, tone: 'bg-sage text-white'},
};

/** Alerts that are new since the last poll, so each one notifies once. */
function freshAlerts(prev, next) {
	const seen = new Set((prev?.crew ?? []).map((m) => m.alert && `${m.avatarSeed}:${m.alert.kind}:${m.alert.at}`));
	return (next?.crew ?? []).filter((m) => m.alert && ALERTS[m.alert.kind] && !seen.has(`${m.avatarSeed}:${m.alert.kind}:${m.alert.at}`));
}

const noSubscribe = () => () => {};

function canNotify() {
	return typeof window !== 'undefined' && 'Notification' in window;
}
// Same as the app: a phone that hasn't posted for this long is shown faded at its last spot.
const STALE_MS = 3 * 60_000;

function markerEl(member, color) {
	const el = document.createElement('div');
	el.className = 'flex flex-col items-center';
	el.innerHTML = `
		<span class="mb-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow" style="background:${color}"></span>
		<img alt="" class="size-10 rounded-full border-[3px] bg-white shadow-lg" style="border-color:${color}" />`;
	el.querySelector('span').textContent = member.name;
	el.querySelector('img').src = avatarDataUri(member.avatarStyle, member.avatarSeed);
	return el;
}

function flagEl() {
	const el = document.createElement('div');
	el.className = 'flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg';
	el.innerHTML =
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.3 2a6.3 6.3 0 0 0 3.7-1.2 1 1 0 0 1 1 .2V15a1 1 0 0 1-.4.8A6 6 0 0 1 16 17c-3 0-5-2-7.3-2a6.3 6.3 0 0 0-3.7 1.2"/></svg>';
	return el;
}

/** The crew live on a map, refreshed every few seconds. Read-only; the viewer shares nothing. */
export default function WatchMap({token, initial}) {
	const {resolvedTheme} = useTheme();
	const [trip, setTrip] = useState(initial);
	const [now, setNow] = useState(() => Date.now());
	const mapRef = useRef(null);
	const containerRef = useRef(null);
	const markers = useRef(new Map());
	const framed = useRef(false);
	// Old phones and locked-down browsers have no WebGL; the crew list still works without the map.
	const [mapFailed, setMapFailed] = useState(false);
	// A shimmer covers the map until its first tiles are drawn.
	const [mapReady, setMapReady] = useState(false);

	// Poll while the tab is visible; null back means the trip is over or the link was turned off.
	useEffect(() => {
		let stop = false;
		async function tick() {
			if (document.visibilityState !== 'visible') return;
			const next = await publicRpc('watch_party', {token}).catch(() => undefined);
			if (stop || next === undefined) return;
			setTrip((prev) => {
				if (canNotify() && Notification.permission === 'granted') {
					for (const m of freshAlerts(prev, next)) {
						new Notification(ALERTS[m.alert.kind].says(m), {
							body: m.alert.kind === 'sos' ? 'Open the page to see where they are.' : next.name,
							tag: `${m.avatarSeed}:${m.alert.kind}`,
						});
					}
				}
				return next;
			});
			setNow(Date.now());
		}
		const id = setInterval(tick, POLL_MS);
		document.addEventListener('visibilitychange', tick);
		return () => {
			stop = true;
			clearInterval(id);
			document.removeEventListener('visibilitychange', tick);
		};
	}, [token]);

	const scheme = resolvedTheme === 'dark' ? 'dark' : 'light';
	useEffect(() => {
		if (!containerRef.current) return;
		let map;
		try {
			map = new maplibregl.Map({
				container: containerRef.current,
				style: STYLE[scheme],
				center: [78.9629, 22.5937],
				zoom: 3.5,
				attributionControl: {compact: true},
			});
		} catch {
			// The constructor throws without WebGL; report it after this effect has run.
			queueMicrotask(() => setMapFailed(true));
			return;
		}
		map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'top-right');
		map.on('load', () => setMapReady(true));
		// On a patchy connection the style request can fail, which leaves a blank map; try again.
		let retry;
		map.on('error', () => {
			if (map.isStyleLoaded() || retry) return;
			retry = setTimeout(() => {
				retry = undefined;
				map.setStyle(STYLE[scheme]);
			}, 3000);
		});
		mapRef.current = map;
		const current = markers.current;
		return () => {
			clearTimeout(retry);
			current.clear();
			framed.current = false;
			map.remove();
		};
	}, [scheme]);

	const crew = trip?.crew ?? [];

	useEffect(() => {
		const map = mapRef.current;
		if (!map || !trip) return;
		const crew = trip.crew;
		const onMap = crew.filter((m) => m.lat != null);
		const seen = new Set();
		crew.forEach((m, i) => {
			if (m.lat == null) return;
			const key = m.avatarSeed;
			seen.add(key);
			let marker = markers.current.get(key);
			if (!marker) {
				marker = new maplibregl.Marker({element: markerEl(m, MEMBER_COLORS[i % MEMBER_COLORS.length]), anchor: 'bottom'});
				marker.setLngLat([m.lng, m.lat]).addTo(map);
				markers.current.set(key, marker);
			}
			marker.setLngLat([m.lng, m.lat]);
			marker.getElement().style.opacity = now - new Date(m.updatedAt).getTime() > STALE_MS ? '0.5' : '1';
		});
		if (trip.destination) {
			const at = [trip.destination.lng, trip.destination.lat];
			let flag = markers.current.get('__dest');
			if (!flag) {
				// A marker needs its position before it's added to the map.
				flag = new maplibregl.Marker({element: flagEl()}).setLngLat(at).addTo(map);
				markers.current.set('__dest', flag);
			}
			flag.setLngLat(at);
			seen.add('__dest');
		}
		for (const [key, marker] of markers.current) {
			if (!seen.has(key)) {
				marker.remove();
				markers.current.delete(key);
			}
		}

		// Frame the crew once, as soon as there's someone to frame.
		if (!framed.current && onMap.length > 0) {
			framed.current = true;
			const bounds = new maplibregl.LngLatBounds();
			onMap.forEach((m) => bounds.extend([m.lng, m.lat]));
			map.fitBounds(bounds, {padding: 80, maxZoom: 14, duration: 0});
		}
	}, [trip, now, scheme]);

	function focus(m) {
		mapRef.current?.flyTo({center: [m.lng, m.lat], zoom: 14});
	}

	const ended = trip === null;
	const sos = crew.filter((m) => m.alert?.kind === 'sos');
	// The browser's answer, read without a hydration mismatch ('default' on the server).
	const browserPermission = useSyncExternalStore(
		noSubscribe,
		() => (canNotify() ? Notification.permission : 'unsupported'),
		() => 'default',
	);
	const [answered, setAnswered] = useState(null);
	const permission = answered ?? browserPermission;
	async function enableAlerts() {
		if (canNotify()) setAnswered(await Notification.requestPermission());
	}

	return (
		<main className="flex h-dvh flex-col bg-background lg:flex-row-reverse">
			<div className="relative min-h-0 flex-1">
				{/* maplibre's CSS makes its container position: relative, so it can't be the absolute layer. */}
				<div className="absolute inset-0">
					<div ref={containerRef} className="h-full w-full" />
				</div>
				<AnimatePresence>
					{!mapReady && !mapFailed ? (
						<motion.div key="map-skeleton" exit={{opacity: 0, transition: {duration: 0.5}}} className="skeleton absolute inset-0 rounded-none" aria-hidden />
					) : null}
				</AnimatePresence>
				{mapFailed ? (
					<div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
						This browser can&apos;t show the map, but the crew&apos;s progress is listed below.
					</div>
				) : null}
				{ended ? (
					<div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm">
						<div className="max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl">
							<h2 className="text-xl font-extrabold">The trip has ended</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								Location sharing has stopped, so there&apos;s nothing more to see here.
							</p>
						</div>
					</div>
				) : null}
			</div>

			<aside className="flex max-h-[45dvh] flex-col gap-4 overflow-y-auto border-t border-border bg-card p-4 sm:p-5 lg:max-h-none lg:w-96 lg:border-r lg:border-t-0">
				<div className="flex items-center justify-between gap-3">
					<Logo />
					<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
						<Eye className="size-3.5" />
						Watching
					</span>
				</div>

				<div>
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						<span className={`size-2 rounded-full ${ended ? 'bg-muted-foreground/40' : 'bg-sage'}`} />
						{ended ? 'Ended' : `Live · started ${timeAgo(initial.startedAt)}`}
					</div>
					<h1 className="mt-1 text-2xl font-extrabold tracking-tight">{initial.name}</h1>
					{initial.destination ? (
						<p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
							<Flag className="size-3.5 text-primary" />
							Headed to <strong className="text-foreground">{initial.destination.name}</strong>
						</p>
					) : null}
				</div>

				{sos.map((m) => (
					<button
						key={m.avatarSeed}
						type="button"
						onClick={() => m.lat != null && focus(m)}
						className="flex items-center gap-3 rounded-2xl bg-destructive p-3 text-left font-bold text-white shadow-lg"
					>
						<Siren className="size-5 shrink-0" />
						<span className="flex-1">
							{m.name} needs help
							<span className="block text-xs font-normal text-white/85">Tap to see where they are</span>
						</span>
					</button>
				))}

				<ul className="flex flex-col gap-2">
					{crew.map((m, i) => {
						const stale = !m.updatedAt || now - new Date(m.updatedAt).getTime() > STALE_MS;
						const detail =
							m.lat == null
								? 'Not sharing yet'
								: m.remainingM === 0
									? 'Arrived'
									: m.remainingM != null
										? `${formatKm(m.remainingM)}${m.etaS ? ` · ${formatDuration(m.etaS)}` : ''} to go`
										: m.speed > 1
											? `${Math.round(m.speed * 3.6)} km/h`
											: 'On the map';
						return (
							<li key={m.avatarSeed}>
								<button
									type="button"
									disabled={m.lat == null}
									onClick={() => focus(m)}
									className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition-colors hover:bg-muted disabled:hover:bg-background"
								>
									{/* eslint-disable-next-line @next/next/no-img-element -- a generated data URI */}
									<img
										src={avatarDataUri(m.avatarStyle, m.avatarSeed)}
										alt=""
										className="size-10 rounded-full border-[3px]"
										style={{borderColor: MEMBER_COLORS[i % MEMBER_COLORS.length]}}
									/>
									<span className="min-w-0 flex-1">
										<span className="flex items-center gap-1.5 truncate font-bold">
											{m.name}
											{m.host ? <span className="font-normal text-muted-foreground">· host</span> : null}
											{m.alert && ALERTS[m.alert.kind] ? (
												<span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${ALERTS[m.alert.kind].tone}`}>
													{ALERTS[m.alert.kind].label}
												</span>
											) : null}
										</span>
										<span className="block truncate text-xs text-muted-foreground">
											{detail}
											{m.updatedAt && stale ? ` · seen ${timeAgo(m.updatedAt)}` : ''}
										</span>
									</span>
									{m.battery != null && m.battery <= 0.2 ? (
										<span className="flex items-center gap-1 text-xs font-semibold text-destructive">
											<BatteryLow className="size-4" />
											{Math.round(m.battery * 100)}%
										</span>
									) : null}
								</button>
							</li>
						);
					})}
				</ul>

				{permission !== 'unsupported' && permission !== 'granted' && !ended ? (
					<button
						type="button"
						onClick={enableAlerts}
						disabled={permission === 'denied'}
						className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
					>
						<Bell className="size-4" />
						{permission === 'denied' ? 'Notifications are blocked in this browser' : 'Notify me about SOS and arrivals'}
					</button>
				) : permission === 'granted' && !ended ? (
					<p className="flex items-center gap-2 text-xs font-semibold text-sage">
						<BellRing className="size-4" />
						You&apos;ll get a notification for SOS and arrivals while this page is open.
					</p>
				) : null}

				<p className="mt-auto text-xs leading-relaxed text-muted-foreground">
					You&apos;re following in your browser. Nothing about you is shared with the crew, and this page stops
					working when the trip ends. For alerts even when this page is closed, watch in the chalo app.
				</p>
			</aside>
		</main>
	);
}
