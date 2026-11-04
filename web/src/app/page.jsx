import {Faq} from '@/components/home/Faq';
import {Features} from '@/components/home/Features';
import {GetStarted} from '@/components/home/GetStarted';
import {Hero} from '@/components/home/Hero';
import {HowItWorks} from '@/components/home/HowItWorks';
import {Lookouts} from '@/components/home/Lookouts';
import {Promises} from '@/components/home/Promises';
import {UseCases} from '@/components/home/UseCases';
import {SiteFooter} from '@/components/site/SiteFooter';
import {SiteHeader} from '@/components/site/SiteHeader';
import {demoCrew, demoLookouts} from '@/lib/people';

export default function Home() {
	const crew = demoCrew();
	return (
		<>
			<SiteHeader />
			<main>
				<Hero crew={crew} />
				<UseCases />
				<Features crew={crew} />
				<Lookouts crew={crew} lookouts={demoLookouts()} />
				<HowItWorks />
				<Promises />
				<Faq />
				<GetStarted />
			</main>
			<SiteFooter />
		</>
	);
}
