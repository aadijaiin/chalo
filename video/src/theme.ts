import {adventurer} from '@dicebear/collection';
import {createAvatar} from '@dicebear/core';
import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadText} from '@remotion/google-fonts/PlusJakartaSans';

// The app's and website's palette.
export const C = {
	sand: '#FAF7F2',
	sand2: '#F1ECE4',
	card: '#FFFFFF',
	ink: '#26211D',
	muted: '#7A726B',
	border: '#E7E0D6',
	primary: '#E2725B',
	primaryDeep: '#C9573F',
	sage: '#6A8F7C',
	night: '#121412',
	night2: '#1B1E1B',
	destructive: '#E5484D',
	amber: '#E29A2F',
	mapLand: '#F3EFE7',
	mapPark: '#DCE8D4',
	mapWater: '#C7DEEE',
	mapRoad: '#FFFFFF',
	mapHighway: '#F7D58B',
};

export const display = loadDisplay('normal', {weights: ['700', '800'], subsets: ['latin']}).fontFamily;
export const text = loadText('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}).fontFamily;

export type Who = 'riya' | 'kabir' | 'zoya' | 'aadi' | 'mom' | 'narrator' | 'crew';

// The same cast (and avatar seeds) as the app's demo crew and the website.
export const CAST: Record<Exclude<Who, 'narrator' | 'crew'>, {name: string; seed: string; color: string}> = {
	riya: {name: 'Riya', seed: 'riya-demo', color: '#2F8FC4'},
	kabir: {name: 'Kabir', seed: 'kabir-demo', color: '#8A6BCB'},
	zoya: {name: 'Zoya', seed: 'zoya-demo', color: '#E29A2F'},
	aadi: {name: 'Aadi', seed: 'aadi-demo', color: '#E2725B'},
	mom: {name: 'Mom', seed: 'mom-lookout-7', color: '#6A8F7C'},
};

const BACKGROUNDS = ['f6d5c8', 'd5e3dc', 'f3e6c4', 'dcd6ee', 'cfe3ef', 'f2d2dc'];
const cache = new Map<string, string>();
export function avatar(seed: string) {
	if (!cache.has(seed)) {
		cache.set(seed, createAvatar(adventurer, {seed, backgroundColor: BACKGROUNDS, backgroundType: ['solid']}).toDataUri());
	}
	return cache.get(seed)!;
}
