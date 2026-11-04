# Hinglish voiceover: generate it on the ElevenLabs website

Free ElevenLabs accounts can use the Indian library voices on the website, just not through the
API. This is everything you need to generate the Hinglish version yourself. It uses about
**391 credits** of your 10,000.

## 1. Settings (once)

1. Go to [elevenlabs.io/app](https://elevenlabs.io/app) → **Text to Speech**.
2. Model: **Eleven Multilingual v2** (it pronounces Hindi well from Devanagari text).
3. Voice settings: **Stability ~38%**, **Similarity ~80%**, **Style exaggeration ~35%**,
   **Speaker boost on**. Livelier than the defaults, so it sounds acted rather than read.

## 2. Add the voices

For each voice below: **Voice Library** → search the name → open it → **Add to my voices**.
Free accounts have a limited number of voice slots. If you hit the limit, do all of one voice's
lines, remove that voice from *My Voices*, then add the next.

## 3. Generate each line and save it with exactly this name

Paste the text **exactly** (the Devanagari is on purpose; it's what makes the Hindi sound
native), generate, listen, regenerate if a take sounds off, then **Download** and rename the file.

| Line | Character | Voice | Text | Save as |
| --- | --- | --- | --- | --- |
| L01 | Kabir | Sanchit K | `कहाँ हो?!` | `L01.mp3` |
| L02 | Zoya | Alisha | `भाई, location भेज!` | `L02.mp3` |
| L03 | Riya | Pooja | `हर trip पे... वही सवाल.` | `L03.mp3` |
| L04 | Narrator | Viraj | `चलो. पूरी crew, एक live map पे.` | `L04.mp3` |
| L05 | Riya | Pooja | `Party बनाओ, code भेजो...` | `L05.mp3` |
| L06 | Kabir | Sanchit K | `...सब अंदर!` | `L06.mp3` |
| L07 | Narrator | Viraj | `हर किसी का route. हर किसी का ETA.` | `L07.mp3` |
| L08 | Zoya | Alisha | `Phone lock हो, तब भी.` | `L08.mp3` |
| L09 | Kabir | Sanchit K | `Chai stop?` | `L09.mp3` |
| L10 | Riya | Pooja | `एक tap.` | `L10.mp3` |
| L11 | Narrator | Viraj | `Emergency? Hold करो, SOS.` | `L11.mp3` |
| L12 | Aadi | Ruhaan | `Zoya पीछे रह गई!` | `L12.mp3` |
| L13 | Zoya | Alisha | `...सबको पता चल जाता है.` | `L13.mp3` |
| L14 | Mom | Nishi | `और मैं? घर से देख रही हूँ.` | `L14.mp3` |
| L15 | Narrator | Viraj | `Lookout बनके, बिना अपनी location share किए.` | `L15.mp3` |
| L16 | Riya | Pooja | `Trip ख़त्म, sharing बंद.` | `L16.mp3` |
| L17 | Zoya | Alisha | `बस यादें...` | `L17.mp3` |
| L18 | Kabir | Sanchit K | `...और recap!` | `L18.mp3` |
| L19_riya | Riya | Pooja | `चलो!` | `L19_riya.mp3` |
| L19_kabir | Kabir | Sanchit K | `चलो!` | `L19_kabir.mp3` |
| L19_zoya | Zoya | Alisha | `चलो!` | `L19_zoya.mp3` |
| L19_aadi | Aadi | Ruhaan | `चलो!` | `L19_aadi.mp3` |
| L20 | Narrator | Viraj | `साथ चलो.` | `L20.mp3` |

Doing it voice by voice is quickest:

- **Sanchit K**: L01, L06, L09, L18, L19_kabir
- **Alisha**: L02, L08, L13, L17, L19_zoya
- **Pooja**: L03, L05, L10, L16, L19_riya
- **Viraj**: L04, L07, L11, L15, L20
- **Ruhaan**: L12, L19_aadi
- **Nishi**: L14

**Acting notes:** Kabir is hyped and a bit dramatic. Zoya is playful and slightly guilty in L13.
Riya is warm and in charge. Aadi sounds alarmed but friendly in L12. Mom is warm and a little
amused. The narrator is calm and premium. "चलो!" (L19) is a cheerful shout from each friend; I mix
the four together.

## 4. Put the files here

Save all 23 files into:

```
chalo/video/public/vo/hi/
```

Then tell me "Hindi voices are in". I'll level and trim them, swap them into the video, and render
the Hinglish cut next to the English one so you can compare.
