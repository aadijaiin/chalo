# chalo — product video

A ~43 s product video made with [Remotion](https://www.remotion.dev) (videos as React code), in
16:9 (website, YouTube) and 9:16 (Reels, Shorts). The story: a group of friends on a road trip to
Lonavala, each with their own voice, from "where are you?!" to the trip recap.

```bash
npm install
npm run studio        # preview and scrub in the browser
npm run render        # out/chalo-16x9.mp4 and out/chalo-9x16.mp4
```

## How it's put together

| Piece | Where |
| --- | --- |
| The lines, who says them, both languages | `script.json` |
| English voices (ElevenLabs API, built-in voices) | `python3 scripts/tts.py` → `public/vo/en/` |
| Hinglish voices (Indian library voices, generated on the ElevenLabs website) | `voices-hindi.md` → `public/vo/hi/` |
| Level, trim and index a voiceover | `python3 scripts/prep.py en` (or `hi`) → `public/vo/manifest-<lang>.json` |
| Timing | `src/timeline.ts`: scenes are laid out from the real clip lengths, so a different voiceover re-times everything |
| Scenes | `src/scenes/` (opening, the app footage scenes, closing) |
| Real app footage | `public/footage/`, screen recordings from an Android phone running a demo party with fake accounts and fake GPS |
| Music | `public/music.mp3`, “Wallpaper” by Kevin MacLeod ([incompetech.com](https://incompetech.com)), CC BY 4.0, credited in the end card |

## Switching to the Hinglish voiceover

1. Follow `voices-hindi.md` and put the 23 files in `public/vo/hi/`.
2. `python3 scripts/prep.py hi`
3. In the studio, set the `lang` prop to `hi`, or render with
   `npx remotion render Landscape out/chalo-hi-16x9.mp4 --props='{"lang":"hi"}'`.

## Licences to keep in mind

- **ElevenLabs free plan:** as of writing, free-tier audio needs attribution and isn't licensed
  for commercial use. The end card credits ElevenLabs; for commercial use, generate the final
  voices on a paid plan.
- **Music:** CC BY 4.0, so keep the credit.
- **Remotion:** free for individuals and small teams; check its licence if chalo becomes a company.
