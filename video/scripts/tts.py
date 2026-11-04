"""Generates the English voiceover with ElevenLabs' built-in voices.

    python3 scripts/tts.py            # every line that doesn't exist yet
    python3 scripts/tts.py L09 L12    # redo just these lines (deletes and regenerates them)

Reads the key from ~/.elevenlabs_key (never printed). Writes public/vo/en/<id>.mp3 and
<id>.json (word timings for captions). Lines that already exist are skipped, so re-running never
spends credits twice. L19 ("Chalo!") is said by each of the four friends, to be mixed together.
"""
import base64
import json
import os
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'vo' / 'en'
API = 'https://api.elevenlabs.io'
MODEL = 'eleven_multilingual_v2'
# Livelier than the defaults: a bit less stable, some style, for acting rather than reading.
SETTINGS = {'stability': 0.38, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}
CREW = ['riya', 'kabir', 'zoya', 'aadi']

KEY = Path.home().joinpath('.elevenlabs_key').read_text().strip()
CTX = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header('xi-api-key', KEY)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=60) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{method} {path.split("?")[0]}: {e.code} {e.read().decode()[:300]}')


def voice_ids():
    voices = call('GET', '/v2/voices?page_size=100')['voices']
    return {v['name'].split(' - ')[0].strip(): v['voice_id'] for v in voices}


def speak(text, voice_id, out):
    d = call('POST', f'/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128',
             {'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS})
    out.with_suffix('.mp3').write_bytes(base64.b64decode(d['audio_base64']))
    out.with_suffix('.json').write_text(json.dumps(d.get('alignment') or {}))
    print(f'  {out.name}: {len(text)} chars')


def main():
    script = json.loads((ROOT / 'script.json').read_text())
    cast = script['voices']['en']
    ids = voice_ids()
    missing = [n for n in cast.values() if n not in ids]
    if missing:
        raise SystemExit(f'voices not found: {missing}')
    OUT.mkdir(parents=True, exist_ok=True)

    redo = set(sys.argv[1:])
    spent = 0
    for line in script['lines']:
        speakers = CREW if line['who'] == 'crew' else [line['who']]
        for who in speakers:
            name = line['id'] if len(speakers) == 1 else f"{line['id']}_{who}"
            target = OUT / name
            if line['id'] in redo:
                for ext in ('.mp3', '.json'):
                    target.with_suffix(ext).unlink(missing_ok=True)
            if target.with_suffix('.mp3').exists():
                continue
            speak(line['en'], ids[cast[who]], target)
            spent += len(line['en'])

    sub = call('GET', '/v1/user/subscription')
    print(f'done: ~{spent} chars this run, {sub["character_count"]}/{sub["character_limit"]} credits used')


if __name__ == '__main__':
    main()
