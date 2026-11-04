import {useVideoConfig} from 'remotion';

/** One design, two shapes: phone on the right in 16:9, centred with captions below in 9:16. */
export function useLayout() {
	const {width, height} = useVideoConfig();
	const portrait = height > width;
	return {
		portrait,
		width,
		height,
		// Size of the phone frame.
		phoneH: portrait ? height * 0.6 : height * 0.82,
		// Where captions sit.
		caption: portrait
			? {left: 60, right: 60, bottom: 140, top: undefined as number | undefined, align: 'center' as const, size: 78}
			: {left: 120, right: width * 0.5, bottom: undefined as number | undefined, top: height * 0.36, align: 'left' as const, size: 70},
	};
}
