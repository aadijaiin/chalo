'use client';

import {AnimatePresence, motion} from 'motion/react';
import {Plus} from 'lucide-react';
import {useId, useState} from 'react';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {cn} from '@/lib/utils';

const FAQ = [
	{
		q: 'Is chalo free?',
		a: 'Yes. No ads, no subscription, and nothing hidden behind a paywall.',
	},
	{
		q: 'Who can see where I am?',
		a: 'Only the people in your party right now: the crew, and lookouts the host let in (unless you hide yourself from lookouts). If the host shares a web link, it shows the crew the same way. Leave the party and nobody sees you any more.',
	},
	{
		q: 'Does it work with my phone locked?',
		a: 'Yes, if you allow location “all the time”. chalo asks when you start or join a party, and explains why first. Without it, you’re shared while the app is open.',
	},
	{
		q: 'Will it drain my battery?',
		a: 'It uses precise GPS while you’re moving and drops to low power once you’ve been parked for a couple of minutes, and otherwise sends an update only when you’ve moved (plus a small check-in about once a minute). A long drive still uses battery, like navigation does, so keep a charger handy.',
	},
	{
		q: 'What if there’s no signal?',
		a: 'Save the map along your route before you head into the hills and it keeps working offline. Your crew sees your last known spot (with how long ago), and updates pick up again when the signal comes back.',
	},
	{
		q: 'How long does a party last?',
		a: 'Until the host ends it. If they forget, it ends by itself after 24 hours, or after 2 hours with nobody sharing.',
	},
	{
		q: 'Is there an iPhone app?',
		a: 'Not yet. Friends on iPhone can still follow a trip in their browser with a watch link from the host.',
	},
	{
		q: 'Why isn’t it on the Play Store?',
		a: 'It will be. Until then you download it from this site; Android may warn you because it didn’t come from the Play Store. The download page explains what to tap.',
	},
];

export function Faq() {
	const [open, setOpen] = useState(0);
	const base = useId();
	return (
		<section id="faq" className="relative py-24 sm:py-32">
			<div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
				<SectionHeading eyebrow="FAQ" title="Questions people ask" lead="The short answers. The privacy policy has the long ones." />
				<ul className="flex flex-col gap-3">
					{FAQ.map((item, i) => {
						const isOpen = open === i;
						const id = `${base}-${i}`;
						return (
							<li key={item.q} className={cn('overflow-hidden rounded-3xl border bg-card transition-colors', isOpen ? 'border-primary/40 shadow-soft' : 'border-border')}>
								<button
									type="button"
									aria-expanded={isOpen}
									aria-controls={id}
									onClick={() => setOpen(isOpen ? -1 : i)}
									className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
								>
									<span className="font-sans text-base font-extrabold sm:text-lg">{item.q}</span>
									<motion.span
										animate={{rotate: isOpen ? 45 : 0}}
										transition={{type: 'spring', stiffness: 400, damping: 25}}
										className={cn('flex size-8 shrink-0 items-center justify-center rounded-full transition-colors', isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted')}
									>
										<Plus className="size-4" />
									</motion.span>
								</button>
								<AnimatePresence initial={false}>
									{isOpen ? (
										<motion.div
											id={id}
											initial={{height: 0, opacity: 0}}
											animate={{height: 'auto', opacity: 1}}
											exit={{height: 0, opacity: 0}}
											transition={{duration: 0.32, ease: [0.22, 1, 0.36, 1]}}
										>
											<p className="px-5 pb-5 text-[15.5px] leading-relaxed text-muted-foreground sm:px-6">{item.a}</p>
										</motion.div>
									) : null}
								</AnimatePresence>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
