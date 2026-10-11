/* fx-type — the reference film's typographic language, rebuilt for Swaey.
   glyph-confetti captions, the floating voice cloud, outlined typing pills + face badge,
   the orb → app icon → wordmark logo build, kinetic marquee headlines, the dark-screen
   type line, a macOS film cursor and stop-motion helpers.

   Every builder returns { el, …refs, render() }. `el` is a zero-size anchor placed at the
   component's centre (or its stated origin) in parent px, so shots can move/scale it with
   E.tf(el, …) without fighting the component's own internal transforms.
   All motion is a pure function of the inputs (no clocks, no Math.random). */
(function () {
  const E = window.E;
  const FX = (E.FX = E.FX || {});

  /* ---------- palette ---------- */
  const COL = (FX.COL = {
    cream: "#ede8e3", night: "#1d1d1d", ink: "#111111", glyph: "#333333",
    electric: "#0f7fff", lavender: "#a98bff", coral: "#ff7a45", sky: "#7fc4ff", grey: "#c9c4bf",
    green: "#8aaf3b", peach: "#f4a27a", pink: "#ec9fd5", navy: "#10297a",
  });
  FX.TINTS = [COL.electric, COL.lavender, COL.coral, COL.sky, COL.grey];

  /* Inter / Inter Display vertical metrics (hhea .96875 / .2412): with line-height:1 the
     baseline sits .8638em below the top of the line box. */
  const BL = 0.8638, XH = 0.546, CAP = 0.727;
  FX.METRICS = { baseline: BL, xHeight: XH, capHeight: CAP };

  /* ---------- css ---------- */
  E.h("style", "", document.head, `
.fx-anchor{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}
.fx-abs{position:absolute;left:0;top:0}
.fx-t{font-family:"Inter",system-ui,sans-serif;font-feature-settings:normal;-webkit-font-smoothing:antialiased;white-space:pre}
.fx-gs-cap{position:absolute;left:0;top:0;font-weight:400;line-height:1;letter-spacing:-0.01em;color:#111}
.fx-gs-cap .fx-acc{color:#0f7fff}
.fx-gs-g{position:absolute;left:0;top:0;font-weight:400;line-height:1;color:#333;transform-origin:50% 60%}
.fx-vc-f{position:absolute;left:0;top:0;font:400 20px/1 "Geist Mono","Inter",ui-monospace,monospace;letter-spacing:0;color:#3a3734;white-space:pre;display:flex;align-items:center;-webkit-font-smoothing:antialiased;font-feature-settings:normal}
.fx-vc-dot{display:inline-block;width:.66em;height:.66em;border-radius:50%;flex:none}
.fx-vc-dot.o{box-shadow:inset 0 0 0 .07em currentColor;width:.6em;height:.6em}
.fx-vc-dot.l{margin-right:.32em}.fx-vc-dot.r{margin-left:.3em}
.fx-pill{position:absolute;left:0;top:0;display:flex;align-items:center;border-style:solid;border-radius:999px;font-weight:400;letter-spacing:-0.01em;line-height:1.5;padding:0 .6em;white-space:pre}
.fx-caret{display:inline-block;flex:none;border-radius:.02em}
.fx-badge{position:absolute;left:0;top:0;border-radius:50%;border-style:solid;display:grid;place-items:center}
.fx-badge .face svg{overflow:visible}
.fx-orb{position:absolute;left:0;top:0;border-radius:50%}
.fx-blob{position:absolute;left:0;top:0;border-radius:50%}
.fx-wm{position:absolute;left:0;top:0;font-weight:600;letter-spacing:-0.05em;line-height:1;color:#111;white-space:pre}
.fx-wm-clip{position:absolute;left:0;top:0;overflow:hidden}
.fx-mq{position:absolute;left:0;top:0;font-family:"Inter Display","Inter",sans-serif;font-weight:600;line-height:1;letter-spacing:-0.055em;white-space:pre;font-feature-settings:normal;-webkit-font-smoothing:antialiased}
.fx-mq svg{display:inline-block;overflow:visible}
.fx-tl{position:absolute;left:0;top:0;display:flex;align-items:baseline;font-weight:400;line-height:1;letter-spacing:-0.025em;color:#f4f4f4;white-space:pre}
.fx-tl-w{display:inline-block;background-repeat:no-repeat;background-size:0 100%}
.fx-cur{position:absolute;left:0;top:0;transform-origin:0 0}
.fx-cur svg{display:block;overflow:visible;filter:drop-shadow(0 1px 1.2px rgba(0,0,0,.35))}
`);

  /* fonts: Geist Mono is a web font — make sure it is decoded before the first seek */
  (E.ready = E.ready || []).push(() =>
    Promise.all(["400 20px \"Geist Mono\"", "500 20px \"Geist Mono\"", "400 52px Inter", "600 96px Inter", "600 200px \"Inter Display\""].map((f) => document.fonts.load(f))).catch(() => {})
  );

  /* ================= helpers ================= */
  /* integer hash → [0,1): FX.rand(seed, i, j, k) */
  const ih = (a, b = 0, c = 0, d = 0) => {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x165667b1, 0x85ebca6b) ^ Math.imul((c | 0) + 0x61c88647, 0xc2b2ae35) ^ Math.imul((d | 0) + 0x7f4a7c15, 0x27d4eb2f);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
  FX.rand = ih;

  /* stop-motion: hold time on a grid of `fps` layouts per second (12 ≈ every 5th frame at 60) */
  FX.hold = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;
  FX.step = (t, fps = 12) => Math.floor(t * fps + 1e-6);
  /* per-item stop-motion offset: [dx, dy] that re-rolls every `every` steps */
  FX.jitter = (seed, i, t, { fps = 12, every = 2, amp = 2 } = {}) => {
    const L = Math.floor(FX.step(t, fps) / every);
    return [(ih(seed, i, L, 1) - 0.5) * 2 * amp, (ih(seed, i, L, 2) - 0.5) * 2 * amp];
  };

  /* colours */
  const rgbOf = (h) => {
    if (Array.isArray(h)) return h;
    if (h.startsWith("rgb")) return h.match(/[\d.]+/g).slice(0, 3).map(Number);
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  FX.rgb = rgbOf;
  FX.mix = (a, b, p, alpha = 1) => {
    const A = rgbOf(a), B = rgbOf(b), q = E.clamp(p);
    const c = A.map((v, i) => Math.round(v + (B[i] - v) * q));
    return alpha >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${E.clamp(alpha).toFixed(3)})`;
  };
  FX.rgba = (c, a) => { const v = rgbOf(c); return `rgba(${v[0]},${v[1]},${v[2]},${E.clamp(a).toFixed(3)})`; };

  /* text width with canvas (Inter / Inter Display are system fonts → always measurable) */
  const mctx = document.createElement("canvas").getContext("2d");
  const wcache = new Map();
  FX.textWidth = (text, { size = 52, weight = 400, family = "Inter", ls = 0 } = {}) => {
    const key = weight + "|" + size + "|" + family + "|" + ls + "|" + text;
    let w = wcache.get(key);
    if (w != null) return w;
    mctx.font = `${weight} ${size}px "${family}"`;
    if ("letterSpacing" in mctx) mctx.letterSpacing = (ls * size).toFixed(2) + "px";
    w = mctx.measureText(text).width;
    if (!("letterSpacing" in mctx)) w += ls * size * [...text].length;
    wcache.set(key, w);
    return w;
  };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* write a property only when it changes (keeps per-frame DOM writes tiny) */
  const set = (el, k, v) => { if (el["_" + k] !== v) { el["_" + k] = v; el.style[k] = v; } };
  const setText = (el, v) => { if (el._txt !== v) { el._txt = v; el.textContent = v; } };
  const show = (el, on) => set(el, "visibility", on ? "" : "hidden");
  const anchor = (parent, x = 0, y = 0, cls = "") => {
    const el = E.h("div", "fx-anchor " + cls, parent);
    E.css(el, { left: x + "px", top: y + "px" });
    return el;
  };

  /* quick macOS-style press curve: 0 → 1 → 0 around each click time */
  FX.pressAt = (t, clicks = []) => {
    let p = 0;
    for (const c of clicks) {
      const u = t - c;
      if (u > -0.06 && u <= 0) p = Math.max(p, 1 + u / 0.06);
      else if (u > 0 && u < 0.05) p = Math.max(p, 1);
      else if (u >= 0.05 && u < 0.14) p = Math.max(p, 1 - (u - 0.05) / 0.09);
    }
    return E.ease.outQuad(E.clamp(p));
  };

  /* ================= 1. glyph confetti captions ================= */
  const GLYPHS = [["/", 62], ["<", 8], [">", 8], ["*", 4], ["✓", 3], ["//", 2], ["^", 2], ["~", 1.5], ["⌥", 1], ["|", 1], ["“", 1.5], ["”", 1.5]];
  /* visual centre of each glyph above its baseline (em, Inter 400) */
  const GC = { "/": 0.34, "//": 0.34, "<": 0.335, ">": 0.335, "*": 0.5, "^": 0.56, "✓": 0.35, "“": 0.6, "”": 0.6, "⌥": 0.36, "~": 0.32, "|": 0.33, "\\": 0.34 };
  FX.GLYPHS = GLYPHS.map((g) => g[0]);
  const pickW = (u, list) => {
    let tot = 0; for (const g of list) tot += g[1];
    let a = u * tot;
    for (const g of list) { a -= g[1]; if (a < 0) return g[0]; }
    return list[0][0];
  };

  /* glyphSequence(parent, { x=960, y=540, size=52, seq, seed=1, fps=12, glyphScale=1.12, frameGap=2.5,
                             tint=.2, gaps=.12, spread=1, pop=true, minDist=1.5, rows=true, rowHeight=1.85, life=3, glyphSet })
     Each confetti slot holds its glyph for 1..life stop-motion steps (fps), then re-rolls glyph / colour / spot.
     seq: [{ t, text, frame: null|'/'|'//'|'/ /'|'< >', glyphs: n, accent: 'word'|null,
             tint?, spread?, frameTint?: true|[cL,cR], frameGap? }]
     x,y = centre of the caption's x-height in parent px.
     render(lt, { o=1, count=1, spread=1 }) — lt in seconds on the seq's clock. */
  FX.glyphSequence = (parent, o = {}) => {
    const size = o.size ?? 52, seed = o.seed ?? 1, fps = o.fps ?? 12;
    const gs = size * (o.glyphScale ?? 1.12);
    const glyphSet = o.glyphSet ? o.glyphSet.map((g) => (Array.isArray(g) ? g : [g, 1])) : GLYPHS;
    const seq = (o.seq || []).slice().sort((a, b) => a.t - b.t);
    const maxG = Math.max(0, ...seq.map((s) => s.glyphs || 0));
    const el = anchor(parent, o.x ?? E.W / 2, o.y ?? E.H / 2, "fx-gs");
    const cap = E.h("div", "fx-t fx-gs-cap", el);
    cap.style.fontSize = size + "px";
    cap.style.transform = `translate(-50%,${(-(BL - XH / 2) * size).toFixed(2)}px)`;
    const mk = () => { const s = E.h("span", "fx-t fx-gs-g", el); s.style.fontSize = gs + "px"; s.style.visibility = "hidden"; return s; };
    const fL = mk(), fR = mk();
    const slots = Array.from({ length: maxG }, mk);
    const put = (s, ch, color, x, y, sc = 1, op = 1) => {
      setText(s, ch);
      set(s, "letterSpacing", ch === "//" ? "0.08em" : "");
      set(s, "color", color);
      const gy = y - (BL - (GC[ch] ?? 0.34)) * gs;
      const sk = ch === "/" || ch === "//" ? " skewX(-5deg)" : "";
      set(s, "transform", `translate(${x.toFixed(1)}px,${gy.toFixed(1)}px) translate(-50%,0)` + sk + (sc !== 1 ? ` scale(${sc.toFixed(3)})` : ""));
      set(s, "opacity", op >= 1 ? "" : op.toFixed(3));
      show(s, true);
    };
    const hideAll = () => { show(fL, false); show(fR, false); slots.forEach((s) => show(s, false)); show(cap, false); };
    const api = { el, cap, glyphs: slots, frames: [fL, fR], box: { x: 0, y: 0, w: 0, h: 0 }, index: -1 };

    api.render = (lt, st = {}) => {
      const O = st.o ?? 1;
      set(el, "opacity", O >= 1 ? "" : E.clamp(O).toFixed(3));
      let si = -1;
      for (let i = 0; i < seq.length; i++) if (lt >= seq[i].t - 1e-6) si = i;
      api.index = si;
      if (si < 0 || O <= 0.001) { hideAll(); return api; }
      const S = seq[si];
      const text = S.text || "";
      /* caption (hard cut on change, like the reference) */
      const key = text + "|" + (S.accent || "");
      if (cap._key !== key) {
        cap._key = key;
        if (S.accent && text.includes(S.accent)) {
          const i = text.indexOf(S.accent);
          cap.innerHTML = esc(text.slice(0, i)) + `<span class="fx-acc">${esc(S.accent)}</span>` + esc(text.slice(i + S.accent.length));
        } else cap.textContent = text;
      }
      show(cap, !!text);
      const hw = text ? FX.textWidth(text, { size, ls: -0.01 }) / 2 : 0;
      api.box = { x: -hw, y: -0.62 * size, w: hw * 2, h: 1.1 * size };
      const k = FX.step(lt, fps);
      const obst = [];
      /* symmetric frame glyphs */
      const fr = S.frame || null;
      if (fr) {
        const L = fr === "< >" ? "<" : fr === "//" ? "//" : "/";
        const R = fr === "< >" ? ">" : L;
        let tl = COL.glyph, tr = COL.glyph;
        if (Array.isArray(S.frameTint)) [tl, tr] = S.frameTint;
        else if (S.frameTint) { tl = FX.TINTS[Math.floor(ih(seed, si, 91) * 3)]; tr = FX.TINTS[(Math.floor(ih(seed, si, 91) * 3) + 1 + Math.floor(ih(seed, si, 92) * 2)) % 3]; }
        if (!text && (fr === "/" || fr === "//")) {
          put(fL, fr, tl, 0, 0); show(fR, false); obst.push({ x: 0, y: 0 });
        } else {
          const gap = text ? (S.frameGap ?? o.frameGap ?? 2.5) * size : 0.6 * size;
          put(fL, L, tl, -(hw + gap), 0); put(fR, R, tr, hw + gap, 0);
          obst.push({ x: -(hw + gap), y: 0 }, { x: hw + gap, y: 0 });
        }
      } else { show(fL, false); show(fR, false); }
      /* confetti: each slot lives 2–5 stop-motion steps, then re-rolls glyph / colour / spot */
      const n = Math.min(maxG, Math.round((S.glyphs || 0) * (st.count ?? 1)));
      const sp = (S.spread ?? 1) * (o.spread ?? 1) * (st.spread ?? 1);
      const rt = Math.sqrt(n);
      const Rx = hw + size * (1.7 + 1.2 * rt) * sp, Ry = size * (1.3 + 1.3 * rt) * sp;
      const exW = hw + size * 2.0, exH = size * 0.9 + gs * 0.35;
      const minD = gs * (o.minDist ?? 1.5);
      const tintP = S.tint ?? o.tint ?? 0.2;
      const rowH = o.rows === false ? 0 : size * (o.rowHeight ?? 1.85);
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (i >= n) { show(s, false); continue; }
        const P = 1 + Math.floor(ih(seed, i, 1) * (o.life ?? 3));
        const ph = Math.floor(ih(seed, i, 2) * P);
        const L = Math.floor((k + ph) / P) * 7 + si * 1013, age = (k + ph) % P;
        if (ih(seed, i, L, 3) < (o.gaps ?? 0.12)) { show(s, false); continue; }
        const ch = pickW(ih(seed, i, L, 4), glyphSet);
        const col = ih(seed, i, L, 5) < tintP ? FX.TINTS[Math.floor(ih(seed, i, L, 6) * FX.TINTS.length)] : COL.glyph;
        let pos = null;
        for (let a = 0; a < 16 && !pos; a++) {
          const ang = ih(seed, i, L, 10 + a * 2) * Math.PI * 2;
          const rad = Math.sqrt(0.1 + 0.9 * ih(seed, i, L, 11 + a * 2));
          const px = Math.round(Math.cos(ang) * Rx * rad);
          let py = Math.sin(ang) * Ry * rad;
          /* loose rows on the caption's line rhythm (the reference's glyphs sit in ragged rows) */
          if (rowH) py = (Math.round(py / rowH) + (ih(seed, i, L, 40 + a) - 0.5) * 0.28) * rowH;
          py = Math.round(py);
          if (Math.abs(px) < exW && Math.abs(py) < exH) continue;
          let ok = true;
          for (const q of obst) if ((q.x - px) ** 2 + (q.y - py) ** 2 < minD * minD) { ok = false; break; }
          if (ok) pos = { x: px, y: py };
        }
        if (!pos) { show(s, false); continue; }
        obst.push(pos);
        put(s, ch, col, pos.x, pos.y, age === 0 && o.pop !== false ? 1.14 : 1);
      }
      return api;
    };
    return api;
  };

  /* ================= 2. voice cloud ================= */
  FX.VOICE = [
    "play some lofi", "email sarah", "remind me at 7", "dark mode on", "volume 30", "focus mode", "“hey swaey”", "⌥↑",
    "whisper.local", "0 sent", "find the acme invoice", "call mom", "next song", "reply to jake", "open slack",
    "what’s on today?", "swaey.listen()", "on-device", "brief claude code", "good night", "leave at 8:40",
    "invoice-acme-sept.pdf", "skip this one", "louder", "ship it", "mute", "start the server", "lofi.play();",
    "⌥ space", "vol = 30", "7:00 pm", "{ focus }", "→ mail", "sarah@acme.co", "say(“on it”)", "150 wpm", "< 300 ms", "dnd = on",
  ];
  FX.VOICE_FILL = ["-", ":", ">", "<", "=", "/", "-", ">", ":", "<"];

  /* voiceCloud(parent, { seed=7, area:{x,y,w,h}, count=26, size=20, weight(400 <26px, else 500), exclude:{x,y,w,h}|null,
                          phrases=FX.VOICE, fill=FX.VOICE_FILL, fillers=.32, cut=.14, fps=12, jitter=1.2, color, tint=.16 })
     render(lt, { p=1, out=0, o=1 }) — p 0..1 staggered pop-in + typing, out 0..1 staggered pop-out.
     Mono size: SHOTS.md says 18–20 px (dense, like ref f_0460); the airy f_0020 cloud measures ≈30 px. */
  FX.voiceCloud = (parent, o = {}) => {
    const seed = o.seed ?? 7, size = o.size ?? 20, count = o.count ?? 26, fps = o.fps ?? 12;
    const area = o.area || { x: 0, y: 0, w: E.W, h: E.H };
    const phrases = o.phrases || FX.VOICE, fill = o.fill || FX.VOICE_FILL;
    const ink = o.color || "#3a3734";
    const weight = o.weight ?? (size >= 26 ? 500 : 400);
    const el = anchor(parent, 0, 0, "fx-vc");
    const rnd = E.rng(seed * 7919 + 13);
    const order = phrases.map((p) => [rnd(), p]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
    const ex = o.exclude ? { x: o.exclude.x - size * 0.6, y: o.exclude.y - size * 0.5, w: o.exclude.w + size * 1.2, h: o.exclude.h + size * 1.0 } : null;
    const boxes = [], frags = [];
    const tintCols = [COL.coral, COL.lavender, COL.electric, COL.peach, COL.pink];
    const cw = 0.6 * size;
    const nPhr = Math.round(count * (1 - (o.fillers ?? 0.32)));
    const fits = (x, y, w, padX, padY) => {
      if (x < area.x || y < area.y || x + w > area.x + area.w || y + size > area.y + area.h) return null;
      const b = { x: x - padX, y: y - padY, w: w + padX * 2, h: size + padY * 2 };
      const hit = (q) => !(b.x + b.w <= q.x || q.x + q.w <= b.x || b.y + b.h <= q.y || q.y + q.h <= b.y);
      if (ex && hit({ x: ex.x + padX, y: ex.y + padY, w: ex.w - 2 * padX, h: ex.h - 2 * padY })) return null;
      if (boxes.some(hit)) return null;
      return b;
    };
    const add = (text, filler, x, y, w, dot, b) => {
      boxes.push(b);
      const tinted = !filler && rnd() < (o.tint ?? 0.16);
      const f = {
        text, filler, dot, x, y, w,
        color: tinted ? tintCols[Math.floor(rnd() * tintCols.length)] : ink,
        alpha: tinted ? 0.72 + rnd() * 0.2 : 1,
        start: rnd() * 0.72, dur: 0.1 + rnd() * 0.16, end: rnd() * 0.85,
        /* a few never finish typing (the reference's cut-off 'userRespon', 'req.qu') */
        cut: !filler && rnd() < (o.cut ?? 0.14) ? 0.5 + rnd() * 0.35 : 1,
        dotCols: [0, 1].map(() => { const r = rnd(); return r < 0.46 ? ["#2b2826", 0] : r < 0.68 ? ["#3a3734", 1] : r < 0.84 ? [COL.pink, 0] : r < 0.93 ? [COL.coral, 0] : [COL.electric, 0]; }),
      };
      const n = E.h("div", "fx-vc-f", el);
      E.css(n, { fontSize: size + "px", fontWeight: weight, visibility: "hidden" });
      const mkDot = (side, k) => {
        const d = E.h("span", "fx-vc-dot " + side + (f.dotCols[k][1] ? " o" : ""), null);
        if (f.dotCols[k][1]) d.style.color = f.dotCols[k][0]; else d.style.background = f.dotCols[k][0];
        return d;
      };
      if (dot === "solo") { n.appendChild((f.dl = mkDot("", 0))); f.t = E.h("span", "", n); f.text = ""; }
      else {
        if (dot && dot.includes("l")) n.appendChild((f.dl = mkDot("l", 0)));
        f.t = E.h("span", "", n);
        if (dot && dot.includes("r")) n.appendChild((f.dr = mkDot("r", 1)));
      }
      f.n = n;
      frags.push(f);
      return f;
    };
    /* pass 1: phrases (sometimes with a code-like continuation line below) */
    let pi = 0;
    for (let tries = 0; frags.length < nPhr && tries < nPhr * 120; tries++) {
      const text = order[pi % order.length];
      const dr = rnd();
      const dot = dr < 0.22 ? "l" : dr < 0.32 ? "r" : dr < 0.37 ? "lr" : null;
      const w = [...text].length * cw + (dot ? dot.length * 0.88 * size : 0);
      const x = Math.round(area.x + rnd() * Math.max(1, area.w - w));
      const y = Math.round(area.y + rnd() * Math.max(1, area.h - size));
      const b = fits(x, y, w, size * 1.1, size * 0.75);
      if (!b) continue;
      add(text, false, x, y, w, dot, b);
      pi++;
      if (frags.length < nPhr && rnd() < 0.3) {
        const t2 = order[pi % order.length];
        const w2 = [...t2].length * cw;
        const x2 = Math.round(x + (rnd() < 0.5 ? 2 : 4) * cw), y2 = Math.round(y + size * 1.55);
        const b2 = fits(x2, y2, w2, size * 0.3, size * 0.2);
        if (b2) { add(t2, false, x2, y2, w2, null, b2); pi++; }
      }
    }
    /* pass 2: stray punctuation + lone dots in the gaps */
    for (let tries = 0; frags.length < count && tries < count * 120; tries++) {
      const solo = rnd() < 0.28;
      const text = solo ? "" : fill[Math.floor(rnd() * fill.length)];
      const w = solo ? 0.56 * size : cw;
      const x = Math.round(area.x + rnd() * (area.w - w)), y = Math.round(area.y + rnd() * (area.h - size));
      const b = fits(x, y, w, size * 1.6, size * 1.0);
      if (!b) continue;
      add(text, true, x, y, w, solo ? "solo" : null, b);
    }
    const api = { el, frags };
    api.render = (lt, st = {}) => {
      const p = st.p ?? 1, out = st.out ?? 0, O = st.o ?? 1;
      set(el, "opacity", O >= 1 ? "" : E.clamp(O).toFixed(3));
      const k = FX.step(lt, fps);
      const amp = o.jitter ?? 1.2;
      frags.forEach((f, i) => {
        const a = (p - f.start) / f.dur;
        const gone = out > 0 && out >= f.end * 0.9 + 0.05;
        const P = 2 + (i % 3);
        const L = Math.floor((k + i) / P);
        const blink = a > 1.2 && ih(seed, i, L, 9) < 0.03;
        if (a <= 0 || gone || blink || O <= 0.001) { show(f.n, false); return; }
        const ch = [...f.text];
        setText(f.t, ch.slice(0, Math.min(ch.length, Math.ceil(E.clamp(a) * f.cut * ch.length))).join(""));
        /* newborn fragments flash in as a pale tint, then settle (ref f_0019 → f_0020) */
        const typing = a < 1 && !f.filler;
        const col = typing ? FX.rgba(f.color === ink ? (i % 2 ? COL.lavender : COL.pink) : f.color, 0.5) : FX.rgba(f.color, f.alpha);
        set(f.n, "color", col);
        const jx = (ih(seed, i, L, 1) - 0.5) * 2 * amp, jy = (ih(seed, i, L, 2) - 0.5) * 2 * amp;
        set(f.n, "transform", `translate(${(f.x + jx).toFixed(1)}px,${(f.y + jy).toFixed(1)}px)`);
        show(f.n, true);
      });
      return api;
    };
    return api;
  };

  /* ================= 3. outlined typing pill + face badge ================= */
  /* pill(parent, { x=0, y=0, size=50, stroke=2.5, align:'center'|'left'|'right', ink='#111', tint=electric, jitter=0, seed })
     render({ text, n=all, outline=1, fill=0, caret=false|0..1, tint=0, o=1, t, jitter }) — the pill hugs the typed text.
     x,y = the pill's centre (align center) / left-middle (left) / right-middle (right).
     jitter (px) + t (s) adds the reference's stop-motion wobble.
     tint 0..1 colours text + outline with the tint colour (the reference's freshly-typed orange pill).
     measure(text) → { w, h } final size (for snapping layouts). */
  FX.pill = (parent, o = {}) => {
    const size = o.size ?? 50, stroke = o.stroke ?? 2.5, ink = o.ink ?? COL.ink, tintC = o.tint ?? COL.electric;
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-pillw");
    const box = E.h("div", "fx-t fx-pill", el);
    E.css(box, { fontSize: size + "px", borderWidth: stroke + "px" });
    const ax = o.align === "left" ? "0" : o.align === "right" ? "-100%" : "-50%";
    box.style.transform = `translate(${ax},-50%)`;
    const txt = E.h("span", "", box);
    const caret = E.h("span", "fx-caret", box);
    E.css(caret, { width: "0.06em", height: "1.02em", marginLeft: "0.05em", marginRight: "-0.06em", background: "currentColor" });
    const api = { el, box, text: txt, caretEl: caret };
    api.measure = (text) => ({ w: FX.textWidth(text, { size, ls: -0.01 }) + 1.2 * size + 2 * stroke, h: 1.5 * size + 2 * stroke });
    api.height = 1.5 * size + 2 * stroke;
    api.render = (st = {}) => {
      const text = st.text ?? o.text ?? "";
      const chars = [...text];
      const n = Math.max(0, Math.min(chars.length, Math.floor(st.n ?? chars.length)));
      setText(txt, chars.slice(0, n).join(""));
      const fillA = E.clamp(st.fill ?? 0), out = E.clamp(st.outline ?? 1), tn = E.clamp(st.tint ?? 0);
      const line = FX.mix(ink, tintC, tn);
      set(box, "color", FX.mix(line, "#ffffff", fillA));
      set(box, "borderColor", FX.rgba(rgbOf(line), Math.max(out, fillA)));
      set(box, "background", fillA > 0.001 ? FX.rgba(ink, fillA) : "transparent");
      const c = st.caret === true ? 1 : +(st.caret || 0);
      set(caret, "opacity", c.toFixed(3));
      set(caret, "display", c > 0.001 ? "" : "none");
      set(el, "opacity", st.o == null || st.o >= 1 ? "" : E.clamp(st.o).toFixed(3));
      /* stop-motion wobble like the reference pill (a px or two, re-rolled at 10 fps) */
      const jit = st.jitter ?? o.jitter ?? 0;
      const [jx, jy] = jit && st.t != null ? FX.jitter(o.seed ?? 3, 0, st.t, { fps: 10, every: 1, amp: jit }) : [0, 0];
      set(box, "transform", `translate(${ax},-50%)` + (jx || jy ? ` translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px)` : ""));
      return api;
    };
    api.render({ text: o.text || "" });
    return api;
  };

  /* chars covering the first k words of text (for word-by-word typing like the reference pills) */
  FX.wordsN = (text, k) => {
    const w = text.split(" ");
    const kk = Math.max(0, Math.min(w.length, Math.floor(k)));
    return kk <= 0 ? 0 : [...w.slice(0, kk).join(" ")].length;
  };

  /* faceBadge(parent, size=80, { x, y, stroke=2.5 }) — circle badge with Swaey's face (the reference's link icon).
     render({ fill 0..1, mood, prev, since, draw, blink, t }) — 0: lavender outline + lavender face, 1: black disc + white face. */
  FX.faceBadge = (parent, size = 80, o = {}) => {
    const stroke = o.stroke ?? 2.5;
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-badgew");
    const b = E.h("div", "fx-badge", el);
    E.css(b, { width: size + "px", height: size + "px", borderWidth: stroke + "px", transform: "translate(-50%,-50%)" });
    const face = new E.C.Face(b, { size: Math.round(size * 0.6), ink: true, stroke: 8.5 });
    face.el.style.marginTop = (size * 0.02).toFixed(1) + "px";
    const api = { el, disc: b, face };
    api.render = (st = {}) => {
      const f = E.clamp(st.fill ?? 0);
      const lav = o.color || COL.lavender;
      set(b, "borderColor", FX.mix(lav, COL.ink, E.clamp(f * 1.6)));
      set(b, "background", f > 0.001 ? FX.rgba(COL.ink, f) : "transparent");
      set(face.el, "color", FX.mix(lav, "#ffffff", E.clamp(f * 1.3)));
      face.render({ mood: st.mood || "neutral", prev: st.prev, since: st.since, draw: st.draw, blink: st.blink, t: st.t });
      set(el, "opacity", st.o == null || st.o >= 1 ? "" : E.clamp(st.o).toFixed(3));
      return api;
    };
    api.render({});
    return api;
  };

  /* ================= 4. orb → icon → wordmark ================= */
  const lockupGeom = (size, gapK = 0.2) => {
    const icon = Math.round(size * 1.04);
    const ww = FX.textWidth("heyswaey", { size, weight: 600, ls: -0.05 }) - (-0.05 * size); // drop trailing tracking
    const gap = size * gapK;
    const W = icon + gap + ww;
    return { icon, ww, gap, W };
  };
  const placeWord = (word, size) => {
    /* text visual centre (between baseline and x-height/ascender mix) on y = 0 */
    word.style.top = (-(BL - 0.36) * size).toFixed(2) + "px";
  };

  /* lockup(parent, { x=0, y=0, size=96, color }) — static icon + 'heyswaey'. x,y = centre of the lockup. */
  FX.lockup = (parent, o = {}) => {
    const size = o.size ?? 96;
    const g = lockupGeom(size, o.gap);
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-lockup");
    const ic = E.h("div", "fx-abs", el);
    const mark = E.K.appMark(ic, g.icon);
    E.css(mark.el, { left: (-g.W / 2).toFixed(1) + "px", top: (-g.icon / 2).toFixed(1) + "px" });
    mark.face.render({ mood: "neutral" });
    const word = E.h("div", "fx-t fx-wm", el, "heyswaey");
    E.css(word, { fontSize: size + "px", left: (-g.W / 2 + g.icon + g.gap).toFixed(1) + "px", color: o.color || COL.ink });
    placeWord(word, size);
    return { el, icon: mark.el, face: mark.face, word, w: g.W, h: g.icon, render() {} };
  };

  /* orbLogo(parent, { x=0, y=0, size=96, timing, speed=1, smudge:{w,h}, smudgeBlobs }) — the reference's logo build.
     timing (seconds, local): { smudge:0, orb:.16, collapse:.42, icon:.44, iconDur:.2, eyes:.6, check:.64, checkDur:.2,
                                word:.68, wordDur:.42 }   (total ≈ 1.1 s; scale everything with { speed })
     render(lt, { o=1 }) → { phase } ('smudge'|'orb'|'icon'|'word'|'done'). Final frame == lockup(). */
  FX.orbLogo = (parent, o = {}) => {
    const size = o.size ?? 96;
    const sp = o.speed ?? 1;
    const T = Object.assign({ smudge: 0, orb: 0.16, collapse: 0.42, icon: 0.44, iconDur: 0.2, eyes: 0.6, check: 0.64, checkDur: 0.2, word: 0.68, wordDur: 0.42 }, o.timing || {});
    for (const k in T) T[k] /= sp;
    const g = lockupGeom(size, o.gap);
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-orblogo");
    /* iridescent smudge: soft radial blobs (no filters) */
    const sm = E.h("div", "fx-abs", el);
    /* [colour, x, y (in smudge half-extents), radius (× icon), alpha] */
    const BL_ = o.smudgeBlobs || [["#cdb8ff", 0, 0, 1.5, 0.62], ["#9fe6ff", -0.55, -0.28, 1.15, 0.6], ["#f6b3e6", 0.42, -0.3, 1.2, 0.66], ["#ffc9a3", -0.28, 0.36, 1.05, 0.55], ["#9cc0ff", 0.58, 0.3, 1.0, 0.55], ["#f6b3e6", -0.8, 0.12, 0.9, 0.45], ["#b9d8ff", 0.86, -0.08, 0.85, 0.45], ["#ff9a4d", 0.12, 0.42, 0.7, 0.28]];
    const smW = (o.smudge?.w ?? g.icon * 5.6) / 2, smH = (o.smudge?.h ?? g.icon * 3.2) / 2;
    const blobs = BL_.map(([c, bx, by, r, a]) => {
      const d = E.h("div", "fx-blob", sm);
      const R = g.icon * 1.45 * r;
      /* gaussian-ish falloff so overlapping blobs melt into one haze */
      const st = [[0, 1], [0.18, 0.92], [0.36, 0.72], [0.54, 0.45], [0.7, 0.22], [0.85, 0.07], [1, 0]].map(([q, v]) => `${FX.rgba(c, a * v)} ${(q * 100).toFixed(0)}%`).join(",");
      E.css(d, { width: R * 2 + "px", height: R * 2 + "px", left: -R + "px", top: -R + "px", background: `radial-gradient(closest-side, ${st})` });
      return { d, bx, by, R };
    });
    /* orb: iridescent → lavender/electric */
    const orbS = g.icon * 1.9;
    const orbW = E.h("div", "fx-abs", el);
    const mkOrb = (bg) => { const d = E.h("div", "fx-orb", orbW); E.css(d, { width: orbS + "px", height: orbS + "px", left: -orbS / 2 + "px", top: -orbS / 2 + "px", background: bg }); return d; };
    const orbA = mkOrb("radial-gradient(circle at 34% 30%, #ffffff 0%, #fde9f8 7%, #f6b3e6 30%, #d7b6f6 52%, #b7c3ff 74%, #9fe0ff 100%)");
    const orbB = mkOrb("radial-gradient(circle at 34% 29%, #ffffff 0%, #ebe4ff 7%, #b9a1ff 28%, #8f86ff 50%, #3f84ff 76%, #0f6cf0 100%)");
    orbB.style.boxShadow = "0 18px 44px -14px rgba(15,100,255,.45)";
    /* same paint as .appmark, so the orb can turn into the icon without a see-through crossfade */
    const orbC = mkOrb("radial-gradient(120% 90% at 50% 112%, #1d4fd6 0%, #10297a 34%, #0b1236 62%, #070a18 100%)");
    /* icon */
    const icW = E.h("div", "fx-abs", el);
    const mark = E.K.appMark(icW, g.icon);
    E.css(mark.el, { left: -g.icon / 2 + "px", top: -g.icon / 2 + "px" });
    /* wordmark, revealed from behind the icon */
    const clip = E.h("div", "fx-wm-clip", el);
    const clipW = g.gap + g.ww + size * 0.4;
    E.css(clip, { width: clipW + "px", height: size * 1.4 + "px", top: -size * 0.75 + "px" });
    const word = E.h("div", "fx-t fx-wm", clip, "heyswaey");
    word.style.fontSize = size + "px";
    word.style.top = (size * 0.75 - (BL - 0.36) * size).toFixed(2) + "px";
    word.style.webkitBackgroundClip = "text";
    word.style.backgroundClip = "text";
    word.style.backgroundRepeat = "no-repeat";
    const api = { el, icon: mark.el, face: mark.face, word, orb: orbW, smudge: sm, timing: T, w: g.W, h: g.icon };
    api.render = (lt, st = {}) => {
      const O = st.o ?? 1;
      set(el, "opacity", O >= 1 ? "" : E.clamp(O).toFixed(3));
      /* smudge: drifting blobs that pull together and fade into the orb */
      const sIn = E.k(lt, T.smudge, 0.12, E.ease.outCubic);
      const sCol = E.k(lt, T.orb - 0.04, T.collapse - T.orb + 0.04, E.ease.inOutCubic);
      const sOp = sIn * (1 - E.k(lt, T.orb + 0.02, T.collapse - T.orb, E.ease.inQuad));
      show(sm, sOp > 0.002);
      if (sOp > 0.002) {
        set(sm, "opacity", sOp.toFixed(3));
        blobs.forEach((b, i) => {
          const wob = lt * 1.3 + i * 1.7;
          const spread = 1 - sCol;
          const x = b.bx * smW * 0.55 * spread + Math.sin(wob) * g.icon * 0.1 * spread;
          const y = b.by * smH * 0.5 * spread + Math.cos(wob * 1.1) * g.icon * 0.07 * spread;
          const s = E.lerp(1, 0.42, sCol) * E.lerp(0.85, 1, sIn);
          set(b.d, "transform", `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`);
        });
      }
      /* orb: pops out of the smudge, shrinks, shifts hue, then morphs into the icon */
      const oIn = E.k(lt, T.orb, 0.14, E.ease.outCubic);
      const shrink = E.spring(Math.max(0, lt - T.orb) * 0.9 * sp);
      const morph = E.k(lt, T.icon, T.iconDur, E.ease.inOutCubic);
      const wordP = E.k(lt, T.word, T.wordDur, E.ease.inOutCubic);
      const wordX = E.k(lt, T.word, T.wordDur * 1.05, E.ease.inOutQuint);
      const iconX = E.lerp(0, -g.W / 2 + g.icon / 2, wordX);
      const orbScale = E.lerp(1, 0.72, E.clamp(shrink)) * E.lerp(1, g.icon / (orbS * 0.72), morph) * E.lerp(0.6, 1, oIn);
      const rad = E.lerp(50, 22.5, morph) + "%";
      const orbOp = oIn * (lt < T.icon + T.iconDur ? 1 : 0);
      show(orbW, orbOp > 0.002);
      if (orbOp > 0.002) {
        set(orbW, "opacity", orbOp.toFixed(3));
        set(orbW, "transform", `translate(${iconX.toFixed(1)}px,0) scale(${orbScale.toFixed(4)})`);
        set(orbA, "borderRadius", rad); set(orbB, "borderRadius", rad); set(orbC, "borderRadius", rad);
        set(orbB, "opacity", E.k(lt, T.orb + 0.06, T.icon - T.orb, E.ease.inOutQuad).toFixed(3));
        set(orbC, "opacity", E.k(lt, T.icon, T.iconDur * 0.75, E.ease.inOutQuad).toFixed(3));
      }
      /* icon */
      const icOp = E.k(lt, T.icon + T.iconDur * 0.62, T.iconDur * 0.3, E.ease.linear);
      show(icW, icOp > 0.002);
      if (icOp > 0.002) {
        const icS = morph >= 1 ? 1 : (orbS * orbScale) / g.icon;
        set(icW, "opacity", icOp.toFixed(3));
        set(icW, "transform", `translate(${iconX.toFixed(1)}px,0) scale(${icS.toFixed(4)})`);
        set(mark.el, "borderRadius", morph < 1 ? rad : "");
        const eyes = E.k(lt, T.eyes, 0.12, E.ease.outCubic);
        mark.face.render({ mood: "neutral", eyes, draw: E.k(lt, T.check, T.checkDur, E.ease.inOutCubic), t: lt });
        set(mark.face.el, "transform", `scale(${E.lerp(0.7, 1, E.spring(Math.max(0, lt - T.eyes))).toFixed(3)})`);
      }
      /* wordmark slides out of the icon with a soft, tinted leading edge */
      show(clip, wordP > 0.001);
      if (wordP > 0.001) {
        const left = iconX + g.icon / 2;
        const travel = g.ww + g.gap;
        const tx = E.lerp(-g.ww - size * 0.1, g.gap, wordP);
        set(clip, "transform", `translate(${left.toFixed(1)}px,0)`);
        set(word, "transform", `translate(${tx.toFixed(1)}px,0)`);
        const fin = E.k(lt, T.word + T.wordDur * 0.55, T.wordDur * 0.5, E.ease.inOutCubic);
        const a = -fin * size * 1.0, b = size * 0.8 - fin * size * 1.2;
        const m = fin >= 1 ? "" : `linear-gradient(90deg, transparent ${a.toFixed(1)}px, #000 ${b.toFixed(1)}px)`;
        set(clip, "webkitMaskImage", m); set(clip, "maskImage", m);
        if (fin >= 1) {
          set(word, "backgroundImage", ""); set(word, "color", COL.ink);
        } else {
          const e0 = -tx - fin * size * 1.2;
          set(word, "color", "transparent");
          set(word, "backgroundImage", `linear-gradient(90deg, ${COL.lavender} ${e0.toFixed(1)}px, ${COL.electric} ${(e0 + size * 0.45).toFixed(1)}px, ${COL.ink} ${(e0 + size * 1.25).toFixed(1)}px, ${COL.ink} ${(e0 + travel + size * 2).toFixed(1)}px)`);
          set(word, "backgroundSize", (g.ww + size).toFixed(0) + "px 100%");
        }
      }
      api.phase = lt < T.orb ? "smudge" : lt < T.icon ? "orb" : lt < T.word ? "icon" : wordP < 1 ? "word" : "done";
      return api;
    };
    api.render(0);
    return api;
  };

  /* ================= 5. kinetic marquee ================= */
  let maskId = 0;
  /* inline Swaey face glyph: a disc with the face knocked out (shows whatever is behind) */
  FX.faceGlyph = (em = 0.66, { knock = true, stroke = 9.5 } = {}) => {
    const id = "fxfg" + ++maskId;
    const f = `<path d="M17 46.5 30 32.3 43 46.5M57 46.5 70 32.3 83 46.5M37.6 64.2 44.6 71.6 53.8 63.8 64.6 55.6" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const g = `<g transform="translate(50 50) scale(.8) translate(-50 -51)">${f}</g>`;
    return knock
      ? `<svg class="fx-fg" viewBox="0 0 100 100" style="width:${em}em;height:${em}em;vertical-align:-0.035em;margin:0 0.035em"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><g stroke="#000">${g}</g></mask></defs><circle cx="50" cy="50" r="50" fill="currentColor" mask="url(#${id})"/></svg>`
      : `<svg class="fx-fg" viewBox="0 0 100 100" style="width:${em}em;height:${em}em;vertical-align:-0.035em;margin:0 0.035em"><g stroke="currentColor">${g}</g></svg>`;
  };

  /* marquee(parent, { text, size=220, color='#fff', x=0, y=0, weight=600, tracking=-.055, repeat=1, gap=.6, iri=false, knock=true })
     ⊙ in `text` becomes the inline face glyph. x = left edge of the text at offset 0, y = cap-height centre.
     render(offsetPx, { o=1, iri=0, loop=false, blur }) scrolls the line left by offsetPx. width() → px of one copy. */
  FX.IRI_GRAD = "linear-gradient(90deg, #9fe6ff 0%, #b9d8ff 16%, #f6b3e6 34%, #ffc9a3 52%, #ff9a4d 64%, #cdb8ff 82%, #9fe6ff 100%)";
  FX.marquee = (parent, o = {}) => {
    const size = o.size ?? 220, color = o.color ?? "#ffffff", rep = o.repeat ?? 1;
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-mqw");
    const html = (fg) => (o.text || "").split("⊙").map((s, i) => (i ? fg : "") + esc(s)).join("");
    const mkLine = (cls, fgOpts) => {
      const d = E.h("div", "fx-mq " + cls, el);
      E.css(d, { fontSize: size + "px", fontWeight: o.weight ?? 600, letterSpacing: (o.tracking ?? -0.055) + "em", top: (-(BL - CAP / 2) * size).toFixed(1) + "px" });
      const one = html(FX.faceGlyph(0.68, fgOpts));
      d.innerHTML = Array.from({ length: rep }, () => `<span class="fx-mq-c" style="margin-right:${o.gap ?? 0.6}em">${one}</span>`).join("");
      return d;
    };
    const line = mkLine("", { knock: o.knock !== false });
    line.style.color = color;
    let iri = null;
    if (o.iri) {
      iri = mkLine("fx-mq-iri", { knock: true });
      E.css(iri, { color: "transparent", backgroundImage: o.gradient || FX.IRI_GRAD, backgroundSize: "60% 100%", backgroundRepeat: "repeat-x", webkitBackgroundClip: "text", backgroundClip: "text" });
      iri.querySelectorAll("svg").forEach((s) => (s.style.color = "#cdb8ff"));
    }
    let W = null;
    const api = { el, line, iri };
    /* one copy incl. its trailing gap (layout read once, cached) */
    api.width = () => (W ??= line.children.length > 1 ? line.children[1].offsetLeft - line.children[0].offsetLeft : line.firstChild.offsetWidth + (o.gap ?? 0.6) * size);
    api.render = (off = 0, st = {}) => {
      let x = -off;
      if (st.loop) { const w = api.width(); x = -(((off % w) + w) % w); }
      const tf = `translate(${x.toFixed(1)}px,0)`;
      set(line, "transform", tf);
      const O = st.o ?? 1, ir = E.clamp(st.iri ?? 0);
      set(line, "opacity", (O * (iri ? 1 - ir : 1)).toFixed(3));
      if (iri) {
        set(iri, "transform", tf);
        set(iri, "opacity", (O * ir).toFixed(3));
        show(iri, ir > 0.001);
        set(iri, "backgroundPosition", `${(-x * 0.35).toFixed(0)}px 0`);
      }
      if (st.blur != null) set(el, "filter", st.blur > 0.05 ? `blur(${st.blur.toFixed(2)}px)` : "");
      return api;
    };
    api.render(0);
    return api;
  };

  /* ================= 6. dark-screen type line ================= */
  /* typeLine(parent, { x=0, y=0, size=140, align:'center'|'left', color='#f4f4f4' })
     render({ text, n=all, caret=true|0..1, caretColor, arrow=1, arrowScale=1, arrowDim=0, box=0, o=1,
              highlights:[{ word, kind:'coral'|'select', p=1 }] })
     x,y = line centre (align center) or left edge (align left) at the x-height centre. */
  FX.typeLine = (parent, o = {}) => {
    const size = o.size ?? 140;
    const ink = o.color || "#f4f4f4";
    const selC = o.selColor || "rgba(15,127,255,.62)";
    const el = anchor(parent, o.x ?? 0, o.y ?? 0, "fx-tlw");
    const row = E.h("div", "fx-t fx-tl", el);
    E.css(row, { fontSize: size + "px", color: ink, top: (-(BL - XH / 2) * size).toFixed(1) + "px" });
    row.style.transform = o.align === "left" ? "" : "translate(-50%,0)";
    /* faint terminal frame (ref f_0248): outline + divider after the arrow */
    const frame = E.h("div", "fx-abs", row);
    E.css(frame, { left: "-0.3em", right: "-0.36em", top: "-0.16em", bottom: "-0.2em", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.13)", borderRadius: "0.03em", opacity: 0 });
    const divl = E.h("div", "fx-abs", frame);
    E.css(divl, { left: "1.0em", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,.11)" });
    const arrow = E.h("span", "", row);
    arrow.innerHTML = `<svg viewBox="0 0 100 80" style="width:.74em;height:.6em;display:block;overflow:visible"><path d="M8 40H88M56 10 89 40 56 70" fill="none" stroke="${o.arrowColor || COL.green}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    E.css(arrow, { display: "inline-block", alignSelf: "baseline", marginRight: "0.34em", transform: "translateY(0.04em)" });
    const runsEl = E.h("span", "", row);
    const caret = E.h("span", "fx-caret", row);
    E.css(caret, { width: "0.068em", height: "1.08em", marginLeft: "0.05em", transform: "translateY(0.2em)", background: COL.lavender });
    let key = null, runs = [];
    const api = { el, row, arrow, caretEl: caret, frame };
    api.render = (st = {}) => {
      const text = st.text ?? o.text ?? "";
      const hl = st.highlights || o.highlights || [];
      const k = text + "|" + hl.map((h) => h.word + ":" + h.kind).join(",");
      if (key !== k) {
        key = k;
        runsEl.textContent = "";
        runs = [];
        const marks = hl.map((h) => ({ h, i: text.indexOf(h.word) })).filter((m) => m.i >= 0).sort((a, b) => a.i - b.i);
        let i = 0;
        const push = (s0, s1, h) => {
          if (s1 <= s0) return;
          const s = E.h("span", h ? "fx-tl-w" : "", runsEl);
          if (h && h.kind === "select") E.css(s, { padding: "0.02em 0.04em 0.13em", margin: "-0.02em -0.04em -0.13em", lineHeight: "1", backgroundImage: `linear-gradient(${selC}, ${selC})` });
          runs.push({ s, i0: [...text.slice(0, s0)].length, str: text.slice(s0, s1), h });
        };
        for (const m of marks) { if (m.i < i) continue; push(i, m.i, null); push(m.i, m.i + m.h.word.length, m.h); i = m.i + m.h.word.length; }
        push(i, text.length, null);
      }
      const n = Math.floor(st.n ?? [...text].length);
      runs.forEach((r) => {
        const ch = [...r.str];
        const kk = Math.max(0, Math.min(ch.length, n - r.i0));
        setText(r.s, ch.slice(0, kk).join(""));
        if (!r.h) return;
        const live = hl.find((q) => q.word === r.h.word) || r.h;
        const p = E.clamp(live.p ?? 1);
        if (r.h.kind === "coral") set(r.s, "color", FX.mix(ink, COL.coral, p));
        else {
          set(r.s, "color", FX.mix(ink, "#eef4ff", p));
          set(r.s, "backgroundSize", `${(p * 100).toFixed(1)}% 100%`);
        }
      });
      const c = st.caret === false ? 0 : st.caret === true || st.caret == null ? 1 : +st.caret;
      set(caret, "opacity", c.toFixed(3));
      if (st.caretColor) set(caret, "background", st.caretColor);
      set(arrow, "opacity", (st.arrow ?? 1).toFixed(3));
      /* the reference arrow starts big and bright (≈1em), then settles small and dim olive */
      const as = st.arrowScale ?? 1;
      set(arrow.firstChild, "width", (0.74 * as).toFixed(3) + "em");
      set(arrow.firstChild, "height", (0.6 * as).toFixed(3) + "em");
      set(arrow.firstChild.firstChild, "stroke", FX.mix(o.arrowColor || COL.green, "#4b6428", st.arrowDim ?? 0));
      set(frame, "opacity", E.clamp(st.box ?? 0).toFixed(3));
      set(el, "opacity", st.o == null || st.o >= 1 ? "" : E.clamp(st.o).toFixed(3));
      return api;
    };
    api.render({});
    return api;
  };
  /* the reference caret colour cycle (violet → pink-lavender → white), stepped */
  FX.caretColor = (t, fps = 10) => ["#7f82ef", "#a98bff", "#ebc2fe", "#f4f4f4"][Math.min(3, FX.step(t, fps))];

  /* ================= 7. film cursor (macOS arrow) ================= */
  /* cursor(parent, { size=28 }) — black macOS pointer with white outline; size = height in px.
     render(x, y, { press=0, o=1 }) puts the tip at (x, y). Use FX.pressAt(t, clicks) for press. */
  FX.cursor = (parent, o = {}) => {
    const hpx = o.size ?? 28;
    const el = E.h("div", "fx-cur", parent);
    const s = hpx / 24;
    el.innerHTML = `<svg width="${(17 * s).toFixed(1)}" height="${(24 * s).toFixed(1)}" viewBox="0 0 17 24"><path d="M1.5 1.2 L1.5 18.6 L5.6 14.7 L8.4 21.4 L11.3 20.2 L8.6 13.7 L14.3 13.7 Z" fill="#000" stroke="#fff" stroke-width="1.25" stroke-linejoin="round"/></svg>`;
    const api = { el };
    api.render = (x, y, st = {}) => {
      const pr = E.clamp(st.press ?? 0);
      set(el, "transform", `translate(${(x - 1.5 * s).toFixed(1)}px,${(y - 1.2 * s).toFixed(1)}px) scale(${(1 - pr * 0.14).toFixed(3)})`);
      set(el, "opacity", st.o == null || st.o >= 1 ? "" : E.clamp(st.o).toFixed(3));
      show(el, (st.o ?? 1) > 0.001);
      return api;
    };
    return api;
  };
})();
