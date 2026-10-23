import { adventurer, bigSmile, lorelei, notionists } from '@dicebear/collection';
import { createAvatar, type Style } from '@dicebear/core';

// DiceBear avatars are generated locally from a seed: no network, no storage.
export type AvatarStyle = 'adventurer' | 'notionists' | 'bigSmile' | 'lorelei';

export const AVATAR_STYLES: Record<AvatarStyle, { label: string; style: Style<object> }> = {
  adventurer: { label: 'Explorer', style: adventurer },
  notionists: { label: 'Sketch', style: notionists },
  bigSmile: { label: 'Smiley', style: bigSmile },
  lorelei: { label: 'Doodle', style: lorelei },
};


export type AvatarConfig = {
  style: AvatarStyle;
  seed: string;
};

const BACKGROUNDS = ['f6d5c8', 'd5e3dc', 'f3e6c4', 'dcd6ee', 'cfe3ef', 'f2d2dc'];

const cache = new Map<string, string>();

export function avatarSvg({ style, seed }: AvatarConfig) {
  const id = `${style}:${seed}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const svg = createAvatar(AVATAR_STYLES[style]?.style ?? adventurer, {
    seed,
    backgroundColor: BACKGROUNDS,
    backgroundType: ['solid'],
  }).toString();
  cache.set(id, svg);
  return svg;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
