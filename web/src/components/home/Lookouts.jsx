import {Bell, EyeOff, Globe, ShieldCheck} from 'lucide-react';
import {Reveal, Stagger, staggerItem} from '@/components/ui/Reveal';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {LookoutDemo} from './LookoutDemo';
import {MotionLi} from './MotionLi';

const POINTS = [
	{
		icon: ShieldCheck,
		title: 'The host lets each lookout in',
		body: 'Anyone with the code can ask. Nobody watches until the host says yes, and they can remove a lookout any time.',
	},
	{
		icon: EyeOff,
		title: 'It only goes one way',
		body: 'Lookouts never share a location. Anyone in the crew can hide themselves from lookouts too.',
	},
	{
		icon: Bell,
		title: 'Only the alerts that matter',
		body: 'SOS, “almost there”, arrivals and anyone falling behind. None of the chai-stop chatter.',
	},
	{
		icon: Globe,
		title: 'No app? Send a web link',
		body: 'The host can share a browser link that shows the crew live until the trip ends.',
	},
];

export function Lookouts({crew, lookouts}) {
	return (
		<section id="lookouts" className="grain relative overflow-hidden bg-background-2 py-24 sm:py-32">
			<div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
			<div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-20">
				<div className="flex flex-col gap-10">
					<SectionHeading
						eyebrow="Lookouts"
						title={
							<>
								Let the folks at home <span className="text-primary">follow along</span>
							</>
						}
						lead="Parents can watch the trip live without joining it. They see the crew; nobody sees them. Try both sides on the phone."
					/>
					<Stagger as="ul" className="grid gap-5 sm:grid-cols-2">
						{POINTS.map(({icon: Icon, title, body}) => (
							<MotionLi key={title} variants={staggerItem} className="flex flex-col gap-2">
								<span className="flex size-10 items-center justify-center rounded-2xl bg-card text-primary shadow-soft">
									<Icon className="size-5" />
								</span>
								<h3 className="font-sans text-base font-extrabold">{title}</h3>
								<p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
							</MotionLi>
						))}
					</Stagger>
				</div>
				<Reveal delay={0.1}>
					<LookoutDemo crew={crew} mom={lookouts.mom} nani={lookouts.nani} />
				</Reveal>
			</div>
		</section>
	);
}
