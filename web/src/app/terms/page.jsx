import Link from 'next/link';
import {Contact, LegalPage} from '@/components/site/LegalPage';

export const metadata = {
	title: 'Terms of use',
	description: 'The rules for using chalo.',
};

export default function TermsPage() {
	return (
		<LegalPage title="Terms of use" updated="28 October 2026">
			<p>
				By creating an account or using chalo, you agree to these terms. They&apos;re short, and written to
				be read.
			</p>

			<h2>Using chalo</h2>
			<ul>
				<li>You need to be at least 13 to use chalo.</li>
				<li>Keep your account details to yourself; you&apos;re responsible for what happens on it.</li>
				<li>
					Only share a party code with people you want to see your location, and only invite people who
					agree to share theirs.
				</li>
				<li>
					Don&apos;t use chalo to track, follow or harass anyone, or to share someone&apos;s location
					without their consent.
				</li>
			</ul>

			<h2>Don&apos;t rely on it in an emergency</h2>
			<p>
				Locations, ETAs, routes and alerts (including SOS) depend on GPS, mobile signal, battery and
				third-party services, and can be late, inaccurate or missing. chalo is not an emergency service.
				In an emergency, call your local emergency number. Never use the app in a way that distracts you
				from driving.
			</p>

			<h2>What you post</h2>
			<p>
				You&apos;re responsible for the names, messages and pins you add. Don&apos;t post anything
				illegal, abusive or misleading. We may remove content or suspend accounts that break these
				terms.
			</p>

			<h2>The service</h2>
			<p>
				chalo is provided as it is. We work to keep it running, but we can&apos;t promise it will always
				be available or free of errors, and we may change or discontinue features. To the extent the law
				allows, we aren&apos;t liable for losses that come from using it.
			</p>

			<h2>Your data</h2>
			<p>
				How we handle your data is covered by our <Link href="/privacy">privacy policy</Link>.
			</p>

			<h2>Ending your account</h2>
			<p>
				You can stop using chalo at any time, and delete your account from the app or by contacting us at{' '}
				<Contact /> (<Link href="/delete-account">how</Link>). We may close accounts that break these
				terms.
			</p>

			<h2>Changes</h2>
			<p>
				We may update these terms. If we make significant changes, we&apos;ll let you know in the app. If
				you keep using chalo after that, you accept the new terms.
			</p>
		</LegalPage>
	);
}
