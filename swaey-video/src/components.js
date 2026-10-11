/* Swaey's building blocks, ported from heyswaey.com (face.js, wave.js,
   island.js) and made frame-deterministic: no rAF, no timers, no
   Math.random. Each component exposes render(state) for a given time. */
(function () {
  const E = window.E;
  const C = (E.C = {});

  /* ======================= Face ======================= */
  const P = (pts) => pts.map(([x, y]) => ({ x, y }));
  const EX = {
    caret: P([[-1, 0.55], [0, -0.5], [1, 0.55]]),
    tallCaret: P([[-0.9, 0.6], [0, -0.85], [0.9, 0.6]]),
    flat: P([[-0.9, 0.1], [0, 0.1], [0.9, 0.1]]),
    wince: P([[-0.75, -0.6], [0.75, 0], [-0.75, 0.6]]),
    check: P([[-0.62, -0.02], [-0.28, 0.34], [0.2, -0.05], [0.72, -0.48]]),
    bigCheck: P([[-0.72, -0.08], [-0.32, 0.4], [0.24, -0.08], [0.84, -0.6]]),
    smallCheck: P([[-0.5, 0], [-0.22, 0.3], [0.15, 0], [0.55, -0.35]]),
    flatMouth: P([[-0.55, 0.1], [-0.2, 0.1], [0.2, 0.1], [0.55, 0.1]]),
    sideMouth: P([[-0.1, 0.15], [0.15, 0.15], [0.4, 0.12], [0.65, 0.08]]),
    zigzag: P([[-0.8, 0.12], [-0.3, -0.2], [0.3, 0.32], [0.8, 0]]),
    talkTop: P([[-0.55, 0], [-0.2, -0.04], [0.2, -0.04], [0.55, 0]]),
  };
  const MOODS = {
    neutral: { l: EX.caret, r: EX.caret, m: EX.check },
    happy: { l: EX.caret, r: EX.caret, m: EX.bigCheck },
    listen: { l: EX.tallCaret, r: EX.tallCaret, m: EX.smallCheck },
    think: { l: EX.caret, r: EX.caret, m: EX.sideMouth },
    talk: { l: EX.caret, r: EX.caret, m: EX.talkTop, talk: true },
    ask: { l: EX.caret, r: EX.caret, m: EX.flatMouth },
    sleepy: { l: EX.flat, r: EX.flat, m: EX.flatMouth },
    surprised: { l: EX.tallCaret, r: EX.tallCaret, m: EX.flatMouth },
  };
  const L = { lx: 29, rx: 71, ey: 38, eu: 13, mx: 50, my: 65, mu: 18 };
  const flat = (mood) => {
    const m = MOODS[mood] || MOODS.neutral;
    return [...m.l, ...m.r, ...m.m].flatMap((p) => [p.x, p.y]);
  };

  C.Face = class {
    constructor(parent, { size = 100, ink = false, stroke, cls = "" } = {}) {
      this.el = E.h("div", "face " + cls, parent);
      this.size = size;
      const sw = stroke || (size < 22 ? 10.5 : size < 40 ? 9 : 8);
      this.el.innerHTML = `<svg class="face-svg ${ink ? "face-ink" : "face-glow"}" width="${size}" height="${size}" viewBox="0 0 100 100">
        <path stroke-width="${sw}"/><path stroke-width="${sw}"/><path stroke-width="${sw}"/></svg>`;
      [this.pl, this.pr, this.pm] = this.el.querySelectorAll("path");
      this.render({});
    }
    /* st: { mood, prev, since, blink 0..1, talk 0..1, gx, gy, draw 0..1, t } */
    render(st) {
      const to = flat(st.mood || "neutral");
      const from = flat(st.prev || st.mood || "neutral");
      const p = st.since == null ? 1 : E.spring(st.since);
      const v = to.map((b, i) => from[i] + (b - from[i]) * p);
      const gx = st.gx || 0, gy = st.gy || 0;
      const open = 1 - (st.blink || 0) * 0.9;
      const eye = (off, cx) => {
        let d = "";
        for (let i = 0; i < 3; i++) {
          const x = cx + gx + v[off + i * 2] * L.eu;
          const y = L.ey + gy + v[off + i * 2 + 1] * L.eu * open;
          d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
        }
        return d;
      };
      this.pl.setAttribute("d", eye(0, L.lx));
      this.pr.setAttribute("d", eye(6, L.rx));
      const mx = L.mx + gx * 0.5, my = L.my + gy * 0.5;
      let d = "";
      for (let i = 0; i < 4; i++) d += (i ? "L" : "M") + (mx + v[12 + i * 2] * L.mu).toFixed(2) + " " + (my + v[12 + i * 2 + 1] * L.mu).toFixed(2);
      const talk = MOODS[st.mood]?.talk ? (st.talk ?? C.talkAt(st.t || 0)) * E.clamp(p) : 0;
      if (talk > 0.02) {
        for (let i = 3; i >= 0; i--) {
          const bulge = i === 1 || i === 2 ? 1 : 0.35;
          d += "L" + (mx + v[12 + i * 2] * L.mu * 0.92).toFixed(2) + " " + (my + (v[12 + i * 2 + 1] + talk * 0.55 * bulge) * L.mu).toFixed(2);
        }
        d += "Z";
      }
      this.pm.setAttribute("d", d);
      if (st.draw != null && st.draw < 0.999) {
        this.pm.style.strokeDasharray = "120";
        this.pm.style.strokeDashoffset = (120 * (1 - E.clamp(st.draw))).toFixed(2);
      } else if (this.pm.style.strokeDasharray) {
        this.pm.style.strokeDasharray = "";
        this.pm.style.strokeDashoffset = "";
      }
      if (st.eyes != null) { this.pl.style.opacity = this.pr.style.opacity = st.eyes; }
    }
  };
  C.talkAt = (t) => {
    const n = t * 1000;
    const s = Math.sin(n / 95) * 0.5 + Math.sin(n / 57 + 1.3) * 0.35 + Math.sin(n / 160) * 0.25;
    return E.clamp(0.25 + s * 0.6);
  };
  /* mood track [[t, mood], ...] → face state */
  C.moodAt = (track, t) => {
    let i = 0;
    while (i < track.length - 1 && t >= track[i + 1][0]) i++;
    return { mood: track[i][1], prev: i > 0 ? track[i - 1][1] : track[i][1], since: t - track[i][0] };
  };
  C.blinkAt = (times, t) => {
    for (const b of times) {
      const u = (t - b) / 0.16;
      if (u >= 0 && u < 1) return u < 0.5 ? u * 2 : (1 - u) * 2;
    }
    return 0;
  };

  /* ======================= Wave ======================= */
  const syl = (t) => Math.max(0, Math.sin(t * 7.3) * 0.6 + Math.sin(t * 3.1 + 1) * 0.5 + Math.sin(t * 13.7) * 0.25);
  const breath = (t) => (Math.sin(t * 0.9) > -0.55 ? 1 : 0.15);
  function waveTargets(mode, t, n, jit, level) {
    const mid = (n - 1) / 2;
    const out = new Array(n);
    switch (mode) {
      case "listen":
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - mid);
          const tt = t - Math.floor(d) * 0.028;
          const v = (level != null ? level(tt) : syl(tt) * breath(tt));
          const fall = Math.exp(-d / (n * 0.33));
          out[i] = 0.08 + v * fall * (0.75 + jit[i] * 0.35);
        }
        break;
      case "think":
        for (let i = 0; i < n; i++) {
          const x = i / n;
          const crest = Math.exp(-Math.pow((x - ((t * 0.42) % 1.4) + 0.2) * 3.2, 2));
          const ripple = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.42);
          out[i] = 0.07 + crest * (0.35 + ripple * 0.45) + ripple * 0.08;
        }
        break;
      case "speak": {
        const env = Math.max(0.12, 0.55 + Math.sin(t * 9.1) * 0.25 + Math.sin(t * 4.3 + 2) * 0.22 + Math.sin(t * 15.7) * 0.12);
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - mid) / mid;
          const shape = Math.pow(1 - d, 1.4);
          const tw = 0.6 + 0.4 * Math.sin(t * 11 + jit[i] * 20);
          out[i] = 0.07 + env * shape * tw * 0.95;
        }
        break;
      }
      case "burst":
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - mid) / mid;
          out[i] = 0.1 + Math.pow(1 - d, 0.9) * (0.55 + 0.45 * Math.sin(t * 13 + jit[i] * 30)) ;
        }
        break;
      default:
        for (let i = 0; i < n; i++) out[i] = 0;
    }
    return out;
  }

  C.Wave = class {
    constructor(parent, w, h, { bar = 3, gap = 2.6, cls = "wave", dpr = 1 } = {}) {
      this.c = E.h("canvas", cls, parent);
      this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
      this.c.style.width = w + "px"; this.c.style.height = h + "px";
      this.ctx = this.c.getContext("2d");
      this.W = w; this.H = h; this.dpr = dpr; this.bw = bar; this.gap = gap;
      this.n = Math.max(9, Math.floor((w + gap) / (bar + gap)) | 1);
      const r = E.rng(w * 7 + h);
      this.jit = Array.from({ length: this.n }, () => r());
    }
    /* mode, t, { to: modeB, mix, amp, level(t) } */
    render(mode, t, o = {}) {
      const { ctx, W, H, dpr, n } = this;
      let tg = waveTargets(mode, t, n, this.jit, o.level);
      if (o.to) {
        const tb = waveTargets(o.to, t, n, this.jit, o.level);
        tg = tg.map((v, i) => E.lerp(v, tb[i], o.mix || 0));
      }
      const amp = o.amp ?? 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const bw = this.bw, gap = this.gap;
      const total = n * bw + (n - 1) * gap;
      let x = (W - total) / 2;
      const mid = H / 2;
      const path = new Path2D();
      for (let i = 0; i < n; i++) {
        const hh = Math.max(bw, Math.min(1, tg[i] * amp) * H);
        path.roundRect(x, mid - hh / 2, bw, hh, bw / 2);
        x += bw + gap;
      }
      ctx.save();
      ctx.shadowColor = o.glow || "rgba(33, 97, 255, 0.95)";
      ctx.shadowBlur = o.blur ?? 8;
      ctx.fillStyle = o.under || "rgba(33, 97, 255, 0.55)";
      ctx.fill(path);
      ctx.restore();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const core = o.core || "#ffffff";
      g.addColorStop(0, o.tip || "#6bb3ff"); g.addColorStop(0.3, core); g.addColorStop(0.7, core); g.addColorStop(1, o.tip || "#6bb3ff");
      ctx.fillStyle = g;
      ctx.fill(path);
    }
  };

  /* ======================= Island ======================= */
  const ICON = {
    rec: '<span class="rec"></span>',
    spin: '<span class="spin"></span>',
    speaker: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#9cc6ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1.5 1.5 0 0 1 1.5 1.5V11h.5V5.5a1.5 1.5 0 0 1 3 0V12h.5V8a1.5 1.5 0 0 1 3 0v6.5A7.5 7.5 0 0 1 13 22h-.7a7 7 0 0 1-5.6-2.8L3.4 14.8a1.6 1.6 0 0 1 2.4-2.1L8 14.5V6a1.5 1.5 0 0 1 3 0v5h.5V4.5A1.5 1.5 0 0 1 12 3z"/></svg>',
    none: "",
  };
  C.ICON = ICON;
  C.Island = class {
    /* em: px size of 1em; width: content width in em */
    constructor(parent, { em = 16, width = 26, waveH = 2.4 } = {}) {
      const el = (this.el = E.h("div", "island", parent));
      el.style.fontSize = em + "px";
      this.em = em;
      this.width = width;
      el.innerHTML = `<div class="isl-clip"><div class="isl-glow"></div><div class="isl-grain"></div>
        <div class="isl-inner" style="width:${width}em"><div class="isl-top"><span class="isl-face"></span><span class="isl-icon"></span></div>
        <div class="isl-wavebox"></div><div class="isl-text"></div>
        <div class="isl-actions"><span class="isl-btn" data-a="cancel">Cancel</span><span class="isl-btn isl-btn--primary" data-a="go">Go ahead</span></div></div></div>`;
      this.clip = el.querySelector(".isl-clip");
      this.glow = el.querySelector(".isl-glow");
      this.grain = el.querySelector(".isl-grain");
      this.inner = el.querySelector(".isl-inner");
      this.iconEl = el.querySelector(".isl-icon");
      this.textEl = el.querySelector(".isl-text");
      this.actions = el.querySelector(".isl-actions");
      this.btnGo = el.querySelector('[data-a="go"]');
      this.btnCancel = el.querySelector('[data-a="cancel"]');
      this.face = new C.Face(el.querySelector(".isl-face"), { size: Math.round(em * 2.15) });
      this.wave = new C.Wave(el.querySelector(".isl-wavebox"), (width + 0.5) * em, waveH * em, { bar: (3 / 14) * em, gap: (2.6 / 14) * em });
      this._icon = null; this._text = null;
    }
    setIcon(name) { if (name !== this._icon) { this._icon = name; this.iconEl.innerHTML = ICON[name] || ""; } }
    /* karaoke text: words become white as `p` (0..1) passes them */
    setText(text, p = 1, { dim = 0.36 } = {}) {
      if (text !== this._text) {
        this._text = text;
        this.words = E.words(this.textEl, text);
      }
      const n = this.words.length;
      this.words.forEach((w, i) => {
        const a = E.clamp(p * n - i);
        w.style.color = `rgba(255,255,255,${(dim + (1 - dim) * a).toFixed(3)})`;
      });
    }
    /* w,h in em; open 0..1 controls glow/shadow/radius; content 0..1 */
    render({ w, h, open = 1, content = 1, glow, actions = 0 }) {
      const el = this.el;
      el.style.width = w + "em";
      el.style.height = h + "em";
      const r = E.lerp(1.05, 1.9, E.clamp(open));
      el.style.borderRadius = `0 0 ${r}em ${r}em`;
      el.style.boxShadow = `0 1.6em 3.4em -1em rgba(15,127,255,${(0.38 * open).toFixed(3)}), 0 1em 2em -1em rgba(0,0,0,${(0.5 * open).toFixed(3)})`;
      const g = glow ?? open * 0.9;
      this.glow.style.opacity = E.clamp(g).toFixed(3);
      this.glow.style.transform = `translateY(${((1 - E.clamp(open)) * 18).toFixed(1)}%)`;
      this.grain.style.opacity = (0.5 * open).toFixed(3);
      this.inner.style.opacity = E.clamp(content).toFixed(3);
      this.actions.style.display = actions > 0.01 ? "flex" : "none";
      this.actions.style.opacity = E.clamp(actions).toFixed(3);
    }
  };

  /* ======================= Cursor ======================= */
  C.Cursor = class {
    constructor(parent, { size = 1 } = {}) {
      this.el = E.h("div", "cursor", parent);
      this.el.innerHTML = `<div class="cur-ring"></div><svg class="cur-arrow" width="${28 * size}" height="${40 * size}" viewBox="0 0 28 40"><path d="M2 2 L2 31 L9.2 24.4 L13.8 35.4 L18.6 33.4 L14 22.6 L23.6 22.2 Z" fill="#000" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
      this.ring = this.el.querySelector(".cur-ring");
      this.arrow = this.el.querySelector(".cur-arrow");
      this.size = size;
    }
    /* clicks: array of click times; returns press amount */
    render(x, y, t, clicks = [], o = 1) {
      let press = 0, ring = -1;
      for (const c of clicks) {
        const u = t - c;
        if (u > -0.09 && u < 0.12) press = Math.max(press, 1 - Math.abs(u + 0.0) / 0.12);
        if (u >= 0 && u < 0.5) ring = u / 0.5;
      }
      E.tf(this.el, { x, y, o });
      this.arrow.style.transform = `scale(${(1 - press * 0.16).toFixed(3)})`;
      if (ring >= 0) {
        const e = E.ease.outCubic(ring);
        this.ring.style.opacity = ((1 - ring) * 0.9).toFixed(3);
        this.ring.style.transform = `translate(-50%,-50%) scale(${(0.3 + e * 1.4).toFixed(3)})`;
      } else this.ring.style.opacity = "0";
      return press;
    }
  };

  /* ======================= Mac window ======================= */
  C.Window = (parent, { w, h, title = "", dark = false, cls = "", bar = 44 } = {}) => {
    const el = E.h("div", "win " + (dark ? "win-dark " : "") + cls, parent);
    E.css(el, { width: w + "px", height: h + "px" });
    const tb = E.h("div", "win-bar", el);
    tb.style.height = bar + "px";
    tb.innerHTML = `<i class="tl r"></i><i class="tl y"></i><i class="tl g"></i><span class="win-title">${title}</span>`;
    const body = E.h("div", "win-body", el);
    return { el, body, bar: tb };
  };

  C.icon = (parent, name, size, cls = "") => {
    const im = E.h("img", "appicon " + cls, parent);
    im.src = `assets/icons/${name}.png`;
    im.style.width = im.style.height = size + "px";
    return im;
  };

  C.Keycap = (parent, label, { w = 120, h = 120, sub = "" } = {}) => {
    const el = E.h("div", "key", parent);
    E.css(el, { width: w + "px", height: h + "px" });
    el.innerHTML = `<div class="key-top"><span class="key-l">${label}</span>${sub ? `<span class="key-s">${sub}</span>` : ""}</div>`;
    const top = el.firstChild;
    return {
      el,
      press(p) {
        top.style.transform = `translateY(${(p * h * 0.07).toFixed(2)}px)`;
        top.style.boxShadow = `0 ${(h * 0.075 * (1 - p) + 1).toFixed(1)}px 0 #c9c9cf, 0 ${(h * 0.12 * (1 - p) + 4).toFixed(1)}px ${(h * 0.2).toFixed(1)}px rgba(0,0,0,${(0.18 - p * 0.08).toFixed(3)})`;
        top.style.background = p > 0.5 ? "#f4f6fb" : "#ffffff";
      },
    };
  };

  /* ======================= WebGL shader layer ======================= */
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  C.Shader = class {
    constructor(parent, w, h, frag, { scale = 1, cls = "glc" } = {}) {
      this.c = E.h("canvas", cls, parent);
      this.c.width = Math.round(w * scale); this.c.height = Math.round(h * scale);
      this.c.style.width = w + "px"; this.c.style.height = h + "px";
      const gl = (this.gl = this.c.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false }));
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + "\n" + src.slice(0, 400));
        return s;
      };
      const pr = (this.pr = gl.createProgram());
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "precision highp float;\nuniform vec2 uRes;uniform float uT;\n" + frag));
      gl.linkProgram(pr);
      gl.useProgram(pr);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
    }
    render(t, uni = {}) {
      const gl = this.gl;
      gl.viewport(0, 0, this.c.width, this.c.height);
      const U = (n) => (this.u[n] ??= gl.getUniformLocation(this.pr, n));
      gl.uniform2f(U("uRes"), this.c.width, this.c.height);
      gl.uniform1f(U("uT"), t);
      for (const [k, v] of Object.entries(uni)) {
        if (Array.isArray(v)) (v.length === 2 ? gl.uniform2f : v.length === 3 ? gl.uniform3f : gl.uniform4f).call(gl, U(k), ...v);
        else gl.uniform1f(U(k), v);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };

  /* Swaey wallpaper: soft ribbons in the brand blues (a nod to the Mac's
     wave wallpapers, recoloured electric / indigo / sky / ice). */
  C.FRAG_WALL = `
  uniform float uDark;
  vec3 hex(float r,float g,float b){return vec3(r,g,b)/255.;}
  float n2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec2 uv=gl_FragCoord.xy/uRes; uv.y=1.-uv.y; float ar=uRes.x/uRes.y; float x=uv.x*ar;
    vec3 top=mix(hex(214.,230.,255.),hex(158.,197.,255.),uv.y);
    vec3 col=top;
    vec3 L[6];
    L[0]=hex(158.,197.,255.); L[1]=hex(92.,160.,255.); L[2]=hex(15.,127.,255.);
    L[3]=hex(10.,99.,214.); L[4]=hex(52.,40.,190.); L[5]=hex(34.,24.,152.);
    for(int i=0;i<6;i++){
      float fi=float(i);
      float y=0.12+fi*0.15+0.075*sin(x*(1.6+fi*0.22)+uT*0.32+fi*1.9)+0.035*sin(x*(3.7-fi*0.3)-uT*0.21+fi*2.7);
      float d=uv.y-y;
      float m=smoothstep(-0.0025,0.0025,d);
      float shade=exp(-max(d,0.)*14.)*0.38;
      float rim=exp(-abs(d)*260.)*0.22;
      vec3 c=L[i]*(1.0-shade*0.55)+vec3(rim);
      c+=0.06*sin(vec3(0.,1.,2.)+x*1.3+fi);
      col=mix(col,c,m);
    }
    col=mix(col,col*0.35+hex(5.,8.,20.)*0.65,uDark);
    col+= (n2(gl_FragCoord.xy+uT)-0.5)*0.035;
    gl_FragColor=vec4(col,1.);
  }`;

  /* Dark stage: near black, an electric glow and a fine dot grid. */
  C.FRAG_DARK = `
  uniform vec2 uGlow; uniform float uGlowR; uniform float uGlowA; uniform float uGrid;
  float n2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec2 px=gl_FragCoord.xy; px.y=uRes.y-px.y; vec2 uv=px/uRes;
    vec3 col=vec3(0.035,0.04,0.055);
    float d=length((px-uGlow)/uRes.y);
    col+=vec3(0.06,0.32,1.0)*uGlowA*exp(-d*d/(uGlowR*uGlowR))*0.55;
    col+=vec3(0.13,0.09,0.6)*uGlowA*exp(-d*d/(uGlowR*uGlowR*4.))*0.25;
    vec2 g=mod(px,32.)-16.; float dot=smoothstep(1.6,0.6,length(g));
    col+=vec3(1.)*dot*0.05*uGrid;
    col+=(n2(px+uT)-0.5)*0.03;
    gl_FragColor=vec4(col,1.);
  }`;

  /* Halftone glow (site footer): blue dots that swell toward the bottom. */
  C.FRAG_HALF = `
  uniform float uAmt; uniform float uCell;
  float n(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){vec2 i0=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
    float a0=n(i0),b0=n(i0+vec2(1,0)),c0=n(i0+vec2(0,1)),d0=n(i0+vec2(1,1));
    v+=a*mix(mix(a0,b0,f.x),mix(c0,d0,f.x),f.y);p*=2.03;a*=.5;}return v;}
  void main(){
    vec2 px=gl_FragCoord.xy; vec2 uv=px/uRes;
    vec2 cell=floor(px/uCell); vec2 c=(cell+.5)*uCell; vec2 cuv=c/uRes;
    float f=fbm(vec2(cuv.x*3.+uT*.12,cuv.y*2.-uT*.05));
    float v=smoothstep(0.30,0.,cuv.y)*(0.5+0.7*f)*uAmt;
    float r=uCell*0.5*sqrt(clamp(v,0.,1.));
    float dd=length(px-c);
    float a=smoothstep(r+0.7,r-0.7,dd);
    vec3 paper=vec3(0.961);
    vec3 blue=mix(vec3(0.62,0.77,1.0),vec3(0.06,0.5,1.0),clamp(v*1.2,0.,1.));
    vec3 col=mix(paper,blue,a);
    col=mix(col,mix(paper,vec3(0.84,0.9,1.),0.6),smoothstep(0.34,0.,cuv.y)*0.35*uAmt*(1.-a));
    gl_FragColor=vec4(col,1.);
  }`;
})();
