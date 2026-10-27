import {Contact, LegalPage} from '@/components/site/LegalPage';

export const metadata = {
	title: 'Delete your account',
	description: 'How to delete your chalo account and the data linked to it.',
};

export default function DeleteAccountPage() {
	return (
		<LegalPage title="Delete your account" updated="28 October 2026">
			<h2>From the app</h2>
			<ul>
				<li>Open chalo and tap your avatar at the top of the home screen.</li>
				<li>
					Tap <strong>Delete account</strong> at the bottom, then confirm.
				</li>
			</ul>
			<p>It takes effect straight away, and you&apos;re signed out on that phone.</p>

			<h2>Without the app</h2>
			<p>
				Email <Contact /> from the address you signed up with and ask us to delete your account. We&apos;ll
				do it within 7 days and reply when it&apos;s done.
			</p>

			<h2>What gets deleted</h2>
			<ul>
				<li>Your account, email address, name, username and avatar.</li>
				<li>Your live location, route trails, battery readings and push notification tokens.</li>
				<li>Your party memberships, pings and statuses.</li>
			</ul>

			<h2>What stays</h2>
			<ul>
				<li>
					Parties you host are handed to the person who&apos;s been in them longest, so the rest of the group
					keeps their trip history. Parties with nobody else in them are deleted.
				</li>
				<li>Pins you dropped on a party map stay for the others, without your name on them.</li>
			</ul>
			<p>Nothing is kept in backups beyond our database provider&apos;s standard backup window.</p>
		</LegalPage>
	);
}
