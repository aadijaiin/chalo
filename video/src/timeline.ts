// Lays the voice lines out in time, scene by scene. Everything else in the video is placed
// relative to these, so a different voiceover (English or Hinglish) re-times the whole video.

export type Word = {text: string; start: number; end: number};
export type Line = {id: string; who: string; file: string; duration: number; text: string; words: Word[]};
export type Placed = Line & {from: number; frames: number};
export type SceneName = 'hook' | 'reveal' | 'party' | 'map' | 'pings' | 'behind' | 'mom' | 'recap' | 'end';
export type Scene = {name: SceneName; from: number; frames: number; lines: Placed[]};

// lead: quiet before the scene's first line; gaps: between its lines; tail: after its last line.
const PLAN: {name: SceneName; ids: string[]; lead: number; gaps: number[]; tail: number}[] = [
	{name: 'hook', ids: ['L01', 'L02', 'L03'], lead: 1.1, gaps: [0.2, 0.55], tail: 0.35},
	{name: 'reveal', ids: ['L04'], lead: 1.0, gaps: [], tail: 0.6},
	{name: 'party', ids: ['L05', 'L06'], lead: 0.25, gaps: [0.2], tail: 0.45},
	{name: 'map', ids: ['L07', 'L08'], lead: 0.25, gaps: [0.35], tail: 0.55},
	{name: 'pings', ids: ['L09', 'L10', 'L11'], lead: 0.25, gaps: [0.15, 0.45], tail: 1.2},
	{name: 'behind', ids: ['L12', 'L13'], lead: 0.3, gaps: [0.3], tail: 0.45},
	{name: 'mom', ids: ['L14', 'L15'], lead: 0.45, gaps: [0.35], tail: 0.6},
	{name: 'recap', ids: ['L16', 'L17', 'L18'], lead: 0.25, gaps: [0.25, 0.15], tail: 0.45},
	{name: 'end', ids: ['L19', 'L20'], lead: 0.35, gaps: [0.6], tail: 2.2},
];

export function buildTimeline(lines: Line[], fps: number) {
	const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
	const f = (s: number) => Math.round(s * fps);
	const scenes: Scene[] = [];
	let t = 0;
	for (const s of PLAN) {
		const start = t;
		t += f(s.lead);
		const placed: Placed[] = [];
		s.ids.forEach((id, i) => {
			const line = byId[id];
			if (!line) return;
			if (i > 0) t += f(s.gaps[i - 1] ?? 0.3);
			placed.push({...line, from: t, frames: f(line.duration)});
			t += f(line.duration);
		});
		t += f(s.tail);
		scenes.push({name: s.name, from: start, frames: t - start, lines: placed});
	}
	return {scenes, total: t};
}
