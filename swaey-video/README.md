# heyswaey — motion film

A 46-second, 1080p60 SaaS motion-graphics film for [heyswaey.com](https://www.heyswaey.com),
built in code: every frame is HTML/CSS/WebGL, captured headlessly, with real
sub-frame motion blur and an original synthesised soundtrack that is cued to
the animation frame by frame.

**Output:** `export/heyswaey-film.mp4` (H.264 1080p60 + AAC 320k) · `export/poster.jpg` · `export/soundtrack.wav`

## Storyboard (128 BPM, 1 bar = 1.875 s)

| time | scene | what happens |
|---|---|---|
| 0:00 | hook | “you type at 40 wpm.” → slot-rolls to “you **talk** at **150** wpm.” with a voice-wave burst → “yet your mac still waits for a click.” (cursor clicks) → the notch swallows the frame |
| 0:03.75 | notch · **drop** | the island bursts out of the MacBook notch: “hey swaey” → “hi! i live in your notch.” |
| 0:05.6 | logo | the notch morphs into the app icon, face draws its ✓, **heyswaey** + tagline |
| 0:07.5 | demo | ⌥ ↑ → listening “hey swaey, play some lofi” → thinking → “on it.” → now-playing card |
| 0:10.3 | says | 3D wall of real commands · “say it.” / “swaey does it.” |
| 0:13.1 | voice typing | hold fn, messy speech → “ums” and “no wait” struck out → polished text sends in Messages |
| 0:15.9 | memory | “remember i use gmail” flies into the Brain list |
| 0:17.8 | asks first | “empty the trash?” → cursor clicks Go ahead → trash empties, activity log updates |
| 0:19.7 | instant | “dark mode on” → the **whole film flips to dark mode** (38 ms · offline) |
| 0:21.6 | skills & routines | trigger → skill → actions flow with live connectors and checks, routine cards |
| 0:25.3 | toolbox | 19 app icons orbit Swaey, beams + commands fire to Mail, Spotify, Calendar, Finder |
| 0:28.1 | coding agents | big type “ask claude code to fix the failing test” collapses into a live terminal |
| 0:30.9 | privacy | voice particles bounce inside the Mac but never leave · on-device list · “audio recordings · 0 sent” |
| 0:34.7 | montage · **drop 2** | one beat per feature: play it. type it. remember it. ask first. instantly. automate it. any app. ship it. private. |
| 0:37.5 | say hey. | the site’s pixel Creation-of-Adam hands touch the HEYSWAEY.APP window |
| 0:41.3 | end card | icon, wordmark, tagline, cursor clicks **download for mac**, heyswaey.com, “free to start” |

All copy, colours (`#0f7fff` electric, `#221898` indigo, `#9ec5ff` sky, paper `#f5f5f5`), the face
mascot geometry, the island, the waveform and the spring curves are taken from heyswaey.com itself.

## Preview in a browser

```sh
npm install
node render/serve.mjs          # → http://localhost:8080/src/index.html
```

Space = play/pause, the slider scrubs. If `out/soundtrack.wav` exists it plays along.

## Render

```sh
node render/render.mjs --draft                     # 30 fps, no blur (~8 min on 4 cores)
node render/render.mjs                             # 60 fps, 3 sub-frames of motion blur (~45 min)
node render/render.mjs --from 10 --to 14 --out out/clip.mp4   # a slice
node render/frames.mjs out/stills 4.4 22.9 39.8    # stills at given seconds
```

Needs Node 18+, Playwright’s Chromium, Python 3 with numpy + scipy, and ffmpeg.

## Editing

- **Timing:** `src/kit.js` → `K.T` (scene windows in bars). Each scene animates in its own local time.
- **Copy & layout:** `src/scenes/a-open.js` (hook, notch, logo, demo, says), `b-features.js`
  (typing, memory, asks, instant), `c-power.js` (skills, apps, code, privacy), `d-close.js`
  (montage, hands, end card).
- **Sound:** scenes register cues with `E.cue(time, type)`. `render/audio.py` turns those into
  sound effects and writes the music (sections, chords and drums are in `build()`).
- Every frame is a pure function of time (`E.seek(t)`), so you can change anything and re-render any slice.

## Credits

Music and sound design are synthesised from scratch in `render/audio.py`, with no samples or licensed tracks.
App icons, the hand artwork and brand assets come from heyswaey.com. Third-party app icons belong to their owners.
