/* Deterministic motion engine.
   Every frame is a pure function of time: E.seek(t) puts each scene in the
   exact state for t, so frames can be rendered in any order, in parallel,
   and with sub-frame motion blur. Scenes also register audio cues, which the
   renderer exports so the soundtrack lands on the same frames. */
(function () {
  const E = (window.E = {});

  E.W = 1920;
  E.H = 1080;
  E.BPM = 128;
  E.beat = 60 / E.BPM;
  E.bar = E.beat * 4;
  E.b = (n) => n * E.beat;

  /* ---------- math ---------- */
  E.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.inv = (a, b, x) => E.clamp((x - a) / (b - a));
  E.mix = (a, b, t) => (Array.isArray(a) ? a.map((v, i) => E.lerp(v, b[i], t)) : E.lerp(a, b, t));
  E.fract = (x) => x - Math.floor(x);
  E.hash = (n) => E.fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
  E.rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- easing ---------- */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      t = E.clamp(t);
      return sy(t);
    };
  }
  E.bezier = bezier;
  const P = Math.pow;
  E.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - P(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - P(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - P(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - P(1 - t, 4),
    inQuart: (t) => t * t * t * t,
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - P(-2 * t + 2, 4) / 2),
    outQuint: (t) => 1 - P(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * P(t, 5) : 1 - P(-2 * t + 2, 5) / 2),
    outExpo: (t) => (t >= 1 ? 1 : 1 - P(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : P(2, 10 * t - 10)),
    inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? P(2, 20 * t - 10) / 2 : (2 - P(2, -20 * t + 10)) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * P(t - 1, 3) + c1 * P(t - 1, 2); },
    inBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
    // The site's own curves (base.css): the island drop and the spring pop.
    island: bezier(0.32, 1.25, 0.5, 1),
    spring: bezier(0.34, 1.56, 0.64, 1),
    out: bezier(0.22, 1, 0.36, 1),
    inOut: bezier(0.65, 0, 0.35, 1),
    snap: bezier(0.85, 0, 0.15, 1),
    whip: bezier(0.7, 0, 0.2, 1),
  };

  /* Damped spring step response, same constants as Swaey's face
     (k = 260, damping ratio .58). t in seconds, returns 0 → 1 with overshoot. */
  E.spring = (t, w0 = 16.1, z = 0.58) => {
    if (t <= 0) return 0;
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
  };

  /* progress of an animation that starts at t0 and lasts d */
  E.k = (t, t0, d, ease = E.ease.outCubic) => ease(E.clamp((t - t0) / d));
  /* keyframes: [[t, v], [t, v, ease], ...] (v may be a number or an array) */
  E.kf = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        const [ta, va] = keys[i - 1];
        const [tb, vb, ez] = keys[i];
        const p = (ez || E.ease.inOutCubic)((t - ta) / (tb - ta));
        return E.mix(va, vb, p);
      }
    }
    return keys[keys.length - 1][1];
  };
  /* fade window: 0 before a, ramps to 1 over fi, holds, ramps out over fo before b */
  E.win = (t, a, b, fi = 0.2, fo = 0.2, ez = E.ease.outCubic) =>
    Math.min(ez(E.clamp((t - a) / fi)), 1 - E.ease.inCubic(E.clamp((t - (b - fo)) / fo)));

  /* ---------- DOM ---------- */
  E.h = (tag, cls, parent, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  };
  E.css = (el, st) => { Object.assign(el.style, st); return el; };
  E.tf = (el, o = {}) => {
    const { x = 0, y = 0, z = 0, s = 1, sx = 1, sy = 1, rx = 0, ry = 0, rz = 0, o: op, blur } = o;
    el.style.transform =
      `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px)` +
      (rx ? ` rotateX(${rx.toFixed(3)}deg)` : "") +
      (ry ? ` rotateY(${ry.toFixed(3)}deg)` : "") +
      (rz ? ` rotateZ(${rz.toFixed(3)}deg)` : "") +
      ` scale(${(s * sx).toFixed(4)},${(s * sy).toFixed(4)})`;
    if (op != null) el.style.opacity = E.clamp(op).toFixed(3);
    if (blur != null) el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
    return el;
  };
  E.op = (el, v) => { el.style.opacity = E.clamp(v).toFixed(3); el.style.visibility = v <= 0.001 ? "hidden" : ""; };

  /* element rect in stage pixels (the preview scales the stage) */
  E.scale = 1;
  E.rect = (el) => { const r = el.getBoundingClientRect(), k = E.scale; return { left: r.left / k, top: r.top / k, width: r.width / k, height: r.height / k }; };

  /* split text into per-character spans (spaces preserved) */
  E.chars = (el, text) => {
    el.textContent = "";
    return [...text].map((ch) => {
      const s = E.h("span", "ch", el);
      s.textContent = ch;
      if (ch === " ") s.style.whiteSpace = "pre";
      return s;
    });
  };
  E.words = (el, text, cls = "wd") => {
    el.textContent = "";
    const out = [];
    text.split(" ").forEach((w, i, a) => {
      const s = E.h("span", cls, el);
      s.textContent = w;
      out.push(s);
      if (i < a.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return out;
  };

  /* ---------- scenes & cues ---------- */
  E.scenes = [];
  E.cues = [];
  E.post = [];
  E.scene = (name, start, end, build, opts = {}) => {
    const wrap = E.h("div", "scene", E.world);
    wrap.dataset.name = name;
    if (opts.z != null) wrap.style.zIndex = opts.z;
    const root = E.h("div", "scene-root", wrap);
    const s = { name, start, end, wrap, root, on: null, forced: false };
    wrap.style.display = "none";
    s.update = build(root, s) || (() => {});
    E.scenes.push(s);
    return s;
  };
  E.cue = (t, type, opt = {}) => { E.cues.push(Object.assign({ t: +t.toFixed(4), type }, opt)); };
  E.find = (name) => E.scenes.find((s) => s.name === name);

  E.seek = (t) => {
    E.t = t;
    for (const s of E.scenes) s.forced = false;
    for (const f of E.pre || []) f(t);
    for (const s of E.scenes) {
      const on = s.forced || (t >= s.start && t < s.end);
      if (on !== s.on) { s.wrap.style.display = on ? "" : "none"; s.on = on; }
      if (on && !s.forced) {
        if (s.wrap.style.transform || s.wrap.style.filter) { s.wrap.style.transform = ""; s.wrap.style.opacity = ""; s.wrap.style.filter = ""; s.wrap.style.clipPath = ""; s.wrap.style.zIndex = ""; }
        s.update(t - s.start, t);
      }
    }
    for (const f of E.post) f(t);
  };
})();
