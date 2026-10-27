export const SITE = {
	name: 'chalo',
	url: 'https://chalo.aadijain.dev',
	tagline: 'Live location for your crew, on one map.',
	description:
		'Start a party and everyone in it shows up on one live map, with their own avatar, route and ETA. Built for road trips and group rides.',
	// Shown on the privacy and terms pages for data and account requests.
	contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
	// Fill these in once the app is in the stores; until then the site says it's coming soon.
	playStoreUrl: process.env.NEXT_PUBLIC_PLAY_STORE_URL || '',
	appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL || '',
};
