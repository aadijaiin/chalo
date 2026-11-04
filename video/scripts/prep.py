"""Prepares a voiceover version for the video.

    python3 scripts/prep.py en     # built-in ElevenLabs voices (from scripts/tts.py)
    python3 scripts/prep.py hi     # the Indian voices you downloaded (see voices-hindi.md)

For each line in script.json it levels the clip to -16 LUFS, trims silence at the edges (using
ElevenLabs' word timings when there are any, otherwise silence detection), mixes the four
"Chalo!" voices into one shout, and writes public/vo/manifest-<lang>.json with each clip's file,
duration and word timings. The video lays out its scenes from that manifest.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAD = 0.06  # keep a breath around each clip


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True)


def duration(path):
    return float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)).stdout)


def speech_bounds(mp3: Path):
    """Where the speech starts and ends: from word timings if we have them, else silence detection."""
    timings = mp3.with_suffix('.json')
    if timings.exists():
        a = json.loads(timings.read_text())
        chars, starts, ends = a.get('characters', []), a.get('character_start_times_seconds', []), a.get('character_end_times_seconds', [])
        spoken = [i for i, c in enumerate(chars) if re.match(r'\w', c)]
        if spoken:
            return max(0, starts[spoken[0]] - PAD), ends[spoken[-1]] + PAD, a
    # Downloads from the website have a faint tail, so measure against the clip's own peak.
    peak = float(re.search(r'max_volume: (-?[\d.]+)', run('ffmpeg', '-hide_banner', '-nostats', '-i', str(mp3), '-af', 'volumedetect', '-f', 'null', '-').stderr).group(1))
    out = run('ffmpeg', '-hide_banner', '-nostats', '-i', str(mp3), '-af', f'silencedetect=n={peak - 32:.1f}dB:d=0.1', '-f', 'null', '-').stderr
    total = duration(mp3)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    begin = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
    finish = starts[-1] if starts and (not ends or starts[-1] > ends[-1]) else total
    return max(0, begin - PAD), min(total, finish + PAD), None


def words(alignment, offset):
    """Word timings relative to the trimmed clip, for captions."""
    if not alignment:
        return []
    out, cur, t0 = [], '', None
    for c, s, e in zip(alignment['characters'], alignment['character_start_times_seconds'], alignment['character_end_times_seconds']):
        if c.isspace():
            if cur:
                out.append({'text': cur, 'start': round(t0 - offset, 3), 'end': round(last - offset, 3)})
            cur, t0 = '', None
            continue
        if t0 is None:
            t0 = s
        cur += c
        last = e
    if cur:
        out.append({'text': cur, 'start': round(t0 - offset, 3), 'end': round(last - offset, 3)})
    return out


def level(src: Path, dst: Path, start: float, end: float):
    run('ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(src), '-ss', f'{start:.3f}', '-to', f'{end:.3f}',
        # Level, then trim leftover room tone at both ends (keeping a short breath).
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,'
        'silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.05,'
        'areverse,silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.08,areverse',
        '-ar', '48000', '-ac', '1', str(dst))


def main(lang):
    script = json.loads((ROOT / 'script.json').read_text())
    src_dir = ROOT / 'public' / 'vo' / lang
    out_dir = src_dir / 'prepped'
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for line in script['lines']:
        lid = line['id']
        dst = out_dir / f'{lid}.wav'
        group = sorted(src_dir.glob(f'{lid}_*.mp3'))
        single = src_dir / f'{lid}.mp3'
        if single.exists():
            start, end, alignment = speech_bounds(single)
            level(single, dst, start, end)
            ws = words(alignment, start)
        elif group:
            # Several voices at once: level each, then mix with tiny offsets so it sounds like a crowd.
            parts = []
            for i, g in enumerate(group):
                s, e, _ = speech_bounds(g)
                p = out_dir / f'{g.stem}.wav'
                level(g, p, s, e)
                parts.append((p, i * 0.035))
            inputs, filters = [], []
            for i, (p, delay) in enumerate(parts):
                inputs += ['-i', str(p)]
                filters.append(f'[{i}]adelay={int(delay * 1000)}[d{i}]')
            mix = ''.join(f'[d{i}]' for i in range(len(parts)))
            run('ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', *inputs, '-filter_complex',
                ';'.join(filters) + f';{mix}amix=inputs={len(parts)}:normalize=0,loudnorm=I=-16:TP=-1.5', '-ar', '48000', str(dst))
            ws = []
        else:
            print(f'  missing {lid} (expected {single.name} or {lid}_<who>.mp3)')
            continue
        manifest.append({
            'id': lid,
            'who': line['who'],
            'file': f'vo/{lang}/prepped/{lid}.wav',
            'duration': round(duration(dst), 3),
            'text': line['en'] if lang == 'en' else line['caption_hi'],
            'words': ws,
        })
    (ROOT / 'public' / 'vo' / f'manifest-{lang}.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f'{lang}: {len(manifest)}/{len(script["lines"])} lines, {sum(m["duration"] for m in manifest):.1f}s of speech')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'en')
