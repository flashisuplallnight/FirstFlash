# Kit contract (v2)

The film is HTML/CSS/WebGL rendered headlessly frame by frame (`E.seek(t)` must fully determine
every pixel). Read `docs/SHOTS.md` first; it defines the look.

## Files and ownership

| module | file | namespace | owns |
|---|---|---|---|
| core (done) | `src/kit/mac-core.js`, `src/tokens.css` | `E.Mac` | window chrome, icons, sidebar, toolbar, menu bar, dock, desktop, avatars |
| fx-type | `src/kit/fx-type.js` | `E.FX` | glyph-confetti words, voice cloud, outlined typing pill, orb→logo, logo lockup, stop-motion helpers, kinetic marquee text, film cursor |
| fx-surface | `src/kit/fx-surface.js` | `E.FX` | iridescent wash, thermal gradient map, sunset backdrop, motion-blur colour bars, stop-motion collage, pixel-tile glitch, node grid + bento tiles, dot matrix, B&W macro render |
| mac-web | `src/kit/mac-web.js` | `E.Mac` | Safari window, YouTube page (dark), lofi illustrations (procedural) |
| mac-comms | `src/kit/mac-comms.js` | `E.Mac` | Messages, Mail (inbox, message, compose/draft with rewritable body), Notes, Music now-playing + album art (procedural) |
| mac-plan | `src/kit/mac-plan.js` | `E.Mac` | Calendar week view, Maps (directions sidebar + topo map + route + 3D flyover), Reminders/Weather mini cards |
| mac-dev | `src/kit/mac-dev.js` | `E.Mac` | Terminal, code editor (VS Code-like, dark), Swaey Settings (Skills page), Swaey Activity window, Control Center, confirm card, floating island presets |

Each module also owns `src/lab/<module>.js` (a showcase) and may add assets under
`src/assets/<module>/`. **Do not edit any other file** (engine.js, components.js, kit.js,
mac-core.js, tokens.css, styles.css, manifest.js, boot.js, main.js, other modules). If a shared
file has a bug, work around it locally and report it.

Module CSS: inject once from your module, e.g.
`E.h("style", "", document.head, \`...css...\`)`, with class names prefixed by your module
(`yt-`, `cal-`, `fx-` …) so nothing collides.

## Rules

- **Deterministic.** No `Math.random`, `Date`, `performance.now`, `requestAnimationFrame`,
  `setTimeout`, CSS animations or transitions. Randomness: `E.rng(seed)` / `E.hash(n)`.
  Animated components expose `render(t, state)` / `set(...)` functions that set styles from inputs.
- **Builders** are `fn(parent, opts) → { el, …refs, render?() }`. Build DOM once; never rebuild
  per frame (update text only when it changes).
- **Sizes.** Stage is 1920×1080. macOS UI is built at real point sizes (13 px body text) and
  enlarged with CSS `zoom` (keeps text crisp). `E.Mac.window(parent, { x, y, w, h, zoom })` already
  keeps x/y in stage pixels. Remember that `zoom` also scales child px values.
- **Fidelity.** macOS Sonoma light appearance unless dark is asked for: SF-like Inter 13 px,
  hairline separators `rgba(0,0,0,.1)`, 10 px window radius, unified toolbars 52 px, sidebars
  `#e9e8ea`, accent `#007aff`, real app layouts. Use `E.Mac.icon(name, size)` (see `E.Mac.ICONS`)
  and the real app icons in `src/assets/icons/*.png` (calendar, chrome, claude, finder, mail, maps,
  messages, music, notes, photos, preview, reminders, safari, settings, shortcuts, slack, spotify,
  terminal, trash, trash-full, vscode, weather, xcode, heyswaey, folder, downloads, doc-pdf, doc-txt,
  doc-dmg, scripteditor). Wallpapers: `src/assets/wp/sonoma.jpg`, `src/assets/wp/imac-blue.jpg`.
- **Content** is about Swaey (see heyswaey.com copy in `docs/SHOTS.md`): Sarah Chen (manager), Jake
  Miller, Mom, Acme invoice (`invoice-acme-sept.pdf`), lofi girl, focus mode, dentist (Dr. Patel),
  PricingTests.swift, claude code.
- **Performance** (software rendering, ~250 ms/frame budget): avoid `backdrop-filter`,
  `mix-blend-mode` on large layers, CSS `filter: blur()` on large areas, huge box-shadow blurs,
  thousands of DOM nodes. WebGL via `E.C.Shader(parent, w, h, frag, { scale })` with scale ≤ 0.5
  for soft fields. Canvas 2D is fine; avoid `shadowBlur` in loops (pre-render sprites).

## Existing helpers you can use

- `E.h(tag, cls, parent, html)`, `E.css(el, styles)`, `E.tf(el, { x, y, z, s, sx, sy, rx, ry, rz, o, blur })`,
  `E.op(el, v)`, `E.k(t, t0, dur, ease)`, `E.kf(t, keys)`, `E.ease.*` (outExpo, inOutExpo, island,
  spring, out, snap, whip …), `E.spring(t)`, `E.rng(seed)`, `E.hash(n)`, `E.chars/E.words(el, text)`,
  `E.rect(el)`, `E.scene(name, start, end, build)` → `build(root, s)` returns `update(localT, t)`,
  `E.cue(t, type, { g, v })` (sound cue).
- `E.C.Face(parent, { size, stroke, ink })` + `.render({ mood, prev, since, blink, draw, t })`,
  `E.C.moodAt(track, t)`, `E.C.blinkAt(times, t)`, `E.C.Island(parent, { em, width })` +
  `.render({ w, h, open, content, actions })`, `.setText(text, p)`, `.setIcon(name)`,
  `.face`, `.wave.render(mode, t, { amp })`, `E.C.Wave`, `E.C.Cursor(parent, { size })` +
  `.render(x, y, t, clicks, opacity)`, `E.C.Shader`.
- `E.K.appMark(parent, size)` → `{ el, face }` (Swaey app icon with live face),
  `E.K.typeInto(el, text, n, caret)`, `E.K.typeCues(t0, text, cps, every, gain)`.

## Lab + checking your work

Create `src/lab/<module>.js` that sets `E.K.LAB_DURATION` and registers `E.scene(...)` slots
showing every component (e.g. one per second, with any animation playing inside the slot). Render
stills and **look at them**:

```sh
cd /home/user/FirstFlash/swaey-video
node render/frames.mjs out/lab-<module> --page "src/lab.html?mod=<module>" 0.5 1.5 2.5
```

Stills land in `out/lab-<module>/t_XXXX.XX.jpg` (1920×1080) — open them with the Read tool.
Reference frames: `/tmp/claude-0/-home-user-FirstFlash/bdfeba56-b3ac-5028-bee4-85013f57276f/scratchpad/ref/hi/f_NNNN.png`
(736×414, 10 fps, t = (N−1)/10) and 3×3 contact sheets `…/scratchpad/ref/z01.jpg … z16.jpg`.
Iterate until it would fool a Mac user / matches the reference's craft. Do not commit; the lead
integrates and commits.
