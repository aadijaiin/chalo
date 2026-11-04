import {avatarDataUri} from './avatar';

/**
 * The made-up crew in the site's illustrations. Avatars are generated here, on the server, so the
 * browser never downloads the avatar library just to draw the marketing pages.
 */
const CREW = [
	{id: 'riya', name: 'Riya', seed: 'riya-demo', color: 'var(--crew-1)'},
	{id: 'kabir', name: 'Kabir', seed: 'kabir-demo', color: 'var(--crew-2)'},
	{id: 'zoya', name: 'Zoya', seed: 'zoya-demo', color: 'var(--crew-3)'},
	{id: 'aadi', name: 'Aadi', seed: 'aadi-demo', color: 'var(--primary)'},
];

const MOM = {id: 'mom', name: 'Mom', seed: 'mom-lookout-7', color: 'var(--sage)'};
const NANI = {id: 'nani', name: 'Nani', seed: 'nani-lookout-2', color: 'var(--sage)'};

const withAvatar = (p) => ({...p, avatar: avatarDataUri('adventurer', p.seed)});

export function demoCrew() {
	return CREW.map(withAvatar);
}

export function demoLookouts() {
	return {mom: withAvatar(MOM), nani: withAvatar(NANI)};
}
