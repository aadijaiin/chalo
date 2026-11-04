'use client';

import {AnimatePresence, LayoutGroup, motion} from 'motion/react';
import {Check, Eye, EyeOff, X} from 'lucide-react';
import {useState} from 'react';
import {cn} from '@/lib/utils';

// Where each crew member sits on Mom's little map (percentages), and their progress.
const SPOTS = {
	riya: {x: 72, y: 30, eta: '18 km · 22 min'},
	kabir: {x: 52, y: 52, eta: '24 km · 31 min'},
	zoya: {x: 30, y: 70, eta: '31 km · 40 min'},
	aadi: {x: 60, y: 42, eta: '21 km · 27 min'},
};

/**
 * Lookouts, explained by using them: approve a request as the crew, hide yourself, then flip to
 * Mom's phone to see what she gets. One state behind both views, so every switch shows up in both.
 */
export function LookoutDemo({crew, mom, nani}) {
	const [view, setView] = useState('crew');
	const [hidden, setHidden] = useState(false);
	const [naniStatus, setNaniStatus] = useState('asked'); // asked | in | declined

	const lookouts = [mom, ...(naniStatus === 'in' ? [nani] : [])];
	const visibleCrew = crew.filter((p) => !(hidden && p.id === 'aadi'));

	return (
		<div className="flex flex-col items-center gap-5">
			<LayoutGroup>
				<div role="tablist" aria-label="Whose phone" className="relative flex rounded-full border border-border bg-card p-1 shadow-soft">
					{[
						{id: 'crew', label: 'What the crew sees'},
						{id: 'lookout', label: 'What Mom sees'},
					].map((t) => (
						<button
							key={t.id}
							type="button"
							role="tab"
							aria-selected={view === t.id}
							onClick={() => setView(t.id)}
							className={cn(
								'relative rounded-full px-4 py-2 text-sm font-bold transition-colors',
								view === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
							)}
						>
							{view === t.id ? (
								<motion.span layoutId="lookout-tab" className="absolute inset-0 -z-0 rounded-full bg-primary" transition={{type: 'spring', stiffness: 400, damping: 32}} />
							) : null}
							<span className="relative">{t.label}</span>
						</button>
					))}
				</div>
			</LayoutGroup>

			<div className="relative w-full max-w-[22rem] rounded-[2.75rem] border border-border bg-foreground/90 p-2.5 shadow-lift dark:bg-white/10">
				<div className="absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
				<div className="relative h-[34rem] overflow-hidden rounded-[2.2rem] bg-background">
					<AnimatePresence mode="wait" initial={false}>
						{view === 'crew' ? (
							<motion.div
								key="crew"
								initial={{opacity: 0, x: -24}}
								animate={{opacity: 1, x: 0}}
								exit={{opacity: 0, x: -24}}
								transition={{duration: 0.28, ease: [0.22, 1, 0.36, 1]}}
								className="flex h-full flex-col gap-3 px-4 pb-4 pt-12"
							>
								<div className="text-lg font-extrabold">Lonavala ride</div>
								<div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
									<div className="flex">
										{crew.map((p, i) => (
											// eslint-disable-next-line @next/next/no-img-element -- generated data URI
											<img key={p.id} src={p.avatar} alt="" className="size-8 rounded-full border-2 border-card" style={{marginLeft: i ? -10 : 0}} />
										))}
									</div>
									<span className="leading-tight">
										<span className="block text-sm font-bold">Crew · 4</span>
										<span className="block text-[11px] text-sage">4 sharing location</span>
									</span>
								</div>
								<div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Lookouts · {lookouts.length}</div>
								<motion.ul layout className="overflow-hidden rounded-2xl border border-border bg-card">
									<AnimatePresence initial={false}>
										{lookouts.map((p, i) => (
											<motion.li
												key={p.id}
												layout
												initial={{opacity: 0, height: 0}}
												animate={{opacity: 1, height: 'auto'}}
												exit={{opacity: 0, height: 0}}
												className={cn('flex items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-border')}
											>
												<Avatar p={p} dashed />
												<span className="min-w-0 flex-1 leading-tight">
													<span className="block text-sm font-bold">{p.name}</span>
													<span className="block text-[11px] text-muted-foreground">watching, not sharing</span>
												</span>
											</motion.li>
										))}
									</AnimatePresence>
								</motion.ul>

								<AnimatePresence>
									{naniStatus === 'asked' ? (
										<motion.div
											layout
											initial={{opacity: 0, y: 10}}
											animate={{opacity: 1, y: 0}}
											exit={{opacity: 0, scale: 0.95}}
											className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3"
										>
											<Avatar p={nani} dashed />
											<span className="min-w-0 flex-1 leading-tight">
												<span className="block text-sm font-bold">{nani.name}</span>
												<span className="block text-[11px] text-muted-foreground">wants to watch</span>
											</span>
											<motion.button
												type="button"
												whileTap={{scale: 0.9}}
												onClick={() => setNaniStatus('declined')}
												aria-label="Decline Nani"
												className="flex size-8 items-center justify-center rounded-full bg-muted"
											>
												<X className="size-3.5" />
											</motion.button>
											<motion.button
												type="button"
												whileTap={{scale: 0.92}}
												onClick={() => setNaniStatus('in')}
												className="flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground"
											>
												<Check className="size-3.5" />
												Let in
											</motion.button>
										</motion.div>
									) : (
										<motion.button
											layout
											key="again"
											type="button"
											initial={{opacity: 0}}
											animate={{opacity: 1}}
											onClick={() => setNaniStatus('asked')}
											className="text-left text-[11px] font-semibold text-muted-foreground underline-offset-4 hover:underline"
										>
											{naniStatus === 'in' ? 'Nani is in.' : 'Declined.'} Show the request again
										</motion.button>
									)}
								</AnimatePresence>

								<motion.div layout className="mt-auto flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
									<span className="flex size-9 items-center justify-center rounded-xl bg-muted">
										{hidden ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
									</span>
									<span className="min-w-0 flex-1 leading-tight">
										<span className="block text-sm font-bold">{hidden ? 'Lookouts can’t see you' : 'Lookouts can see you'}</span>
										<span className="block text-[11px] text-muted-foreground">Your crew always can.</span>
									</span>
									<Switch checked={hidden} onChange={setHidden} label="Hide me from lookouts" />
								</motion.div>
								<p className="text-center text-[11px] font-semibold text-muted-foreground">
									Flip to <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setView('lookout')}>Mom’s phone</button> to see the difference.
								</p>
							</motion.div>
						) : (
							<motion.div
								key="lookout"
								initial={{opacity: 0, x: 24}}
								animate={{opacity: 1, x: 0}}
								exit={{opacity: 0, x: 24}}
								transition={{duration: 0.28, ease: [0.22, 1, 0.36, 1]}}
								className="flex h-full flex-col"
							>
								<div className="relative h-[55%] bg-[var(--map-land)]">
									<svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
										<ellipse cx="80" cy="80" rx="30" ry="18" fill="var(--map-park)" />
										<path d="M 0 60 C 30 70, 40 30, 70 40 S 90 10, 100 8" fill="none" stroke="var(--map-water)" strokeWidth="6" />
										<path d="M 20 95 C 30 78, 30 72, 30 70 S 45 55, 52 52 S 62 44, 60 42 S 70 32, 72 30 S 85 18, 92 10" fill="none" stroke="var(--map-highway)" strokeWidth="4" strokeLinecap="round" />
									</svg>
									<div className="absolute left-3 right-3 top-10 flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-bold shadow-soft">
										<Eye className="size-3.5 text-primary" />
										Lookout <span className="font-normal text-muted-foreground">· the crew can’t see you</span>
									</div>
									<AnimatePresence>
										{visibleCrew.map((p) => (
											<motion.img
												key={p.id}
												src={p.avatar}
												alt=""
												initial={{opacity: 0, scale: 0.4}}
												animate={{opacity: 1, scale: 1}}
												exit={{opacity: 0, scale: 0.4}}
												transition={{type: 'spring', stiffness: 400, damping: 22}}
												className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-soft"
												style={{left: `${SPOTS[p.id].x}%`, top: `${SPOTS[p.id].y}%`, borderColor: p.color}}
											/>
										))}
									</AnimatePresence>
								</div>
								<ul className="flex flex-1 flex-col gap-1.5 p-3">
									{crew.map((p) => {
										const off = hidden && p.id === 'aadi';
										return (
											<motion.li layout key={p.id} className="flex items-center gap-2.5 rounded-xl bg-card px-2.5 py-2">
												<Avatar p={p} faded={off} />
												<span className="min-w-0 flex-1 leading-tight">
													<span className="block text-xs font-bold">{p.name}</span>
													<span className="block text-[11px] text-muted-foreground">{off ? 'Hidden from lookouts' : `${SPOTS[p.id].eta} to go`}</span>
												</span>
											</motion.li>
										);
									})}
								</ul>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

function Avatar({p, dashed, faded}) {
	return (
		// eslint-disable-next-line @next/next/no-img-element -- generated data URI
		<img
			src={p.avatar}
			alt=""
			className={cn('size-9 shrink-0 rounded-full border-2 transition-opacity', dashed && 'border-dashed', faded && 'opacity-35 grayscale')}
			style={{borderColor: dashed ? 'var(--muted-foreground)' : p.color}}
		/>
	);
}

function Switch({checked, onChange, label}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={cn('flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors', checked ? 'bg-primary' : 'bg-muted-foreground/35')}
		>
			<motion.span layout transition={{type: 'spring', stiffness: 600, damping: 32}} className={cn('size-6 rounded-full bg-card shadow-soft', checked && 'ml-auto')} />
		</button>
	);
}

