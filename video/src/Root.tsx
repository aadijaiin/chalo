import React from 'react';
import {Composition, staticFile, type CalculateMetadataFunction} from 'remotion';
import {buildTimeline, type Line} from './timeline';
import {ChaloVideo, type VideoProps} from './Video';

const FPS = 30;

// The video's length comes from the voiceover: load its manifest and lay the timeline out.
const fromManifest: CalculateMetadataFunction<VideoProps> = async ({props}) => {
	const res = await fetch(staticFile(`vo/manifest-${props.lang}.json`));
	const lines = (await res.json()) as Line[];
	return {props: {...props, lines}, durationInFrames: buildTimeline(lines, FPS).total};
};

const defaults: VideoProps = {lang: 'en', lines: []};

export const Root: React.FC = () => (
	<>
		<Composition id="Landscape" component={ChaloVideo} width={1920} height={1080} fps={FPS} durationInFrames={1} defaultProps={defaults} calculateMetadata={fromManifest} />
		<Composition id="Portrait" component={ChaloVideo} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={defaults} calculateMetadata={fromManifest} />
	</>
);
