import {adventurer, bigSmile, lorelei, notionists} from '@dicebear/collection';
import {createAvatar} from '@dicebear/core';

// Same styles and backgrounds as the app (app/lib/avatar.ts), so people look the same here.
const STYLES = {adventurer, notionists, bigSmile, lorelei};
const BACKGROUNDS = ['f6d5c8', 'd5e3dc', 'f3e6c4', 'dcd6ee', 'cfe3ef', 'f2d2dc'];

export const MEMBER_COLORS = [
	'hsl(200 62% 48%)',
	'hsl(262 48% 60%)',
	'hsl(38 78% 50%)',
	'hsl(152 40% 42%)',
	'hsl(330 55% 56%)',
	'hsl(180 45% 40%)',
];

function avatar(style, seed) {
	return createAvatar(STYLES[style] ?? adventurer, {
		seed,
		backgroundColor: BACKGROUNDS,
		backgroundType: ['solid'],
	});
}

export function avatarDataUri(style, seed) {
	return avatar(style, seed).toDataUri();
}

/** Base64 data URI, which next/og needs (it can't read URL-encoded ones). Server only. */
export function avatarBase64Uri(style, seed) {
	return `data:image/svg+xml;base64,${Buffer.from(avatar(style, seed).toString()).toString('base64')}`;
}
