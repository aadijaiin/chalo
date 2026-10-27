import Link from 'next/link';
import {Contact, LegalPage} from '@/components/site/LegalPage';

export const metadata = {
	title: 'Privacy policy',
	description: 'What chalo collects, who sees it, and how long it is kept.',
};

export default function PrivacyPage() {
	return (
		<LegalPage title="Privacy policy" updated="28 October 2026">
			<p>
				chalo shares your live location with the people in a party you join. That&apos;s the whole point
				of the app, so this page explains exactly what we collect, who can see it, and how long we keep
				it.
			</p>

			<h2>What we collect</h2>
			<ul>
				<li>
					<strong>Your account:</strong> email address, name, username, and the settings for the avatar
					you picked. We don&apos;t collect your phone number or contacts.
				</li>
				<li>
					<strong>Your location, only while you&apos;re in a party:</strong> position, accuracy, speed and
					direction, plus your distance and ETA to the party&apos;s destination. If you allow
					&ldquo;all the time&rdquo; location, this continues while your phone is locked, until you leave
					the party or it ends. Outside a party, your location stays on your phone.
				</li>
				<li>
					<strong>A route trail for the trip recap:</strong> a point roughly every 100 metres while
					you&apos;re in a party.
				</li>
				<li>
					<strong>Battery level</strong> and whether you&apos;re charging, sent with your location so
					your party can tell a dying phone from a quiet one.
				</li>
				<li>
					<strong>What you post to a party:</strong> pings and statuses (like &ldquo;chai stop&rdquo; or an
					SOS), any message you write with them, and pins you drop on the map.
				</li>
				<li>
					<strong>A push notification token</strong> for your device, so we can notify you about your
					party.
				</li>
			</ul>

			<h2>Who can see it</h2>
			<ul>
				<li>
					Only the members of a party can see that party&apos;s locations, trails, pings and pins. Anyone
					with the party code can join while the party is live, so share it only with people you trust.
				</li>
				<li>Your name, username and avatar are visible to people in parties with you.</li>
				<li>We don&apos;t sell your data, show ads, or share your location with anyone else.</li>
			</ul>

			<h2>How long we keep it</h2>
			<ul>
				<li>
					Your live position is deleted as soon as you leave a party or it ends. Parties end
					automatically after 24 hours, or after 2 hours with nobody sharing.
				</li>
				<li>Route trails are deleted 30 days after they were recorded.</li>
				<li>
					Party history (name, members, pings, pins) stays so you can look back at past trips, until you
					delete your account.
				</li>
			</ul>

			<h2>Services we rely on</h2>
			<p>To run chalo, some data passes through these providers:</p>
			<ul>
				<li>
					<strong>Supabase</strong> hosts our database and sign-in, and stores everything listed above.
				</li>
				<li>
					<strong>Expo</strong> and <strong>Google Firebase Cloud Messaging</strong> deliver push
					notifications. They receive your device token and the notification text.
				</li>
				<li>
					<strong>OSRM</strong> (the public Open Source Routing Machine server) receives the start and end
					points of routes to work out directions and ETAs.
				</li>
				<li>
					<strong>Photon</strong> (komoot) receives the text you type when searching for a place.
				</li>
				<li>
					<strong>OpenFreeMap</strong> serves the map images, and like any website sees your device&apos;s
					IP address when it loads them.
				</li>
			</ul>

			<h2>Your choices</h2>
			<ul>
				<li>You can stop sharing at any time by leaving the party (or ending it, if you&apos;re the host).</li>
				<li>
					You can turn off background location or notifications in your phone&apos;s settings; the app
					still works while it&apos;s open.
				</li>
				<li>
					You can delete your account and everything linked to it from the app (tap your avatar, then{' '}
					<strong>Delete account</strong>), or by emailing us. See{' '}
					<Link href="/delete-account">deleting your account</Link> for what&apos;s removed.
				</li>
				<li>
					To get a copy of your data, contact us at <Contact />.
				</li>
			</ul>

			<h2>Children</h2>
			<p>chalo isn&apos;t meant for children under 13, and we don&apos;t knowingly collect their data.</p>

			<h2>Changes</h2>
			<p>
				If we change how we handle your data, we&apos;ll update this page and the date at the top, and
				tell you in the app for anything significant.
			</p>
		</LegalPage>
	);
}
