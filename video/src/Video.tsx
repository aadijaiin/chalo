import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Behind, LiveMap, Party, Pings} from './scenes/App';
import {End, Mom, Recap} from './scenes/Closing';
import {Hook, Reveal} from './scenes/Opening';
import {buildTimeline, type Line, type Scene, type SceneName} from './timeline';

export type VideoProps = {lang: 'en' | 'hi'; lines: Line[]};

const SCENES: Record<Exclude<SceneName, 'end'>, React.FC<{scene: Scene}>> = {
	hook: Hook,
	reveal: Reveal,
	party: Party,
	map: LiveMap,
	pings: Pings,
	behind: Behind,
	mom: Mom,
	recap: Recap,
};

const CREDITS: Record<VideoProps['lang'], string> = {
	en: 'Music: “Wallpaper” by Kevin MacLeod (incompetech.com), CC BY 4.0 · Voices: ElevenLabs',
	hi: 'Music: “Wallpaper” by Kevin MacLeod (incompetech.com), CC BY 4.0 · Voices: ElevenLabs',
};

export const ChaloVideo: React.FC<VideoProps> = ({lang, lines}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const {scenes} = buildTimeline(lines, fps);
	const spoken = scenes.flatMap((s) => s.lines);

	// Music sits under the voices: full between lines, ducked while someone's talking, faded out.
	const music = (f: number) => {
		const talking = spoken.some((l) => f >= l.from - 5 && f <= l.from + l.frames + 5);
		const near = spoken.some((l) => f >= l.from - 10 && f <= l.from + l.frames + 10);
		const base = talking ? 0.13 : near ? 0.22 : 0.4;
		const fadeIn = interpolate(f, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
		const fadeOut = interpolate(f, [durationInFrames - fps * 1.5, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		return base * fadeIn * fadeOut;
	};

	return (
		<AbsoluteFill style={{background: '#121412'}}>
			<Audio src={staticFile('music.mp3')} volume={music} />
			{scenes.map((s) => {
				const local = {...s, lines: s.lines.map((l) => ({...l, from: l.from - s.from}))};
				const Comp = s.name === 'end' ? null : SCENES[s.name];
				return (
					<Sequence key={s.name} from={s.from} durationInFrames={s.frames} name={s.name}>
						{Comp ? <Comp scene={local} /> : <End scene={local} credits={CREDITS[lang]} />}
					</Sequence>
				);
			})}
			{spoken.map((l) => (
				<Sequence key={l.id} from={l.from} durationInFrames={l.frames + 2} name={`${l.id} ${l.who}`}>
					<Audio src={staticFile(l.file)} volume={1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
