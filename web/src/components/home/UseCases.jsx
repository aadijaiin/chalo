import {Bike, Car, GraduationCap, Mountain, Music, Plane, PartyPopper, Users} from 'lucide-react';

const CASES = [
	{icon: Car, label: 'Road trips'},
	{icon: Bike, label: 'Group rides'},
	{icon: Mountain, label: 'Treks'},
	{icon: PartyPopper, label: 'Wedding convoys'},
	{icon: GraduationCap, label: 'College trips'},
	{icon: Plane, label: 'Airport runs'},
	{icon: Music, label: 'Concert nights'},
	{icon: Users, label: 'Family drives'},
];

/** What people use it for, drifting past. Pauses when you hover. */
export function UseCases() {
	const row = [...CASES, ...CASES];
	return (
		<section aria-label="What chalo is for" className="relative border-y border-border/60 bg-background-2 py-5">
			<div className="mask-fade-x group flex overflow-hidden">
				<ul className="flex shrink-0 animate-marquee gap-3 pr-3 group-hover:[animation-play-state:paused]">
					{row.map(({icon: Icon, label}, i) => (
						<li
							key={i}
							aria-hidden={i >= CASES.length}
							className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold shadow-soft"
						>
							<Icon className="size-4 text-primary" />
							{label}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
