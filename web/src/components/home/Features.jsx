import {SectionHeading} from '@/components/ui/SectionHeading';
import {BatteryCard, BehindCard, EtaCard, OfflineCard, PinsCard, PingCard, RecapCard} from './FeatureCards';

/** Everything the app does, as small things you can play with rather than read about. */
export function Features({crew}) {
	return (
		<section id="features" className="relative py-24 sm:py-32">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionHeading
					eyebrow="Features"
					title={
						<>
							Everything the group chat <span className="text-primary">can&apos;t</span> do
						</>
					}
					lead="No more “where are you?” every ten minutes. chalo keeps the whole crew in step, and these cards all work, so go ahead and press things."
				/>
				<div className="mt-14 grid gap-4 lg:grid-cols-6 lg:gap-5">
					<PingCard crew={crew} />
					<EtaCard />
					<BehindCard crew={crew} />
					<PinsCard />
					<BatteryCard crew={crew} />
					<OfflineCard />
					<RecapCard />
				</div>
			</div>
		</section>
	);
}
