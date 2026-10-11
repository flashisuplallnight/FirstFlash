/* mac-web: Safari (Sonoma), YouTube pages (dark theme) and procedural lofi illustrations.
   Everything is built once; animated parts expose render(t, state). Namespace E.Mac. */
(function () {
  const E = window.E;
  const M = (E.Mac = E.Mac || {});
  const TAU = Math.PI * 2;

  /* =====================================================================================
     LOFI ILLUSTRATIONS (canvas 2D)
     Each scene is drawn in a 1600×900 design space and cover-fitted into any w×h.
     Static layers are rendered once per (variant, size) into cached canvases; only the
     animated layers (rain, steam, lamp flicker, head bob …) are drawn per frame.
     ===================================================================================== */
  const AW = 1600, AH = 900;
  const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const A = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixH = (h1, h2, t) => { const a = hexRGB(h1), b = hexRGB(h2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`; };
  const lin = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of st) g.addColorStop(o, col); return g; };
  const rad = (c, x, y, r, st, r0 = 0, x0 = x, y0 = y) => { const g = c.createRadialGradient(x0, y0, r0, x, y, r); for (const [o, col] of st) g.addColorStop(o, col); return g; };
  const glow = (c, x, y, r, col, a = 1, op = "lighter", sy = 1) => {
    if (a <= 0.002) return;
    c.save(); c.globalCompositeOperation = op; c.globalAlpha = Math.min(1, a);
    if (sy !== 1) { c.translate(x, y); c.scale(1, sy); c.translate(-x, -y); }
    c.fillStyle = rad(c, x, y, r, [[0, A(col, 1)], [0.18, A(col, 0.55)], [0.45, A(col, 0.18)], [0.75, A(col, 0.05)], [1, A(col, 0)]]);
    c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };
  const P2 = new Map();
  const path = (d) => { let p = P2.get(d); if (!p) { p = new Path2D(d); P2.set(d, p); } return p; };
  const fillP = (c, d, style) => { c.fillStyle = style; c.fill(path(d)); };
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const mk = (w, h) => { const cv = document.createElement("canvas"); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h)); return cv; };
  const smooth = (x) => x * x * (3 - 2 * x);
  const HALF = () => 0.5;
  /* software (CPU) canvases: far faster than swiftshader-GL canvases in the headless renderer */
  const CTX = { willReadFrequently: true };
  const mixA = (h1, h2, t, a) => { const p = hexRGB(h1), q = hexRGB(h2); return `rgba(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(",")},${a})`; };
  /* deterministic value noise 1D (for flicker / sway) */
  const vn = (x, seed = 0) => { const i = Math.floor(x), f = x - i; return E.lerp(E.hash(i + seed * 57.3), E.hash(i + 1 + seed * 57.3), smooth(f)); };

  /* film grain tile (deterministic) */
  let grainTile = null;
  const grainCanvas = () => {
    if (grainTile) return grainTile;
    grainTile = mk(256, 256);
    const g = grainTile.getContext("2d", CTX), id = g.createImageData(256, 256), r = E.rng(77);
    for (let i = 0; i < id.data.length; i += 4) { const v = 96 + r() * 64 + (r() - 0.5) * 60; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
    return grainTile;
  };
  /* finishing pass in pixel space: grain + vignette */
  const finish = (c, { grain = 0.14, vig = 0.45, vigCol = "#0a0614" } = {}) => {
    const cw = c.canvas.width, ch = c.canvas.height;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (vig > 0) {
      const R = Math.hypot(cw, ch) / 2;
      c.fillStyle = rad(c, cw / 2, ch / 2, R, [[0, A(vigCol, 0)], [0.55, A(vigCol, 0)], [0.85, A(vigCol, vig * 0.55)], [1, A(vigCol, vig)]]);
      c.fillRect(0, 0, cw, ch);
    }
    if (grain > 0) {
      c.globalCompositeOperation = "overlay"; c.globalAlpha = grain;
      const pat = c.createPattern(grainCanvas(), "repeat");
      const k = Math.max(1, cw / 1100);
      c.scale(k, k); c.fillStyle = pat; c.fillRect(0, 0, cw / k, ch / k);
    }
    c.restore();
  };

  /* ---------- shared drawing pieces ---------- */
  const skyline = (c, R, o) => {
    let x = o.x0;
    const out = [];
    while (x < o.x1) {
      const w = o.wMin + R() * (o.wMax - o.wMin);
      const h = o.hMin + Math.pow(R(), o.pow || 1) * (o.hMax - o.hMin);
      const top = o.base - h;
      c.fillStyle = o.color;
      c.fillRect(x, top, w + 1.5, h + 2);
      const k = R();
      if (k < 0.22) c.fillRect(x + w * 0.2, top - h * 0.08, w * 0.55, h * 0.08 + 1);
      else if (k < 0.34) { c.beginPath(); c.moveTo(x, top); c.lineTo(x + w / 2, top - w * 0.35); c.lineTo(x + w + 1.5, top); c.fill(); }
      else if (k < 0.42) { c.fillRect(x + w * 0.45, top - h * 0.25, Math.max(2, w * 0.05), h * 0.25); out.push([x + w * 0.47, top - h * 0.25]); }
      if (o.rim) { c.fillStyle = o.rim; c.fillRect(x, top, w + 1.5, Math.max(1, o.rimW || 1.5)); }
      if (o.lit > 0) {
        const ww = o.win[0], wh = o.win[1], gx = o.gap[0], gy = o.gap[1];
        const cols = Math.floor((w - 8) / (ww + gx));
        const x0 = x + (w - cols * (ww + gx) + gx) / 2;
        const floorLit = R() < 0.5;
        for (let wy = top + 10; wy < o.base - wh - 4; wy += wh + gy) {
          const rowOn = R() < (floorLit ? 0.9 : 0.6);
          for (let i = 0; i < cols; i++) {
            if (!rowOn || R() > o.lit) continue;
            c.globalAlpha = 0.45 + R() * 0.55;
            c.fillStyle = o.litCols[Math.floor(R() * o.litCols.length)];
            c.fillRect(x0 + i * (ww + gx), wy, ww, wh);
          }
        }
        c.globalAlpha = 1;
      }
      x += w + (R() < 0.3 ? R() * 10 : 0);
    }
    return out;
  };
  const pine = (c, x, base, h, w, col, R, rough = 1) => {
    const tiers = Math.max(4, Math.round(h / 34));
    const pts = [];
    for (let i = 0; i <= tiers; i++) {
      const f = i / tiers;
      const yy = base - h + h * 0.92 * f + (i ? 0 : 0);
      const ww = (w / 2) * (0.12 + 0.88 * Math.pow(f, 0.9)) * (0.9 + R() * 0.2 * rough);
      pts.push([x + ww, yy + h * 0.035, x + ww * 0.42, yy + h * 0.035 - h * 0.02]);
    }
    c.fillStyle = col;
    c.beginPath(); c.moveTo(x, base - h);
    for (const p of pts) { c.lineTo(p[0], p[1]); c.lineTo(p[2], p[3] + h * 0.035); }
    c.lineTo(x + w * 0.06, base); c.lineTo(x - w * 0.06, base);
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; c.lineTo(x - (p[2] - x), p[3] + h * 0.035); c.lineTo(x - (p[0] - x), p[1]); }
    c.closePath(); c.fill();
  };
  const leaf = (c, x, y, len, wid, ang, col, vein) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.8, len, 0);
    c.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.3, wid, 0, 0);
    c.fillStyle = col; c.fill();
    if (vein) { c.strokeStyle = vein; c.lineWidth = Math.max(1, wid * 0.08); c.beginPath(); c.moveTo(len * 0.05, 0); c.quadraticCurveTo(len * 0.5, -wid * 0.08, len * 0.92, 0); c.stroke(); }
    c.restore();
  };
  const stars = (c, R, n, x0, y0, x1, y1, col = "#ffffff", maxR = 1.8) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + R() * (x1 - x0), y = y0 + Math.pow(R(), 1.4) * (y1 - y0), r = 0.5 + Math.pow(R(), 3) * maxR;
      c.globalAlpha = 0.25 + R() * 0.7; c.fillStyle = col;
      ell(c, x, y, r, r); c.fill();
      if (r > 1.4) glow(c, x, y, r * 7, col, 0.35);
    }
    c.globalAlpha = 1;
  };
  const moon = (c, x, y, r, col = "#fff3dc", glowCol = "#c9b6ff", ga = 0.6) => {
    glow(c, x, y, r * 7, glowCol, ga * 0.55);
    glow(c, x, y, r * 2.6, col, ga * 0.5);
    c.fillStyle = rad(c, x - r * 0.3, y - r * 0.3, r * 1.3, [[0, col], [0.7, mixH(col, "#d9c7e8", 0.3)], [1, mixH(col, "#b9a7d8", 0.5)]]);
    ell(c, x, y, r, r); c.fill();
    c.globalAlpha = 0.12; c.fillStyle = "#8a7aa8";
    for (const [dx, dy, rr2] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.42, 0.12], [0.38, -0.35, 0.09]]) { ell(c, x + dx * r, y + dy * r, rr2 * r, rr2 * r); c.fill(); }
    c.globalAlpha = 1;
  };
  /* steam: soft wisps rising from (x, y) */
  const steam = (c, x, y, t, { h = 120, w = 26, a = 0.22, n = 3, col = "#ffffff", seed = 1 } = {}) => {
    c.save(); c.lineCap = "round";
    for (let k = 0; k < n; k++) {
      const ph = (t * 0.32 + k / n + E.hash(seed + k) * 0.3) % 1;
      const yy = y - ph * h * 0.35;
      c.beginPath();
      for (let i = 0; i <= 18; i++) {
        const f = i / 18;
        const px = x + (k - (n - 1) / 2) * w * 0.35 + Math.sin(f * 5.2 + t * 1.7 + k * 2.1) * w * (0.25 + f * 0.6) + Math.sin(f * 2.1 - t * 0.9 + k) * w * 0.3;
        const py = yy - f * h;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      const g = c.createLinearGradient(0, yy, 0, yy - h);
      const env = Math.sin(ph * Math.PI);
      g.addColorStop(0, A(col, 0)); g.addColorStop(0.2, A(col, a * env)); g.addColorStop(0.6, A(col, a * 0.6 * env)); g.addColorStop(1, A(col, 0));
      c.strokeStyle = g; c.lineWidth = w * 0.42; c.stroke();
      c.lineWidth = w * 0.16; c.stroke();
    }
    c.restore();
  };
  /* rain falling outside: slanted streaks inside a clip rect */
  const rainFall = (c, drops, t, x0, y0, w, h, { col = "#cfc8ff", a = 0.28, slant = 0.18, len = 34, speed = 900, lw = 1.4 } = {}) => {
    c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    c.strokeStyle = A(col, a); c.lineWidth = lw; c.lineCap = "round";
    c.beginPath();
    for (const d of drops) {
      const sp = speed * (0.7 + d[2] * 0.6);
      const yy = y0 + ((d[1] * (h + len) + t * sp) % (h + len)) - len;
      const xx = x0 + ((d[0] * w + yy * slant) % w + w) % w;
      const l = len * (0.6 + d[2] * 0.8);
      c.moveTo(xx, yy); c.lineTo(xx + l * slant, yy + l);
    }
    c.stroke(); c.restore();
  };
  /* raindrops sliding down glass */
  const glassDrops = (c, drops, t, x0, y0, w, h, { col = "#ffffff", tint = "#2a1f4a", scale = 1 } = {}) => {
    c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    for (const d of drops) {
      const sp = 22 + d[2] * 60;
      // stick-slip motion: drops pause then slide
      const tt = t * sp + d[3] * 400;
      const slide = Math.floor(tt / 60) * 60 * 0.35 + smooth((tt % 60) / 60) * 60 * 0.65;
      const yy = y0 + ((d[1] * h + slide * scale) % (h + 40)) - 20;
      const xx = x0 + d[0] * w + Math.sin(yy * 0.03 + d[3] * 9) * 3 * scale;
      const r = (2.2 + d[2] * 3.4) * scale;
      // trail
      c.strokeStyle = A(col, 0.08); c.lineWidth = r * 0.9; c.lineCap = "round";
      c.beginPath(); c.moveTo(xx, yy - r); c.lineTo(xx - Math.sin(d[3] * 5) * 2, yy - r - (14 + d[2] * 50) * scale); c.stroke();
      c.fillStyle = A(tint, 0.35); ell(c, xx, yy + r * 0.15, r, r * 1.15); c.fill();
      c.fillStyle = A(col, 0.55); ell(c, xx - r * 0.25, yy - r * 0.3, r * 0.38, r * 0.38); c.fill();
      c.fillStyle = A(col, 0.18); ell(c, xx + r * 0.2, yy + r * 0.45, r * 0.6, r * 0.35); c.fill();
    }
    c.restore();
  };
  const staticDroplets = (c, R, n, x0, y0, w, h, scale = 1) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + R() * w, y = y0 + R() * h, r = (0.6 + Math.pow(R(), 2.2) * 2.6) * scale;
      c.fillStyle = "rgba(10,6,24,.22)"; ell(c, x, y + r * 0.2, r, r * 1.1); c.fill();
      c.fillStyle = "rgba(255,255,255,.32)"; ell(c, x - r * 0.25, y - r * 0.3, r * 0.4, r * 0.4); c.fill();
    }
  };
  const book = (c, x, y, w, h, col, { pages = "#efe3cc", band = null, slant = 0 } = {}) => {
    c.save(); c.translate(x, y); c.rotate(slant);
    c.fillStyle = col; rr(c, 0, 0, w, h, 3); c.fill();
    c.fillStyle = "rgba(255,255,255,.14)"; c.fillRect(2, 1, w - 4, Math.max(1.5, h * 0.12));
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(2, h - Math.max(2, h * 0.16), w - 4, Math.max(2, h * 0.16));
    c.fillStyle = pages; c.fillRect(w - 5, 2, 4, h - 4);
    if (band) { c.fillStyle = band; c.fillRect(w * 0.18, 2, w * 0.05, h - 4); c.fillRect(w * 0.72, 2, w * 0.04, h - 4); }
    c.restore();
  };
  const mug = (c, x, y, w, h, col, shade, { handle = true, coffee = "#3a2219", light = 1 } = {}) => {
    c.save();
    if (handle) { c.strokeStyle = shade; c.lineWidth = w * 0.13; ell(c, x + w * 0.52, y + h * 0.45, w * 0.22, h * 0.24); c.stroke(); }
    c.fillStyle = lin(c, x - w / 2, 0, x + w / 2, 0, [[0, mixH(col, "#ffd9b0", 0.35 * light)], [0.45, col], [1, shade]]);
    c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y + h - w * 0.12); c.quadraticCurveTo(x - w / 2, y + h, x - w / 2 + w * 0.15, y + h);
    c.lineTo(x + w / 2 - w * 0.15, y + h); c.quadraticCurveTo(x + w / 2, y + h, x + w / 2, y + h - w * 0.12); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
    c.fillStyle = mixH(col, "#ffffff", 0.25); ell(c, x, y, w / 2, w * 0.14); c.fill();
    c.fillStyle = coffee; ell(c, x, y + w * 0.02, w * 0.43, w * 0.1); c.fill();
    c.restore();
  };

  /* ------------------------------------------------------------------ scenes */
  const SCENES = [];

  /* 0 — hero: someone in headphones writing at a desk by a big window, night city, warm lamp, cat, plants */
  SCENES[0] = () => {
    const R = E.rng(4242);
    const WX = 92, WY = 52, WW = 1088, WH = 560; // window opening (glass)
    const SILL = WY + WH + 6;
    const DESK = 676;
    const LAMP = { x: 430, y: 540 };
    const rain = Array.from({ length: 170 }, () => [R(), R(), R()]);
    const drops = Array.from({ length: 46 }, () => [R(), R(), R(), R()]);
    const lights = Array.from({ length: 40 }, () => [WX + R() * WW, WY + 300 + R() * 220, R(), R() < 0.5 ? "#ffcf8a" : R() < 0.5 ? "#7ff0e1" : "#ff9fc4"]);
    let towers = [];
    const P = {}; // person geometry
    P.nx = 1268; P.ny = 610;
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          // wall
          c.fillStyle = lin(c, 0, 0, 0, AH, [[0, "#241a45"], [0.6, "#2b1f4c"], [1, "#1a1231"]]);
          c.fillRect(0, 0, AW, AH);
          // window glass: sky
          c.save(); c.beginPath(); c.rect(WX, WY, WW, WH); c.clip();
          c.fillStyle = lin(c, 0, WY, 0, WY + WH, [[0, "#151845"], [0.32, "#2a2565"], [0.58, "#5b3b88"], [0.78, "#a2569a"], [0.92, "#e47c86"], [1, "#f39a7e"]]);
          c.fillRect(WX, WY, WW, WH);
          stars(c, R, 120, WX, WY, WX + WW, WY + 260, "#fff6e8", 1.6);
          moon(c, 905, 168, 44, "#fff1d8", "#d1b8ff", 0.75);
          // thin clouds
          c.save(); c.filter = "blur(10px)";
          for (let i = 0; i < 6; i++) { c.fillStyle = A(i % 2 ? "#8f6fc4" : "#c08ad0", 0.18 + R() * 0.12); ell(c, WX + R() * WW, WY + 110 + R() * 180, 120 + R() * 220, 10 + R() * 12); c.fill(); }
          c.restore();
          // far skyline
          skyline(c, R, { x0: WX - 20, x1: WX + WW + 20, base: WY + WH + 10, hMin: 120, hMax: 230, wMin: 30, wMax: 80, color: "#6a4790", lit: 0.12, litCols: ["#f7b98f", "#e9a6c8"], win: [3, 4], gap: [4, 6] });
          c.fillStyle = lin(c, 0, WY + 330, 0, WY + WH, [[0, "rgba(240,140,140,0)"], [1, "rgba(240,140,140,.35)"]]);
          c.fillRect(WX, WY + 330, WW, WH - 330);
          // mid skyline
          towers = skyline(c, R, { x0: WX - 30, x1: WX + WW + 30, base: WY + WH + 10, hMin: 90, hMax: 300, pow: 1.6, wMin: 50, wMax: 120, color: "#3a2a68", rim: "rgba(255,160,170,.25)", lit: 0.38, litCols: ["#ffcf8a", "#ffb36b", "#7ff0e1", "#ff9fc4", "#fff0c4"], win: [5, 7], gap: [5, 7] });
          c.fillStyle = lin(c, 0, WY + 380, 0, WY + WH, [[0, "rgba(170,90,150,0)"], [1, "rgba(170,90,150,.4)"]]);
          c.fillRect(WX, WY + 380, WW, WH - 380);
          // near skyline + landmark tower
          c.fillStyle = "#211843";
          c.fillRect(640, WY + 120, 64, WH); c.fillRect(656, WY + 70, 32, 60); c.fillRect(670, WY + 10, 4, 64);
          skyline(c, R, { x0: WX - 40, x1: WX + WW + 40, base: WY + WH + 10, hMin: 50, hMax: 190, pow: 1.3, wMin: 70, wMax: 150, color: "#211843", rim: "rgba(255,190,150,.18)", lit: 0.5, litCols: ["#ffd08f", "#ffb36b", "#80f2e3", "#ffa3c8", "#fff4d6"], win: [7, 9], gap: [6, 8] });
          for (let i = 0; i < 9; i++) { c.globalAlpha = 0.7; c.fillStyle = i % 3 ? "#ffd08f" : "#80f2e3"; c.fillRect(650 + (i % 3) * 18, WY + 140 + Math.floor(i / 3) * 26, 8, 12); }
          c.globalAlpha = 1;
          // city light bloom
          for (let i = 0; i < 14; i++) glow(c, WX + R() * WW, WY + WH - 40 - R() * 140, 60 + R() * 90, R() < 0.5 ? "#ff9f7a" : "#c070ff", 0.18);
          // glass sheen + static droplets
          c.fillStyle = lin(c, WX, WY, WX + WW, WY + WH, [[0, "rgba(255,255,255,0)"], [0.42, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,.06)"], [0.6, "rgba(255,255,255,0)"]]);
          c.fillRect(WX, WY, WW, WH);
          staticDroplets(c, R, 260, WX, WY, WW, WH, 1.1);
          c.restore();
        } },
        { a(c, t) {
          rainFall(c, rain, t, WX, WY, WW, WH, { col: "#d8ccff", a: 0.22, slant: 0.12, len: 30, speed: 700, lw: 1.3 });
          glassDrops(c, drops, t, WX, WY, WW, WH, { tint: "#1b1238", scale: 1.25 });
          // twinkling windows + aircraft light on the landmark
          for (const L of lights) { const on = vn(t * 0.6 + L[2] * 40, 3) > 0.62; if (on) { c.fillStyle = L[3]; c.globalAlpha = 0.85; c.fillRect(L[0], L[1], 5, 7); glow(c, L[0] + 2, L[1] + 3, 16, L[3], 0.35); } }
          c.globalAlpha = 1;
          const blink = (t % 1.6) < 0.18 ? 1 : 0.15;
          glow(c, 672, WY + 8, 30, "#ff4d5e", 0.9 * blink); c.fillStyle = A("#ff6070", 0.4 + blink * 0.6); ell(c, 672, WY + 8, 3.5, 3.5); c.fill();
        } },
        { s(c) {
          // lamp light spill on the wall (warm, from lower left)
          glow(c, LAMP.x + 40, LAMP.y + 120, 900, "#ff8a4a", 0.32);
          glow(c, LAMP.x + 40, LAMP.y + 100, 420, "#ffb070", 0.28);
          // window frame
          const fr = "#1c1436";
          c.fillStyle = fr;
          c.fillRect(WX - 26, WY - 26, WW + 52, 26); c.fillRect(WX - 26, WY - 26, 26, WH + 40); c.fillRect(WX + WW, WY - 26, 26, WH + 40);
          const mul = [WX + WW / 3, WX + (2 * WW) / 3];
          for (const mx of mul) c.fillRect(mx - 8, WY, 16, WH);
          c.fillRect(WX, WY + 190, WW, 14);
          // warm rim light on frame edges facing the lamp
          c.fillStyle = lin(c, 0, 0, WX + WW, 0, [[0, "rgba(255,150,100,.55)"], [0.5, "rgba(255,150,100,.22)"], [1, "rgba(255,150,100,.06)"]]);
          for (const mx of mul) c.fillRect(mx - 8, WY, 2.5, WH);
          c.fillRect(WX - 2.5, WY, 2.5, WH); c.fillRect(WX, WY + 204, WW, 2);
          c.fillStyle = "rgba(200,170,255,.15)"; for (const mx of mul) c.fillRect(mx + 6, WY, 2, WH);
          // sill
          c.fillStyle = lin(c, 0, SILL - 6, 0, SILL + 26, [[0, "#6d4566"], [0.3, "#4a2f52"], [1, "#2a1b3a"]]);
          c.fillRect(WX - 50, SILL - 8, WW + 100, 22);
          c.fillStyle = "#1e1430"; c.fillRect(WX - 50, SILL + 14, WW + 100, 12);
          c.fillStyle = lin(c, WX, 0, WX + WW, 0, [[0, "rgba(255,170,110,.5)"], [0.6, "rgba(255,170,110,.1)"], [1, "rgba(255,170,110,0)"]]);
          c.fillRect(WX - 50, SILL - 8, WW + 100, 3);
          // wall under the sill
          c.fillStyle = lin(c, 0, SILL + 26, 0, DESK, [[0, "#1d1434"], [1, "#2a1d44"]]); c.fillRect(0, SILL + 26, AW, DESK - SILL - 26);
          // sill plants: snake plant in a terracotta pot (left) + trailing pothos (right)
          const potX = 180;
          for (let i = 0; i < 9; i++) {
            const a = -Math.PI / 2 + (i - 4) * 0.13 + (R() - 0.5) * 0.08, len = 120 + R() * 110;
            leaf(c, potX + (i - 4) * 5, SILL - 40, len, 13 + R() * 6, a, i % 2 ? "#1f4f4f" : "#2a6157", "rgba(150,230,200,.18)");
          }
          c.fillStyle = lin(c, potX - 46, 0, potX + 46, 0, [[0, "#f0905c"], [0.5, "#c4603e"], [1, "#6e3036"]]);
          c.beginPath(); c.moveTo(potX - 46, SILL - 64); c.lineTo(potX + 46, SILL - 64); c.lineTo(potX + 36, SILL - 6); c.lineTo(potX - 36, SILL - 6); c.closePath(); c.fill();
          c.fillStyle = "#e68a5a"; c.fillRect(potX - 50, SILL - 70, 100, 12);
          // books + candle on sill right
          book(c, 960, SILL - 30, 150, 22, "#2f6f7a"); book(c, 972, SILL - 52, 128, 22, "#d9774a"); book(c, 966, SILL - 70, 136, 18, "#5d3f86");
          // cat sitting on the sill looking out (back view)
          const cx = 800, cy = SILL - 8;
          const cat = `M${cx - 58} ${cy} C${cx - 66} ${cy - 50} ${cx - 50} ${cy - 92} ${cx - 34} ${cy - 108} C${cx - 44} ${cy - 128} ${cx - 42} ${cy - 150} ${cx - 30} ${cy - 162} L${cx - 34} ${cy - 196} L${cx - 10} ${cy - 172} C${cx} ${cy - 175} ${cx + 8} ${cy - 175} ${cx + 16} ${cy - 172} L${cx + 40} ${cy - 194} L${cx + 36} ${cy - 160} C${cx + 48} ${cy - 146} ${cx + 46} ${cy - 124} ${cx + 34} ${cy - 108} C${cx + 54} ${cy - 92} ${cx + 70} ${cy - 50} ${cx + 62} ${cy} Z`;
          fillP(c, cat, "#140d26");
          c.save(); c.clip(path(cat));
          c.fillStyle = "rgba(220,180,255,.35)"; c.fill(path(cat)); c.globalCompositeOperation = "source-atop";
          c.fillStyle = "#140d26"; c.translate(5, 6); c.fill(path(cat));
          c.restore();
          c.save(); c.clip(path(cat)); glow(c, cx - 120, cy - 60, 140, "#ff9a5a", 0.4); c.restore();
          // desk
          c.fillStyle = lin(c, 0, DESK, 0, AH, [[0, "#4a2c3e"], [0.25, "#6a3a40"], [1, "#2a1828"]]);
          c.fillRect(0, DESK, AW, AH - DESK);
          c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(0, DESK, AW, 4);
          c.fillStyle = "rgba(255,180,130,.25)"; c.fillRect(0, DESK + 4, AW, 2);
          // wood grain
          c.strokeStyle = "rgba(20,8,20,.18)"; c.lineWidth = 2;
          for (let i = 0; i < 14; i++) { const y = DESK + 18 + i * 17 + R() * 6; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(500, y + (R() - 0.5) * 10, 1100, y + (R() - 0.5) * 10, AW, y + (R() - 0.5) * 6); c.stroke(); }
          glow(c, LAMP.x + 120, DESK + 90, 520, "#ff9a5a", 0.55, "lighter", 0.35);
          // stacked books on desk (left)
          book(c, 70, DESK + 44, 230, 34, "#2c5f6e"); book(c, 86, DESK + 14, 200, 32, "#b8573e"); book(c, 78, DESK - 12, 214, 28, "#e9d6b0", { pages: "#fff3dc" });
          // lamp: base, arms, shade
          c.fillStyle = lin(c, LAMP.x - 90, 0, LAMP.x + 60, 0, [[0, "#1a2f3a"], [0.6, "#24485a"], [1, "#11202a"]]);
          ell(c, LAMP.x - 20, DESK + 70, 74, 18); c.fill();
          c.strokeStyle = "#1f3d4c"; c.lineCap = "round"; c.lineWidth = 11;
          c.beginPath(); c.moveTo(LAMP.x - 20, DESK + 64); c.lineTo(LAMP.x - 80, LAMP.y + 10); c.lineTo(LAMP.x - 10, LAMP.y - 60); c.stroke();
          c.strokeStyle = "rgba(255,170,110,.6)"; c.lineWidth = 3;
          c.beginPath(); c.moveTo(LAMP.x - 16, DESK + 64); c.lineTo(LAMP.x - 76, LAMP.y + 10); c.lineTo(LAMP.x - 6, LAMP.y - 60); c.stroke();
          c.fillStyle = "#24485a"; ell(c, LAMP.x - 80, LAMP.y + 10, 10, 10); c.fill();
          // shade (cone opening down-right)
          c.save(); c.translate(LAMP.x + 10, LAMP.y - 50); c.rotate(0.62);
          c.fillStyle = lin(c, -70, 0, 70, 0, [[0, "#2f7f86"], [0.55, "#1f5a66"], [1, "#123844"]]);
          c.beginPath(); c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(72, 50); c.lineTo(-72, 50); c.closePath(); c.fill();
          c.fillStyle = "rgba(160,240,230,.35)"; c.fillRect(-24, -40, 48, 4);
          c.fillStyle = rad(c, 0, 50, 72, [[0, "#fff6d8"], [0.4, "#ffd38a"], [1, "#e0763c"]]); ell(c, 0, 50, 72, 16); c.fill();
          c.restore();
          // mug
          mug(c, 640, DESK + 40, 66, 74, "#ece4f6", "#8b7aa8", { coffee: "#3b2318" });
          c.fillStyle = "rgba(0,0,0,.25)"; ell(c, 646, DESK + 116, 42, 8); c.fill();
          // pencil cup + pencils
          c.fillStyle = "#e5ad57"; c.fillRect(530, DESK + 6, 6, 70); c.fillStyle = "#6fd0c4"; c.fillRect(546, DESK - 4, 6, 80); c.fillStyle = "#ff8fae"; c.fillRect(558, DESK + 10, 6, 66);
          c.fillStyle = lin(c, 520, 0, 580, 0, [[0, "#3c6f78"], [1, "#163844"]]); c.fillRect(520, DESK + 30, 58, 70);
          // open notebook (perspective)
          c.fillStyle = "#3a2030"; c.beginPath(); c.moveTo(800, DESK + 62); c.lineTo(1150, DESK + 50); c.lineTo(1180, DESK + 150); c.lineTo(760, DESK + 166); c.closePath(); c.fill();
          c.fillStyle = lin(c, 780, 0, 1170, 0, [[0, "#ffe2c0"], [0.5, "#f6d4b4"], [1, "#d8b8a8"]]);
          c.beginPath(); c.moveTo(806, DESK + 56); c.lineTo(1146, DESK + 44); c.lineTo(1172, DESK + 140); c.lineTo(768, DESK + 156); c.closePath(); c.fill();
          c.strokeStyle = "rgba(120,80,110,.35)"; c.lineWidth = 2;
          c.beginPath(); c.moveTo(975, DESK + 50); c.lineTo(968, DESK + 148); c.stroke();
          c.strokeStyle = "rgba(90,110,180,.28)"; c.lineWidth = 1.5;
          for (let i = 1; i < 7; i++) { const f = i / 7; c.beginPath(); c.moveTo(E.lerp(806, 768, f) + 8, E.lerp(DESK + 56, DESK + 156, f)); c.lineTo(E.lerp(975, 968, f) - 6, E.lerp(DESK + 50, DESK + 148, f)); c.stroke(); }
          c.strokeStyle = "rgba(60,40,70,.45)"; c.lineWidth = 2;
          for (let i = 1; i < 5; i++) { const f = i / 7; c.beginPath(); c.moveTo(E.lerp(806, 768, f) + 14, E.lerp(DESK + 56, DESK + 156, f) - 4); for (let k = 0; k < 8; k++) c.lineTo(E.lerp(806, 768, f) + 20 + k * 16 + R() * 6, E.lerp(DESK + 56, DESK + 156, f) - 4 - R() * 4); c.stroke(); }
          glow(c, 960, DESK + 100, 260, "#ffc890", 0.22, "lighter", 0.4);
          // succulent
          c.fillStyle = "#d77a4f"; c.fillRect(1430, DESK + 20, 74, 56);
          for (let i = 0; i < 7; i++) leaf(c, 1467, DESK + 22, 46 + R() * 22, 12, -Math.PI / 2 + (i - 3) * 0.42, i % 2 ? "#3f8f7a" : "#2f6f62", null);
        } },
        { a(c, t) {
          // lamp flicker: cone of light + bulb bloom
          const fl = 0.92 + 0.08 * vn(t * 9, 1) - (vn(t * 2.3, 5) > 0.93 ? 0.25 : 0);
          c.save(); c.globalCompositeOperation = "lighter";
          c.globalAlpha = 0.1 * fl;
          c.fillStyle = lin(c, LAMP.x, LAMP.y, LAMP.x + 240, DESK + 120, [[0, "#ffd9a0"], [1, "rgba(255,180,110,0)"]]);
          c.beginPath(); c.moveTo(LAMP.x + 10, LAMP.y - 30); c.lineTo(LAMP.x + 100, LAMP.y - 10); c.lineTo(LAMP.x + 420, DESK + 140); c.lineTo(LAMP.x - 80, DESK + 140); c.closePath(); c.fill();
          c.restore();
          glow(c, LAMP.x + 40, LAMP.y + 6, 120 * fl, "#fff0c8", 0.7 * fl);
          glow(c, LAMP.x + 40, LAMP.y + 6, 380, "#ffa45c", 0.25 * fl);
          // steam from the mug
          steam(c, 640, DESK + 30, t, { h: 150, w: 30, a: 0.2, n: 3, col: "#ffe9e0" });
          // cat tail hanging over the sill edge
          const sw = Math.sin(t * 1.3) * 0.5 + Math.sin(t * 0.7) * 0.3;
          c.strokeStyle = "#140d26"; c.lineWidth = 15; c.lineCap = "round";
          c.beginPath(); c.moveTo(850, SILL - 6); c.bezierCurveTo(880, SILL + 10, 870 + sw * 18, SILL + 40, 880 + sw * 30, SILL + 70); c.stroke();
          // ----- person (back view), head bobbing to the beat
          const bob = Math.sin(t * TAU * 0.72);
          const breath = Math.sin(t * 1.1) * 2;
          const write = Math.sin(t * 7.2) * 2.2 + Math.sin(t * 3.1) * 1.4;
          const nx = P.nx, ny = P.ny + breath;
          c.save(); c.translate(0, breath);
          // chair back
          c.fillStyle = lin(c, 1080, 0, 1480, 0, [[0, "#2a1a33"], [1, "#160d1e"]]);
          rr(c, 1090, 760, 360, 200, 40); c.fill();
          // left arm resting on desk toward the notebook
          fillP(c, "M1118 690 C1070 720 1030 770 1010 818 C998 846 1018 862 1046 852 C1076 840 1104 800 1140 772 Z", "#1e5f66");
          fillP(c, `M1022 820 C1030 800 1060 778 ${1092 + write * 0.4} ${764 + write * 0.2} L${1104 + write * 0.4} ${784 + write * 0.2} C1080 800 1050 834 1036 850 Z`, "#2a7a80");
          ell(c, 1100 + write * 0.4, 772 + write * 0.2, 16, 12, -0.5); c.fillStyle = "#e7a27c"; c.fill();
          // torso: hoodie
          const torso = "M1036 900 C1040 810 1062 718 1112 676 C1150 646 1196 628 1226 622 L1318 622 C1354 630 1404 650 1440 684 C1484 726 1504 812 1508 900 Z";
          fillP(c, torso, lin(c, 1036, 0, 1508, 0, [[0, "#2b8086"], [0.35, "#1f6670"], [1, "#123a48"]]));
          c.save(); c.clip(path(torso));
          glow(c, 980, 700, 260, "#ff9a5a", 0.5);
          c.strokeStyle = "rgba(10,20,30,.35)"; c.lineWidth = 3;
          c.beginPath(); c.moveTo(1272, 700); c.bezierCurveTo(1268, 760, 1276, 830, 1270, 900); c.stroke();
          c.beginPath(); c.moveTo(1180, 760); c.bezierCurveTo(1200, 790, 1230, 800, 1260, 800); c.stroke();
          c.fillStyle = "rgba(220,190,255,.18)"; c.fill(path("M1112 676 C1150 646 1196 628 1226 622 L1318 622 C1354 630 1404 650 1440 684 L1436 690 C1400 660 1350 640 1318 634 L1226 634 C1196 640 1150 656 1116 684 Z"));
          c.restore();
          // right elbow (writing arm) moving slightly
          fillP(c, `M1430 700 C1478 730 ${1500 + write} 790 ${1494 + write} 840 C${1488 + write} 866 1460 870 1446 850 L1420 760 Z`, "#173f4c");
          // hood bunched at the neck
          const hood = "M1176 660 C1172 618 1206 596 1270 594 C1336 596 1372 620 1366 662 C1356 694 1316 706 1270 706 C1222 706 1184 694 1176 660 Z";
          fillP(c, hood, lin(c, 1176, 0, 1366, 0, [[0, "#3a9399"], [0.5, "#256f78"], [1, "#164552"]]));
          c.strokeStyle = "rgba(8,24,32,.45)"; c.lineWidth = 3.5;
          c.beginPath(); c.moveTo(1196, 650); c.bezierCurveTo(1220, 676, 1320, 680, 1346, 650); c.stroke();
          c.restore();
          // head (rotates about the neck)
          c.save(); c.translate(nx, ny); c.rotate(0.03 + bob * 0.03); c.translate(0, bob * 3.5); c.translate(-nx, -ny);
          // neck
          c.fillStyle = "#9a5a5a"; rr(c, nx - 34, ny - 70, 66, 74, 18); c.fill();
          // hair mass
          const hx = nx - 6, hy = ny - 150;
          const hair = `M${hx - 92} ${hy + 30} C${hx - 104} ${hy - 50} ${hx - 52} ${hy - 104} ${hx + 6} ${hy - 104} C${hx + 74} ${hy - 104} ${hx + 108} ${hy - 50} ${hx + 98} ${hy + 22} C${hx + 94} ${hy + 70} ${hx + 70} ${hy + 104} ${hx + 40} ${hy + 112} C${hx + 18} ${hy + 120} ${hx - 22} ${hy + 120} ${hx - 44} ${hy + 112} C${hx - 76} ${hy + 100} ${hx - 92} ${hy + 72} ${hx - 92} ${hy + 30} Z`;
          // cheek + ear peeking on the left (head slightly turned toward the window)
          fillP(c, `M${hx - 86} ${hy + 10} C${hx - 112} ${hy + 30} ${hx - 108} ${hy + 86} ${hx - 70} ${hy + 104} L${hx - 50} ${hy + 60} Z`, "#e8a07e");
          fillP(c, hair, lin(c, hx - 100, hy - 100, hx + 100, hy + 110, [[0, "#3a2654"], [0.5, "#24173d"], [1, "#150c26"]]));
          // bun
          ell(c, hx + 40, hy - 104, 40, 36, 0.3); c.fillStyle = "#24173d"; c.fill();
          ell(c, hx + 30, hy - 116, 22, 12, 0.3); c.fillStyle = "rgba(190,160,255,.28)"; c.fill();
          // hair sheen & strands
          c.save(); c.clip(path(hair));
          c.strokeStyle = "rgba(190,160,255,.25)"; c.lineWidth = 7; c.lineCap = "round";
          c.beginPath(); c.arc(hx + 4, hy + 6, 88, -2.6, -1.25); c.stroke();
          c.strokeStyle = "rgba(10,4,20,.45)"; c.lineWidth = 2.5;
          for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(hx - 60 + i * 20, hy - 90 + Math.abs(i - 3) * 6); c.quadraticCurveTo(hx - 66 + i * 22, hy + 10, hx - 70 + i * 24, hy + 112); c.stroke(); }
          glow(c, hx - 150, hy + 40, 120, "#ff9a5a", 0.55);
          c.restore();
          // headphones: band + cups
          c.strokeStyle = "#1a1229"; c.lineWidth = 17; c.lineCap = "round";
          c.beginPath(); c.arc(hx + 2, hy + 12, 104, Math.PI * 1.07, Math.PI * 1.98); c.stroke();
          c.strokeStyle = "#f0874a"; c.lineWidth = 5;
          c.beginPath(); c.arc(hx + 2, hy + 12, 108, Math.PI * 1.12, Math.PI * 1.6); c.stroke();
          const cup = (x, y, rx, ry, rot, lit) => {
            ell(c, x, y, rx + 6, ry + 6, rot); c.fillStyle = "#1a1229"; c.fill();
            ell(c, x, y, rx, ry, rot); c.fillStyle = lin(c, x - rx, y - ry, x + rx, y + ry, [[0, lit], [1, "#a8452c"]]); c.fill();
            ell(c, x - rx * 0.25, y - ry * 0.35, rx * 0.35, ry * 0.2, rot - 0.4); c.fillStyle = "rgba(255,230,200,.45)"; c.fill();
          };
          cup(hx - 100, hy + 40, 26, 44, 0.12, "#ffb070");
          cup(hx + 104, hy + 30, 18, 40, -0.12, "#d86a3c");
          c.restore();
        } },
        { s(c) {
          // foreground: hanging pothos (top right), softly out of focus
          c.save(); c.filter = "blur(2.5px)";
          for (let v = 0; v < 5; v++) {
            const x0 = 1330 + v * 58, len = 220 + R() * 300;
            c.strokeStyle = "#0e2a2a"; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, -10); c.bezierCurveTo(x0 + 20, len * 0.3, x0 - 30, len * 0.6, x0 + 6, len); c.stroke();
            for (let k = 0; k < 9; k++) {
              const f = k / 9, yy = f * len, xx = x0 + Math.sin(f * 3 + v) * 18;
              leaf(c, xx, yy, 46 + R() * 22, 22, (k % 2 ? 0.6 : 2.5) + (R() - 0.5) * 0.5, k % 3 ? "#123a38" : "#1a4f48", "rgba(150,220,200,.12)");
            }
          }
          c.restore();
          // pot rim
          c.fillStyle = "#1a1229"; rr(c, 1340, -30, 260, 50, 20); c.fill();
          finish(c, { grain: 0.16, vig: 0.5 });
        } },
      ],
    };
  };

  /* 1 — rainy café window at night, neon sign, latte on the counter */
  SCENES[1] = () => {
    const R = E.rng(911);
    const drops = Array.from({ length: 60 }, () => [R(), R(), R(), R()]);
    const bokeh = Array.from({ length: 70 }, () => [R() * AW, 160 + R() * 520, 14 + Math.pow(R(), 1.6) * 70, ["#ffb36b", "#ff7a9a", "#6fe3d8", "#ffd27a", "#a98bff", "#ff9a4d"][Math.floor(R() * 6)], 0.18 + R() * 0.4, R()]);
    const CT = 640; // counter top
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          // street outside (blurred)
          c.fillStyle = lin(c, 0, 0, 0, AH, [[0, "#0d1b2e"], [0.5, "#16324a"], [0.8, "#203c50"], [1, "#0b1520"]]);
          c.fillRect(0, 0, AW, AH);
          c.save(); c.filter = "blur(7px)";
          skyline(c, R, { x0: -40, x1: AW + 40, base: 560, hMin: 200, hMax: 470, wMin: 140, wMax: 300, color: "#13243a", lit: 0.35, litCols: ["#ffcf8a", "#ffb36b", "#ff9fc4"], win: [18, 24], gap: [14, 18] });
          // shop fronts across the street
          for (let i = 0; i < 6; i++) { const x = i * 290 + R() * 60; c.fillStyle = A(["#ffb36b", "#ff7a9a", "#6fe3d8"][i % 3], 0.35); c.fillRect(x, 470, 180, 90); }
          c.fillStyle = "#0f1c2a"; c.fillRect(0, 560, AW, 120);
          // wet road reflections
          for (let i = 0; i < 18; i++) { c.fillStyle = A(["#ffb36b", "#ff7a9a", "#6fe3d8", "#ffd27a"][i % 4], 0.22); c.fillRect(R() * AW, 580, 14 + R() * 30, 70 + R() * 50); }
          c.restore();
          // street lamps
          for (const x of [260, 980, 1460]) { c.fillStyle = "#0a1422"; c.fillRect(x - 3, 180, 6, 400); glow(c, x, 180, 140, "#ffcf8a", 0.8); glow(c, x, 180, 380, "#ff9a4d", 0.25); }
          // bokeh
          for (const b of bokeh) {
            c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = b[4];
            c.fillStyle = rad(c, b[0], b[1], b[2], [[0, A(b[3], 0.55)], [0.75, A(b[3], 0.45)], [0.92, A(b[3], 0.7)], [1, A(b[3], 0)]]);
            ell(c, b[0], b[1], b[2], b[2]); c.fill(); c.restore();
          }
          // window glass fog at the bottom + droplets
          c.fillStyle = lin(c, 0, 420, 0, CT, [[0, "rgba(180,200,220,0)"], [1, "rgba(180,200,220,.18)"]]); c.fillRect(0, 420, AW, CT - 420);
          staticDroplets(c, R, 700, 0, 60, AW, CT - 60, 1.3);
          // mirrored neon sign hanging in the window: "coffee"
          c.save(); c.translate(560, 250); c.scale(-1, 1); c.rotate(0.02);
          c.font = "italic 600 150px Inter, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
          c.lineJoin = "round";
          c.filter = "blur(14px)"; c.strokeStyle = A("#ff5fa2", 0.9); c.lineWidth = 16; c.strokeText("coffee", 0, 0);
          c.filter = "blur(4px)"; c.strokeStyle = A("#ff7ab8", 0.9); c.lineWidth = 9; c.strokeText("coffee", 0, 0);
          c.filter = "none"; c.strokeStyle = "#ffd6ea"; c.lineWidth = 3.5; c.strokeText("coffee", 0, 0);
          c.font = "500 44px Inter, sans-serif";
          c.filter = "blur(8px)"; c.fillStyle = A("#6fe3d8", 0.9); c.fillText("OPEN", 130, 110);
          c.filter = "none"; c.strokeStyle = "#d8fffa"; c.lineWidth = 2; c.strokeText("OPEN", 130, 110);
          c.restore();
          // neon light washing the frame
          glow(c, 560, 250, 520, "#ff5fa2", 0.16);
        } },
        { a(c, t) {
          glassDrops(c, drops, t, 0, 60, AW, CT - 60, { tint: "#0a1424", scale: 1.6 });
          // a car's headlights sweeping across the street
          const u = ((t * 0.18) % 1);
          glow(c, -200 + u * 2200, 545, 120, "#fff2d0", 0.35 * Math.sin(u * Math.PI));
          glow(c, -260 + u * 2200, 548, 90, "#fff2d0", 0.25 * Math.sin(u * Math.PI));
        } },
        { s(c) {
          // window frame: top beam, mullion, sill
          c.fillStyle = lin(c, 0, 0, 0, 70, [[0, "#1a0f0c"], [1, "#2c1a14"]]); c.fillRect(0, 0, AW, 64);
          c.fillStyle = "rgba(255,170,110,.25)"; c.fillRect(0, 60, AW, 3);
          c.fillStyle = lin(c, 1060, 0, 1100, 0, [[0, "#3a2219"], [0.4, "#24140f"], [1, "#140a08"]]); c.fillRect(1062, 60, 34, CT - 60);
          // pendant lamp
          c.strokeStyle = "#0a0605"; c.lineWidth = 3; c.beginPath(); c.moveTo(1380, 0); c.lineTo(1380, 150); c.stroke();
          c.fillStyle = lin(c, 1300, 0, 1460, 0, [[0, "#2f5d55"], [0.5, "#1f4a44"], [1, "#0f2a26"]]);
          c.beginPath(); c.moveTo(1350, 150); c.lineTo(1410, 150); c.bezierCurveTo(1450, 165, 1470, 200, 1475, 226); c.lineTo(1285, 226); c.bezierCurveTo(1290, 200, 1310, 165, 1350, 150); c.fill();
          // counter
          c.fillStyle = lin(c, 0, CT - 14, 0, CT + 30, [[0, "#9a5a38"], [0.3, "#7a4429"], [1, "#4a2716"]]); c.fillRect(0, CT - 14, AW, 44);
          c.fillStyle = lin(c, 0, CT + 30, 0, AH, [[0, "#3a1f14"], [1, "#1a0d08"]]); c.fillRect(0, CT + 30, AW, AH - CT - 30);
          c.strokeStyle = "rgba(255,200,150,.12)"; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = CT - 10 + i * 8; c.beginPath(); c.moveTo(0, y); c.lineTo(AW, y + (R() - 0.5) * 4); c.stroke(); }
          glow(c, 1380, CT, 700, "#ffb36b", 0.35, "lighter", 0.3);
          // saucer + latte cup
          const cx = 700;
          c.fillStyle = "rgba(0,0,0,.35)"; ell(c, cx + 10, CT + 6, 150, 24); c.fill();
          c.fillStyle = lin(c, cx - 140, 0, cx + 140, 0, [[0, "#fff8f0"], [1, "#c9bdb5"]]); ell(c, cx, CT - 6, 140, 24); c.fill();
          c.fillStyle = "#e8ddd4"; ell(c, cx, CT - 10, 100, 16); c.fill();
          c.fillStyle = lin(c, cx - 90, 0, cx + 90, 0, [[0, "#ffffff"], [0.5, "#f1e9e2"], [1, "#b8aaa2"]]);
          c.beginPath(); c.moveTo(cx - 92, CT - 120); c.bezierCurveTo(cx - 92, CT - 40, cx - 70, CT - 12, cx, CT - 12); c.bezierCurveTo(cx + 70, CT - 12, cx + 92, CT - 40, cx + 92, CT - 120); c.closePath(); c.fill();
          c.strokeStyle = "#d9cec6"; c.lineWidth = 14; ell(c, cx + 112, CT - 82, 26, 30); c.stroke();
          c.fillStyle = "#f6efe8"; ell(c, cx, CT - 120, 92, 22); c.fill();
          c.fillStyle = "#a0623a"; ell(c, cx, CT - 118, 82, 17); c.fill();
          c.fillStyle = "#f3dcc0"; c.beginPath(); c.moveTo(cx, CT - 104); c.bezierCurveTo(cx - 40, CT - 122, cx - 22, CT - 136, cx, CT - 124); c.bezierCurveTo(cx + 22, CT - 136, cx + 40, CT - 122, cx, CT - 104); c.fill();
          // croissant on a plate
          const px = 1180;
          c.fillStyle = "rgba(0,0,0,.3)"; ell(c, px + 8, CT + 4, 130, 20); c.fill();
          c.fillStyle = lin(c, px - 120, 0, px + 120, 0, [[0, "#f6f0ea"], [1, "#bfb3aa"]]); ell(c, px, CT - 8, 124, 22); c.fill();
          for (let i = -3; i <= 3; i++) { c.fillStyle = lin(c, 0, CT - 70, 0, CT - 10, [[0, "#f1b260"], [1, "#a85e22"]]); ell(c, px + i * 22, CT - 34 - (3 - Math.abs(i)) * 6, 26 - Math.abs(i) * 2.5, 30 - Math.abs(i) * 4, i * 0.25); c.fill(); c.strokeStyle = "rgba(90,40,10,.35)"; c.lineWidth = 2; c.stroke(); }
          // small succulent
          c.fillStyle = "#c8c0d8"; c.fillRect(300, CT - 70, 80, 64);
          for (let i = 0; i < 8; i++) leaf(c, 340, CT - 70, 40 + R() * 20, 13, -Math.PI / 2 + (i - 3.5) * 0.38, i % 2 ? "#4f8f7a" : "#3a7262", null);
          // glass reflection of the pendant lamp
          glow(c, 1380, 360, 200, "#ffcf8a", 0.12);
          finish(c, { grain: 0.15, vig: 0.5, vigCol: "#05080f" });
        } },
        { a(c, t) {
          const fl = 0.95 + 0.05 * vn(t * 7, 2);
          glow(c, 1380, 232, 70 * fl, "#fff2cf", 0.85);
          glow(c, 1380, 300, 340, "#ffb36b", 0.3 * fl, "lighter", 0.55);
          steam(c, 700, CT - 130, t, { h: 170, w: 34, a: 0.2, n: 3, col: "#fff3ea", seed: 3 });
          // neon flicker: the sign dims for a few frames now and then
          const nf = vn(t * 3.1, 9) > 0.86 ? 0.4 : 0;
          if (nf) { c.fillStyle = A("#0d1b2e", nf * 0.5); c.fillRect(250, 150, 620, 230); }
        } },
      ],
    };
  };

  /* 2 — synthwave sunset: striped sun, neon grid, wireframe mountains, palms */
  SCENES[2] = () => {
    const R = E.rng(2077);
    const HZ = 560;
    const mtn = (seed, base, amp, n) => { const r = E.rng(seed); const pts = []; for (let i = 0; i <= n; i++) pts.push([(i / n) * (AW + 200) - 100, base - amp * (0.25 + r() * 0.75) * (i % 2 ? 1 : 0.55)]); return pts; };
    const far = mtn(5, HZ, 170, 14), near = mtn(9, HZ, 120, 9);
    const starsData = Array.from({ length: 90 }, () => [R() * AW, R() * 380, R()]);
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          c.fillStyle = lin(c, 0, 0, 0, HZ, [[0, "#0c0624"], [0.35, "#2a0d4a"], [0.65, "#7a1d6b"], [0.85, "#e8467a"], [1, "#ff9a4d"]]);
          c.fillRect(0, 0, AW, HZ);
          // sun with stripes
          const sx = 800, sy = 400, sr = 230;
          glow(c, sx, sy, 700, "#ff4f8b", 0.45);
          glow(c, sx, sy, 380, "#ffb35a", 0.4);
          c.save(); ell(c, sx, sy, sr, sr); c.clip();
          c.fillStyle = lin(c, 0, sy - sr, 0, sy + sr, [[0, "#fff27a"], [0.45, "#ffb347"], [0.75, "#ff5f7e"], [1, "#e0287a"]]);
          c.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
          c.globalCompositeOperation = "destination-out";
          for (let i = 0; i < 8; i++) { const y = sy + 10 + i * 28 + i * i * 1.6; c.fillRect(sx - sr, y, sr * 2, 4 + i * 2.4); }
          c.restore();
          // far mountains
          const drawM = (pts, col, rim) => {
            c.fillStyle = col; c.beginPath(); c.moveTo(-100, HZ); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(AW + 100, HZ); c.closePath(); c.fill();
            c.strokeStyle = rim; c.lineWidth = 2.5; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
            c.strokeStyle = A("#ff5fd2", 0.25); c.lineWidth = 1.2;
            for (let i = 1; i < pts.length - 1; i++) { c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i][0] + (pts[i][1] < pts[i - 1][1] ? -40 : 40), HZ); c.stroke(); }
          };
          drawM(far, "#2a0f4f", "#c04bff");
          drawM(near, "#170833", "#ff4fd8");
          // horizon haze
          c.fillStyle = lin(c, 0, HZ - 60, 0, HZ + 10, [[0, "rgba(255,90,170,0)"], [1, "rgba(255,90,170,.55)"]]); c.fillRect(0, HZ - 60, AW, 70);
          // ground
          c.fillStyle = lin(c, 0, HZ, 0, AH, [[0, "#2a0a3e"], [0.3, "#14062a"], [1, "#07020f"]]); c.fillRect(0, HZ, AW, AH - HZ);
          // vertical grid lines (static), converge at vanishing point
          c.strokeStyle = A("#ff4fd8", 0.75); c.lineWidth = 2;
          for (let i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(800 + i * 18, HZ); c.lineTo(800 + i * 260, AH + 40); c.stroke(); }
          glow(c, 800, HZ, 900, "#ff4fd8", 0.22, "lighter", 0.12);
        } },
        { a(c, t) {
          // stars twinkle
          for (const s of starsData) { const a = 0.3 + 0.7 * vn(t * 2 + s[2] * 50, 4); c.fillStyle = A("#ffe9ff", a * (1 - s[1] / 420)); c.fillRect(s[0], s[1], 2, 2); }
          // horizontal grid lines scrolling toward the viewer
          c.save(); c.globalCompositeOperation = "lighter";
          const ph = (t * 0.9) % 1;
          for (let k = 0; k < 16; k++) {
            const z = (k + 1 - ph) / 16;
            const y = HZ + Math.pow(1 - z, 2.4) * (AH - HZ + 40);
            const a = Math.pow(1 - z, 0.8);
            c.strokeStyle = A("#ff5fe0", 0.85 * a); c.lineWidth = 1 + 3 * (1 - z);
            c.beginPath(); c.moveTo(0, y); c.lineTo(AW, y); c.stroke();
          }
          c.restore();
        } },
        { s(c) {
          // palms
          const palm = (x, base, h, lean, s = 1) => {
            c.strokeStyle = "#08020f"; c.lineCap = "round";
            const tx = x + lean, ty = base - h;
            c.lineWidth = 16 * s; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, tx, ty); c.stroke();
            c.fillStyle = "#08020f";
            for (let i = 0; i < 8; i++) {
              const a = -Math.PI + (i / 7) * Math.PI + (R() - 0.5) * 0.2;
              const L = (130 + R() * 60) * s;
              c.beginPath(); c.moveTo(tx, ty);
              const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.35;
              c.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.7 - 30 * s, ex, ey);
              c.quadraticCurveTo(tx + Math.cos(a) * L * 0.45, ty + Math.sin(a) * L * 0.4 - 6 * s, tx, ty + 6 * s);
              c.fill();
            }
          };
          palm(140, AH + 20, 640, 70, 1.1); palm(300, AH + 30, 470, -40, 0.85);
          palm(1460, AH + 20, 600, -80, 1.05);
          // road
          c.fillStyle = A("#0a0316", 0.85); c.beginPath(); c.moveTo(790, HZ); c.lineTo(810, HZ); c.lineTo(1080, AH); c.lineTo(520, AH); c.closePath(); c.fill();
          c.strokeStyle = A("#00e5ff", 0.8); c.lineWidth = 3; c.beginPath(); c.moveTo(790, HZ); c.lineTo(520, AH); c.moveTo(810, HZ); c.lineTo(1080, AH); c.stroke();
          glow(c, 800, HZ, 260, "#00e5ff", 0.18, "lighter", 0.2);
          finish(c, { grain: 0.14, vig: 0.45, vigCol: "#05010a" });
        } },
        { a(c, t) {
          // road dashes moving
          c.fillStyle = A("#ffe27a", 0.9);
          const ph = (t * 0.9) % 1;
          for (let k = 0; k < 10; k++) {
            const z = (k + 1 - ph) / 10;
            const y = HZ + Math.pow(1 - z, 2.4) * (AH - HZ + 40);
            const y2 = HZ + Math.pow(1 - Math.min(1, z + 0.04), 2.4) * (AH - HZ + 40);
            const w = 2 + (y - HZ) * 0.03;
            c.beginPath(); c.moveTo(800 - w, y); c.lineTo(800 + w, y); c.lineTo(800 + w * 0.8, y2); c.lineTo(800 - w * 0.8, y2); c.fill();
          }
        } },
      ],
    };
  };

  /* 3 — night train window: moonlit valley passing by, poles whipping past, cup on the little table */
  SCENES[3] = () => {
    const R = E.rng(303);
    const WX = 250, WY = 120, WW = 1100, WH = 500;
    const drops = Array.from({ length: 70 }, () => [R(), R(), R(), R()]);
    // tileable strips (built once in pixel space by the layer that needs them)
    const hills = Array.from({ length: 40 }, (_, i) => [i / 40, R()]);
    const trees = Array.from({ length: 60 }, () => [R(), 0.5 + R() * 0.8, R()]);
    const houses = Array.from({ length: 16 }, () => [R(), R()]);
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          c.save(); c.beginPath(); c.roundRect(WX, WY, WW, WH, 70); c.clip();
          c.fillStyle = lin(c, 0, WY, 0, WY + WH, [[0, "#0b1030"], [0.45, "#1d2a5e"], [0.75, "#3b5a8a"], [1, "#2a3f66"]]);
          c.fillRect(WX, WY, WW, WH);
          stars(c, R, 110, WX, WY, WX + WW, WY + 260, "#eaf2ff", 1.7);
          moon(c, 1120, 230, 52, "#fff7e6", "#a8c8ff", 0.8);
          // far mountains (static)
          c.fillStyle = "#24346a"; c.beginPath(); c.moveTo(WX, WY + 380);
          for (let i = 0; i <= 12; i++) c.lineTo(WX + (i / 12) * WW, WY + 300 + Math.sin(i * 1.7) * 40 + R() * 40);
          c.lineTo(WX + WW, WY + WH); c.lineTo(WX, WY + WH); c.fill();
          c.fillStyle = lin(c, 0, WY + 300, 0, WY + 420, [[0, "rgba(140,170,230,0)"], [1, "rgba(140,170,230,.35)"]]); c.fillRect(WX, WY + 300, WW, 140);
          // lake with moon reflection
          c.fillStyle = lin(c, 0, WY + 400, 0, WY + WH, [[0, "#3d5a92"], [1, "#1c2b52"]]); c.fillRect(WX, WY + 400, WW, 100);
          for (let i = 0; i < 18; i++) { c.fillStyle = A("#fff3d8", 0.5 - i * 0.025); c.fillRect(1120 - 40 + R() * 20 - i, WY + 404 + i * 5, 50 + R() * 30 - i * 2, 2); }
          c.restore();
        } },
        { a(c, t) {
          c.save(); c.beginPath(); c.roundRect(WX, WY, WW, WH, 70); c.clip();
          // mid hills with farm lights (slow parallax)
          const off1 = (t * 60) % WW;
          c.fillStyle = "#121c3e";
          for (const sh of [-off1, WW - off1]) {
            c.beginPath(); c.moveTo(WX + sh, WY + WH);
            for (const h of hills) c.lineTo(WX + sh + h[0] * WW, WY + 400 + Math.sin(h[0] * TAU * 3) * 18 + h[1] * 14);
            c.lineTo(WX + sh + WW, WY + 412); c.lineTo(WX + sh + WW, WY + WH); c.fill();
            for (const hs of houses) { const x = WX + sh + hs[0] * WW, y = WY + 420 + hs[1] * 30; c.fillStyle = "#ffcf8a"; c.fillRect(x, y, 4, 3); glow(c, x + 2, y + 1, 12, "#ffb36b", 0.5); c.fillStyle = "#121c3e"; }
          }
          // near trees (fast)
          const off2 = (t * 520) % WW;
          for (const sh of [-off2, WW - off2]) for (const tr of trees) pine(c, WX + sh + tr[0] * WW, WY + WH + 10, 90 * tr[1], 50 * tr[1], "#070b1c", HALF, 0);
          // telegraph poles whipping past + wires
          const pp = (t * 1400) % 900;
          c.fillStyle = "#04060f";
          for (let k = -1; k < 3; k++) { const x = WX + k * 900 - pp + 500; c.fillRect(x, WY - 10, 16, WH + 20); c.fillRect(x - 40, WY + 60, 96, 8); }
          c.strokeStyle = "rgba(10,14,30,.9)"; c.lineWidth = 2;
          for (const yy of [WY + 64, WY + 80]) { c.beginPath(); for (let k = -1; k < 3; k++) { const x = WX + k * 900 - pp + 508; c.moveTo(x, yy); c.quadraticCurveTo(x + 450, yy + 40, x + 900, yy); } c.stroke(); }
          // diagonal rain streaks on the glass (train is moving)
          c.strokeStyle = "rgba(200,220,255,.22)"; c.lineWidth = 1.6; c.lineCap = "round";
          c.beginPath();
          for (const d of drops) {
            const u = (d[0] + t * (0.25 + d[2] * 0.4)) % 1;
            const x = WX + WW - u * (WW + 200), y = WY + d[1] * WH + u * 120;
            c.moveTo(x, y); c.lineTo(x + 30 + d[2] * 40, y - 8 - d[2] * 10);
          }
          c.stroke();
          // reflection of the cabin lamp on the glass
          glow(c, WX + 250, WY + 90, 160, "#ffd9a0", 0.12);
          c.restore();
        } },
        { s(c) {
          // cabin wall around the window
          const wall = lin(c, 0, 0, 0, AH, [[0, "#1e3a44"], [0.5, "#24444e"], [1, "#132830"]]);
          c.fillStyle = wall; c.beginPath(); c.rect(0, 0, AW, AH); c.roundRect(WX, WY, WW, WH, 70); c.fill("evenodd");
          // gasket + frame
          c.strokeStyle = "#0b1418"; c.lineWidth = 18; c.beginPath(); c.roundRect(WX - 6, WY - 6, WW + 12, WH + 12, 76); c.stroke();
          c.strokeStyle = "rgba(255,220,170,.25)"; c.lineWidth = 3; c.beginPath(); c.roundRect(WX - 16, WY - 16, WW + 32, WH + 32, 86); c.stroke();
          // ceiling light spill
          glow(c, 800, -60, 900, "#ffcf8a", 0.32, "lighter", 0.45);
          // luggage rack
          c.fillStyle = "#9aa6aa"; c.fillRect(0, 50, AW, 6); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(0, 56, AW, 4);
          // table under the window
          c.fillStyle = lin(c, 0, WY + WH + 40, 0, WY + WH + 90, [[0, "#c58b5a"], [1, "#7a4a2a"]]);
          c.beginPath(); c.moveTo(WX + 120, WY + WH + 40); c.lineTo(WX + WW - 120, WY + WH + 40); c.lineTo(WX + WW - 60, WY + WH + 92); c.lineTo(WX + 60, WY + WH + 92); c.closePath(); c.fill();
          c.fillStyle = "#4a2a18"; c.fillRect(WX + 60, WY + WH + 92, WW - 120, 16);
          // paper cup + book + ticket
          const cx = 1000, cy = WY + WH + 52;
          c.fillStyle = lin(c, cx - 40, 0, cx + 40, 0, [[0, "#ffffff"], [1, "#bfc8cc"]]);
          c.beginPath(); c.moveTo(cx - 40, cy - 110); c.lineTo(cx + 40, cy - 110); c.lineTo(cx + 30, cy); c.lineTo(cx - 30, cy); c.closePath(); c.fill();
          c.fillStyle = "#2f7f86"; c.beginPath(); c.moveTo(cx - 36, cy - 70); c.lineTo(cx + 36, cy - 70); c.lineTo(cx + 33, cy - 40); c.lineTo(cx - 33, cy - 40); c.closePath(); c.fill();
          c.fillStyle = "#e9e1d6"; ell(c, cx, cy - 112, 42, 9); c.fill();
          book(c, 520, WY + WH + 46, 240, 30, "#c0563e", { slant: -0.03 });
          c.save(); c.translate(800, WY + WH + 60); c.rotate(0.08); c.fillStyle = "#f2e6c8"; c.fillRect(0, 0, 120, 26); c.fillStyle = "#d9774a"; c.fillRect(0, 0, 18, 26); c.restore();
          // seat backs (red velvet) at the sides
          for (const [x, flip] of [[-40, 1], [AW + 40, -1]]) {
            c.save(); c.translate(x, 0); c.scale(flip, 1);
            c.fillStyle = lin(c, 0, 0, 260, 0, [[0, "#3a0f1c"], [0.7, "#7a2232"], [1, "#4a1420"]]);
            rr(c, 0, 300, 230, 700, 60); c.fill();
            c.fillStyle = "#e9e1d6"; rr(c, 30, 290, 200, 70, 20); c.fill();
            c.restore();
          }
          finish(c, { grain: 0.15, vig: 0.5, vigCol: "#03070c" });
        } },
        { a(c, t) {
          steam(c, 1000, WY + WH - 70, t, { h: 140, w: 26, a: 0.18, n: 2, col: "#ffffff", seed: 7 });
          // the whole cabin gently sways
          const k = Math.sin(t * 9) * 0.6;
          if (k) { c.fillStyle = A("#000000", 0.02 + 0.02 * Math.sin(t * 3)); c.fillRect(0, 0, AW, AH); }
        } },
      ],
    };
  };

  /* 4 — forest cabin by a lake: layered pines, fog, warm windows, chimney smoke, fireflies */
  SCENES[4] = () => {
    const R = E.rng(4040);
    const LK = 590; // lake line
    const flies = Array.from({ length: 26 }, () => [R() * AW, 520 + R() * 360, R(), R()]);
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          c.fillStyle = lin(c, 0, 0, 0, LK, [[0, "#081a2e"], [0.4, "#123552"], [0.75, "#3a4f7a"], [1, "#7a6a9a"]]);
          c.fillRect(0, 0, AW, LK);
          stars(c, R, 160, 0, 0, AW, 360, "#eaf6ff", 1.6);
          // aurora ribbon
          c.save(); c.filter = "blur(24px)"; c.globalCompositeOperation = "lighter";
          for (let i = 0; i < 3; i++) { c.strokeStyle = A(i === 1 ? "#58ffd0" : "#6fb8ff", 0.25); c.lineWidth = 60; c.beginPath(); c.moveTo(-100, 220 + i * 30); c.bezierCurveTo(400, 80 + i * 20, 900, 300, 1700, 120 + i * 40); c.stroke(); }
          c.restore();
          moon(c, 1240, 150, 40, "#fffbe8", "#9fe6ff", 0.7);
          // mountain silhouettes
          c.fillStyle = "#2e3f6a"; c.beginPath(); c.moveTo(0, LK); for (let i = 0; i <= 10; i++) c.lineTo(i * 160, LK - 160 - Math.sin(i * 1.3) * 60 - R() * 50); c.lineTo(AW, LK); c.fill();
          c.fillStyle = lin(c, 0, LK - 160, 0, LK, [[0, "rgba(160,170,210,0)"], [1, "rgba(160,170,210,.45)"]]); c.fillRect(0, LK - 160, AW, 160);
          // far pines (misty)
          for (let i = 0; i < 70; i++) pine(c, R() * AW, LK + 4, 70 + R() * 70, 34 + R() * 20, "#3a4a72", R);
          c.fillStyle = lin(c, 0, LK - 70, 0, LK, [[0, "rgba(150,160,200,0)"], [1, "rgba(150,160,200,.5)"]]); c.fillRect(0, LK - 70, AW, 70);
          // mid pines
          for (let i = 0; i < 46; i++) { const x = R() * AW; if (x > 980 && x < 1260) continue; pine(c, x, LK + 6, 120 + R() * 110, 54 + R() * 26, "#1a2646", R); }
          // cabin
          const cx = 1100, cy = LK;
          c.fillStyle = "#24161c"; c.fillRect(cx - 4, cy - 120, 180, 120);
          c.fillStyle = "#170d12"; c.beginPath(); c.moveTo(cx - 30, cy - 116); c.lineTo(cx + 86, cy - 210); c.lineTo(cx + 206, cy - 116); c.closePath(); c.fill();
          c.fillStyle = "#3a2a2e"; c.beginPath(); c.moveTo(cx - 30, cy - 116); c.lineTo(cx + 86, cy - 210); c.lineTo(cx + 90, cy - 204); c.lineTo(cx - 22, cy - 112); c.fill();
          c.fillStyle = "#1a1014"; c.fillRect(cx + 136, cy - 200, 22, 60);
          c.strokeStyle = "rgba(255,180,120,.12)"; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(cx - 4, cy - 110 + i * 14); c.lineTo(cx + 176, cy - 110 + i * 14); c.stroke(); }
          for (const [wx, wy, ww, wh] of [[cx + 18, cy - 92, 40, 44], [cx + 110, cy - 92, 40, 44], [cx + 70, cy - 170, 30, 30]]) {
            c.fillStyle = lin(c, 0, wy, 0, wy + wh, [[0, "#ffe2a0"], [1, "#ff9a4d"]]); c.fillRect(wx, wy, ww, wh);
            c.fillStyle = "#24161c"; c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); c.fillRect(wx, wy + wh / 2 - 1.5, ww, 3);
            glow(c, wx + ww / 2, wy + wh / 2, 120, "#ff9a4d", 0.4);
          }
          // dock
          c.fillStyle = "#1a1014"; c.fillRect(cx - 160, cy + 6, 170, 10); for (let i = 0; i < 4; i++) c.fillRect(cx - 150 + i * 50, cy + 10, 6, 24);
          // lake: reflection of everything above, darker, squashed
          c.save(); c.translate(0, LK * 2 + 2); c.scale(1, -1); c.globalAlpha = 0.5; c.filter = "blur(3px)";
          c.drawImage(c.canvas, 0, 0, c.canvas.width, c.canvas.height * (LK / AH), 0, 0, AW, LK);
          c.restore();
          c.fillStyle = lin(c, 0, LK, 0, AH, [[0, "rgba(20,30,60,.45)"], [1, "rgba(5,10,24,.95)"]]); c.fillRect(0, LK, AW, AH - LK);
          c.strokeStyle = "rgba(200,220,255,.08)"; c.lineWidth = 2;
          for (let i = 0; i < 40; i++) { const y = LK + 8 + Math.pow(R(), 1.5) * 300; c.beginPath(); c.moveTo(R() * AW, y); c.lineTo(R() * AW, y); c.stroke(); }
        } },
        { a(c, t) {
          // shimmering reflection of the windows
          for (let i = 0; i < 12; i++) {
            const y = LK + 18 + i * 9, w = 40 + 30 * vn(t * 1.5 + i, 6);
            c.fillStyle = A("#ffb36b", 0.4 - i * 0.025);
            c.fillRect(1118 + Math.sin(t * 2 + i) * 8, y, w, 2.5); c.fillRect(1210 + Math.sin(t * 2.3 + i * 1.3) * 8, y, w * 0.9, 2.5);
          }
          // chimney smoke
          steam(c, 1247, 380, t, { h: 260, w: 46, a: 0.16, n: 3, col: "#c9d4ee", seed: 4 });
        } },
        { s(c) {
          // near pines framing the scene
          for (const [x, h, w] of [[60, 860, 300], [210, 660, 230], [-40, 980, 360], [1500, 900, 330], [1380, 640, 230], [1620, 1000, 360]]) pine(c, x, AH + 40, h, w, "#03070f", R);
          c.fillStyle = "#03070f"; c.fillRect(0, AH - 40, AW, 40);
          finish(c, { grain: 0.15, vig: 0.5, vigCol: "#02050c" });
        } },
        { a(c, t) {
          for (const f of flies) {
            const x = f[0] + Math.sin(t * (0.6 + f[2]) + f[3] * 9) * 40, y = f[1] + Math.cos(t * (0.5 + f[3]) + f[2] * 7) * 26;
            const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * (1.5 + f[2] * 2) + f[3] * 20));
            glow(c, x, y, 26, "#e8ff8a", 0.55 * a); c.fillStyle = A("#fbffd0", a); ell(c, x, y, 2.6, 2.6); c.fill();
          }
        } },
      ],
    };
  };

  /* 5 — sleepy cat curled on a stack of books, fairy lights, rainy window */
  SCENES[5] = () => {
    const R = E.rng(5150);
    const SH = 640;
    const bulbs = Array.from({ length: 16 }, (_, i) => [i / 15, R(), ["#ffcf8a", "#ff9fc4", "#7ff0e1", "#ffe27a"][i % 4]]);
    const rain = Array.from({ length: 90 }, () => [R(), R(), R()]);
    const WX = 140, WY = 90, WW = 560, WH = 480;
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          c.fillStyle = lin(c, 0, 0, 0, AH, [[0, "#3a2552"], [0.6, "#4a2f5e"], [1, "#2a1a3a"]]); c.fillRect(0, 0, AW, AH);
          // window (arched)
          c.save(); c.beginPath(); c.moveTo(WX, WY + WH); c.lineTo(WX, WY + WW / 2); c.arc(WX + WW / 2, WY + WW / 2, WW / 2, Math.PI, 0); c.lineTo(WX + WW, WY + WH); c.closePath(); c.clip();
          c.fillStyle = lin(c, 0, WY, 0, WY + WH, [[0, "#0f1640"], [0.6, "#2a3a7a"], [1, "#4a5a9a"]]); c.fillRect(WX, WY, WW, WH);
          stars(c, R, 60, WX, WY, WX + WW, WY + 300, "#ffffff", 1.5);
          moon(c, WX + 390, WY + 150, 34, "#fff6e0", "#c9b6ff", 0.7);
          skyline(c, R, { x0: WX, x1: WX + WW, base: WY + WH, hMin: 60, hMax: 180, wMin: 40, wMax: 90, color: "#1b2350", lit: 0.35, litCols: ["#ffcf8a", "#7ff0e1"], win: [5, 6], gap: [5, 6] });
          staticDroplets(c, R, 120, WX, WY, WW, WH, 1);
          c.restore();
          c.strokeStyle = "#20132e"; c.lineWidth = 20;
          c.beginPath(); c.moveTo(WX, WY + WH); c.lineTo(WX, WY + WW / 2); c.arc(WX + WW / 2, WY + WW / 2, WW / 2, Math.PI, 0); c.lineTo(WX + WW, WY + WH); c.stroke();
          c.lineWidth = 12; c.beginPath(); c.moveTo(WX + WW / 2, WY); c.lineTo(WX + WW / 2, WY + WH); c.moveTo(WX, WY + 290); c.lineTo(WX + WW, WY + 290); c.stroke();
          // shelf on the wall (right) with plants & jars
          c.fillStyle = "#24152e"; c.fillRect(1020, 250, 520, 16);
          for (let i = 0; i < 5; i++) book(c, 1060 + i * 34, 130, 28, 120, ["#2f7f86", "#d9774a", "#6b4a8a", "#e9dcc0", "#2a3a6a"][i], { slant: i === 4 ? 0.2 : 0 });
          c.fillStyle = "#c8a0d8"; c.fillRect(1300, 196, 60, 54);
          for (let i = 0; i < 10; i++) leaf(c, 1330, 200, 50 + R() * 50, 12, -Math.PI / 2 + (i - 4.5) * 0.3, i % 2 ? "#2f6f62" : "#3f8f7a", null);
          // trailing plant on the shelf
          c.strokeStyle = "#1a3a34"; c.lineWidth = 3; c.beginPath(); c.moveTo(1470, 256); c.bezierCurveTo(1480, 340, 1440, 420, 1470, 520); c.stroke();
          for (let k = 0; k < 9; k++) leaf(c, 1470 + Math.sin(k) * 14, 270 + k * 28, 32, 15, k % 2 ? 0.4 : 2.7, "#2a5f55", null);
          c.fillStyle = "#e0905a"; c.fillRect(1440, 210, 60, 46);
          // desk/shelf surface
          c.fillStyle = lin(c, 0, SH, 0, AH, [[0, "#8a5a44"], [0.08, "#6a4030"], [1, "#2a1810"]]); c.fillRect(0, SH, AW, AH - SH);
          c.fillStyle = "rgba(255,200,150,.3)"; c.fillRect(0, SH, AW, 3);
          // lamp glow from the right
          glow(c, 1300, 520, 800, "#ff9a5a", 0.3);
          // stack of books
          const stack = [[560, SH - 46, 520, 46, "#2a3a6a", "LOFI"], [590, SH - 90, 470, 44, "#d9774a", "NIGHTS"], [570, SH - 128, 500, 38, "#e9dcc0", ""], [600, SH - 170, 450, 42, "#2f7f86", "DREAMS"], [585, SH - 206, 460, 36, "#6b4a8a", "TEA"]];
          for (const [x, y, w, h, col, label] of stack) {
            book(c, x, y, w, h, col, { band: "rgba(255,220,150,.55)" });
            c.fillStyle = "rgba(255,220,150,.5)"; c.font = "600 16px Inter, sans-serif"; c.fillText(label, x + w * 0.35, y + h / 2 + 5);
          }
          // mug & candle on the desk
          mug(c, 1240, SH - 74, 70, 74, "#f0907a", "#8a3f40", { coffee: "#4a2a1a" });
          c.fillStyle = "#f6ead6"; c.fillRect(380, SH - 90, 50, 90); c.fillStyle = "#1a1014"; c.fillRect(403, SH - 104, 3, 14);
        } },
        { a(c, t) {
          rainFall(c, rain, t, WX, WY, WW, WH, { col: "#c8d4ff", a: 0.22, slant: 0.1, len: 26, speed: 600 });
          // candle flame + glow
          const fl = 0.85 + 0.15 * vn(t * 11, 3);
          glow(c, 405, SH - 112, 220 * fl, "#ffb36b", 0.45);
          c.fillStyle = "#fff2c4"; c.beginPath(); c.ellipse(405 + Math.sin(t * 7) * 1.5, SH - 114, 6, 14 * fl, 0, 0, TAU); c.fill();
          steam(c, 1240, SH - 84, t, { h: 120, w: 24, a: 0.18, n: 2, col: "#ffece0", seed: 5 });
          // ---- cat curled on the books (breathing)
          const br = 1 + Math.sin(t * 2.1) * 0.018;
          const cx = 820, cy = SH - 232;
          c.save(); c.translate(cx, cy + 20); c.scale(1, br); c.translate(-cx, -cy - 20);
          const body = `M${cx - 190} ${cy + 22} C${cx - 200} ${cy - 60} ${cx - 90} ${cy - 112} ${cx + 10} ${cy - 108} C${cx + 120} ${cy - 104} ${cx + 196} ${cy - 50} ${cx + 192} ${cy + 22} Z`;
          fillP(c, body, lin(c, 0, cy - 110, 0, cy + 22, [[0, "#f2a466"], [0.6, "#d8834a"], [1, "#a85a2e"]]));
          c.save(); c.clip(path(body));
          c.strokeStyle = "rgba(150,70,30,.55)"; c.lineWidth = 12; c.lineCap = "round";
          for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(cx - 110 + i * 46, cy - 104); c.quadraticCurveTo(cx - 100 + i * 46, cy - 60, cx - 120 + i * 48, cy - 30); c.stroke(); }
          glow(c, cx + 260, cy - 60, 260, "#ffcf8a", 0.4);
          c.restore();
          // tail wrapping the front
          c.strokeStyle = "#d8834a"; c.lineWidth = 34; c.lineCap = "round";
          c.beginPath(); c.moveTo(cx + 170, cy + 10); c.bezierCurveTo(cx + 120, cy + 34, cx - 40, cy + 34, cx - 120, cy + 16 + Math.sin(t * 0.9) * 3); c.stroke();
          c.strokeStyle = "#a85a2e"; c.lineWidth = 34; c.beginPath(); c.moveTo(cx - 108, cy + 17); c.lineTo(cx - 122, cy + 16 + Math.sin(t * 0.9) * 3); c.stroke();
          // head resting on paws (left)
          const hx = cx - 150, hy = cy - 22;
          fillP(c, `M${hx - 70} ${hy + 10} C${hx - 76} ${hy - 50} ${hx - 30} ${hy - 72} ${hx + 6} ${hy - 72} C${hx + 50} ${hy - 72} ${hx + 86} ${hy - 44} ${hx + 80} ${hy + 10} C${hx + 74} ${hy + 44} ${hx - 64} ${hy + 44} ${hx - 70} ${hy + 10} Z`, lin(c, 0, hy - 70, 0, hy + 40, [[0, "#f6ae70"], [1, "#c06a36"]]));
          fillP(c, `M${hx - 54} ${hy - 44} L${hx - 66} ${hy - 104} L${hx - 14} ${hy - 68} Z`, "#e08e52");
          fillP(c, `M${hx + 30} ${hy - 70} L${hx + 70} ${hy - 112} L${hx + 72} ${hy - 44} Z`, "#d8834a");
          fillP(c, `M${hx - 52} ${hy - 52} L${hx - 58} ${hy - 90} L${hx - 26} ${hy - 66} Z`, "#f4b7a0");
          c.strokeStyle = "#5a2a14"; c.lineWidth = 4; c.lineCap = "round";
          c.beginPath(); c.arc(hx - 28, hy - 14, 13, 0.2, Math.PI - 0.2); c.stroke();
          c.beginPath(); c.arc(hx + 30, hy - 14, 13, 0.2, Math.PI - 0.2); c.stroke();
          c.fillStyle = "#f08a8a"; ell(c, hx + 2, hy + 6, 7, 5); c.fill();
          c.strokeStyle = "rgba(255,240,220,.6)"; c.lineWidth = 1.5;
          for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(hx + 2 + s * 22, hy + 12 + k * 4); c.lineTo(hx + 2 + s * 70, hy + 4 + k * 10); c.stroke(); }
          // paws
          c.fillStyle = "#f8c79a"; ell(c, hx - 30, hy + 38, 30, 14); c.fill(); ell(c, hx + 30, hy + 40, 28, 13); c.fill();
          c.restore();
          // z z z
          for (let k = 0; k < 3; k++) {
            const ph = (t * 0.35 + k / 3) % 1;
            c.globalAlpha = Math.sin(ph * Math.PI) * 0.85;
            c.fillStyle = "#e9e0ff"; c.font = `600 ${22 + ph * 26}px Inter, sans-serif`;
            c.fillText("z", hx - 60 - ph * 40 + Math.sin(ph * 6) * 10, hy - 110 - ph * 190);
          }
          c.globalAlpha = 1;
        } },
        { s(c) {
          // fairy-light string (wire)
          c.strokeStyle = "#140b1c"; c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(-20, 40); c.quadraticCurveTo(800, 190, 1620, 30); c.stroke();
          finish(c, { grain: 0.15, vig: 0.48, vigCol: "#0d0614" });
        } },
        { a(c, t) {
          for (const b of bulbs) {
            const x = -20 + b[0] * 1640, u = b[0], y = (1 - u) * (1 - u) * 40 + 2 * (1 - u) * u * 190 + u * u * 30 + 10;
            const a = 0.55 + 0.45 * Math.sin(t * (1.2 + b[1] * 2) + b[1] * 30);
            glow(c, x, y, 60, b[2], 0.55 * a); c.fillStyle = b[2]; ell(c, x, y, 6, 8); c.fill();
          }
        } },
      ],
    };
  };

  /* 6 — beach sunset: glowing clouds, sun on the horizon, glittering sea, palm, gulls */
  SCENES[6] = () => {
    const R = E.rng(616);
    const HZ = 540, SAND = 760;
    const glints = Array.from({ length: 70 }, () => [R(), R(), R()]);
    const birds = Array.from({ length: 5 }, () => [R(), R(), R()]);
    return {
      fx: 0.5, fy: 0.5,
      layers: [
        { s(c) {
          c.fillStyle = lin(c, 0, 0, 0, HZ, [[0, "#2a1b5c"], [0.3, "#6a2f86"], [0.55, "#c8467a"], [0.78, "#ff7a55"], [0.92, "#ffb35a"], [1, "#ffd98a"]]);
          c.fillRect(0, 0, AW, HZ);
          glow(c, 980, HZ, 900, "#ff8a5a", 0.4, "lighter", 0.6);
          // sun
          glow(c, 980, HZ - 30, 320, "#ffe2a0", 0.65);
          c.save(); c.beginPath(); c.rect(0, 0, AW, HZ); c.clip();
          c.fillStyle = lin(c, 0, HZ - 130, 0, HZ, [[0, "#fff4c8"], [1, "#ffb35a"]]); ell(c, 980, HZ + 10, 125, 125); c.fill();
          c.restore();
          // clouds: long lit streaks
          c.save(); c.filter = "blur(3px)";
          for (let i = 0; i < 18; i++) {
            const y = 90 + Math.pow(R(), 0.8) * 360, x = R() * AW, w = 200 + R() * 520, h = 10 + R() * 26;
            const lit = 1 - (y - 90) / 380;
            c.fillStyle = mixA("#2e1a5a", "#7a3a7e", 1 - lit, 0.6);
            ell(c, x, y, w / 2, h); c.fill();
            c.fillStyle = A(y > 300 ? "#ffb37a" : "#ff8ab8", 0.55); ell(c, x + 10, y + h * 0.55, w * 0.46, h * 0.4); c.fill();
          }
          c.restore();
          // distant island + sailboat
          c.fillStyle = "#3a1f4a"; c.beginPath(); c.moveTo(80, HZ); c.bezierCurveTo(160, HZ - 50, 300, HZ - 70, 440, HZ - 20); c.lineTo(520, HZ); c.fill();
          // sea
          c.fillStyle = lin(c, 0, HZ, 0, SAND, [[0, "#c25a7a"], [0.25, "#7a3f86"], [1, "#2a1f5a"]]); c.fillRect(0, HZ, AW, SAND - HZ);
          c.strokeStyle = "rgba(255,190,200,.15)"; c.lineWidth = 2;
          for (let i = 0; i < 40; i++) { const y = HZ + 6 + Math.pow(R(), 1.6) * (SAND - HZ - 10); c.beginPath(); c.moveTo(R() * AW, y); c.lineTo(R() * AW, y); c.stroke(); }
          // sand
          c.fillStyle = lin(c, 0, SAND, 0, AH, [[0, "#6a3a5a"], [0.3, "#8a4a52"], [1, "#3a1f2a"]]); c.fillRect(0, SAND, AW, AH - SAND);
          c.fillStyle = lin(c, 0, SAND, 0, SAND + 40, [[0, "rgba(255,170,150,.35)"], [1, "rgba(255,170,150,0)"]]); c.fillRect(0, SAND, AW, 40);
        } },
        { a(c, t) {
          // sun column glitter
          c.save(); c.globalCompositeOperation = "lighter";
          for (const g of glints) {
            const y = HZ + 4 + Math.pow(g[1], 1.3) * (SAND - HZ - 10);
            const spread = 30 + (y - HZ) * 0.9;
            const x = 980 + (g[0] - 0.5) * spread * 2 + Math.sin(t * 1.3 + g[2] * 10) * 10;
            const a = Math.max(0, Math.sin(t * (2 + g[2] * 3) + g[2] * 40)) * (1 - (y - HZ) / (SAND - HZ)) * 0.9;
            c.fillStyle = A("#ffe2b0", a); c.fillRect(x, y, 10 + g[2] * 40 * (1 - (y - HZ) / 300), 2.5);
          }
          c.restore();
          // waves washing in and out
          for (let k = 0; k < 3; k++) {
            const ph = (t * 0.25 + k / 3) % 1;
            const y = SAND - 6 + Math.sin(ph * Math.PI) * 50;
            c.strokeStyle = A("#ffe8f0", 0.45 * Math.sin(ph * Math.PI)); c.lineWidth = 3;
            c.beginPath(); for (let i = 0; i <= 20; i++) { const x = (i / 20) * AW; const yy = y + Math.sin(i * 1.3 + k * 2 + t) * 6; i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
          }
          // gulls
          c.strokeStyle = "#2a1638"; c.lineWidth = 3; c.lineCap = "round";
          for (const b of birds) {
            const x = ((b[0] * AW + t * (20 + b[2] * 20)) % (AW + 100)) - 50, y = 150 + b[1] * 200 + Math.sin(t + b[2] * 9) * 6, s = 10 + b[2] * 10, f = Math.sin(t * 5 + b[1] * 9) * 0.4;
            c.beginPath(); c.moveTo(x - s, y - s * (0.3 + f)); c.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.5, x + s, y - s * (0.3 + f)); c.stroke();
          }
          // sailboat drifting
          const bx = 1330 - t * 6;
          c.fillStyle = "#2a1640"; c.beginPath(); c.moveTo(bx, HZ - 4); c.lineTo(bx + 40, HZ - 4); c.lineTo(bx + 34, HZ + 4); c.lineTo(bx + 6, HZ + 4); c.fill();
          c.beginPath(); c.moveTo(bx + 20, HZ - 60); c.lineTo(bx + 20, HZ - 6); c.lineTo(bx + 42, HZ - 8); c.fill();
        } },
        { s(c) {
          // palm silhouette (left) + beach grass
          c.strokeStyle = "#150a1e"; c.lineCap = "round"; c.lineWidth = 26;
          c.beginPath(); c.moveTo(220, AH + 20); c.bezierCurveTo(250, 700, 320, 420, 430, 230); c.stroke();
          c.lineWidth = 3; c.strokeStyle = "rgba(255,160,140,.25)";
          for (let i = 0; i < 18; i++) { const f = i / 18; const x = E.lerp(220, 430, f * f * 0.9), y = E.lerp(AH, 230, f); c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 12, y - 4); c.stroke(); }
          c.fillStyle = "#150a1e";
          for (let i = 0; i < 9; i++) {
            const a = -Math.PI * 1.05 + (i / 8) * Math.PI * 1.1;
            const L = 220 + R() * 80;
            const ex = 430 + Math.cos(a) * L, ey = 230 + Math.sin(a) * L * 0.5 + L * 0.42;
            c.beginPath(); c.moveTo(430, 230);
            c.quadraticCurveTo(430 + Math.cos(a) * L * 0.5, 230 + Math.sin(a) * L * 0.8 - 40, ex, ey);
            c.quadraticCurveTo(430 + Math.cos(a) * L * 0.45, 230 + Math.sin(a) * L * 0.45 - 8, 430, 238);
            c.fill();
            c.strokeStyle = "#150a1e"; c.lineWidth = 2;
            for (let k = 1; k < 10; k++) { const f = k / 10; const px = 430 + (ex - 430) * f, py = 230 + (ey - 230) * f - Math.sin(f * Math.PI) * 30; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1.2) * 34 * (1 - f * 0.5), py + 30 * (1 - f * 0.4)); c.stroke(); }
          }
          for (let i = 0; i < 40; i++) { const x = R() * 700, h = 40 + R() * 60; c.strokeStyle = "#1a0d22"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, AH); c.quadraticCurveTo(x + 6, AH - h * 0.6, x + (R() - 0.5) * 40, AH - h); c.stroke(); }
          finish(c, { grain: 0.15, vig: 0.4, vigCol: "#10061a" });
        } },
      ],
    };
  };

  M.LOFI_VARIANTS = SCENES.length;
  const ART = new Map();
  const buildArt = (variant, cw, ch, fx, fy) => {
    const key = `${variant}|${cw}|${ch}|${fx}|${fy}`;
    let a = ART.get(key);
    if (a) return a;
    const def = SCENES[variant]();
    const s = Math.max(cw / AW, ch / AH);
    const tf = [s, 0, 0, s, (cw - AW * s) * (fx ?? def.fx), (ch - AH * s) * (fy ?? def.fy)];
    const groups = [];
    for (const L of def.layers) {
      if (L.s) {
        let g = groups[groups.length - 1];
        if (!g || !g.cv) { g = { cv: mk(cw, ch) }; groups.push(g); }
        const c = g.cv.getContext("2d", CTX);
        c.setTransform(...tf); c.save(); L.s(c); c.restore();
      } else groups.push({ a: L.a });
    }
    a = { groups, tf };
    ART.set(key, a);
    return a;
  };

  /* lofiArt(canvasOrParent, w, h, { variant = 0, t = 0, dpr = 1, fx, fy, animate = true })
     → { el, canvas, variant, render(t) }   w×h in CSS px; the bitmap is w·dpr × h·dpr.
     fx/fy (0..1) choose which part of the 16:9 illustration survives a cover-crop. */
  M.lofiArt = (target, w, h, o = {}) => {
    const canvas = target instanceof HTMLCanvasElement ? target : E.h("canvas", "lofi-art", target);
    const dpr = o.dpr ?? 1, variant = ((o.variant ?? 0) % SCENES.length + SCENES.length) % SCENES.length;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    canvas.width = cw; canvas.height = ch;
    E.css(canvas, { width: w + "px", height: h + "px", display: "block" });
    const ctx = canvas.getContext("2d", CTX);
    let lastT = null;
    const api = {
      el: canvas, canvas, variant,
      render(t = 0) {
        if (t === lastT) return;
        if (o.animate === false && lastT != null) return;
        lastT = t;
        const art = buildArt(variant, cw, ch, o.fx, o.fy);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (const g of art.groups) {
          if (g.cv) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(g.cv, 0, 0); }
          else { ctx.setTransform(...art.tf); ctx.save(); g.a(ctx, t); ctx.restore(); }
        }
      },
    };
    api.render(o.t ?? 0);
    return api;
  };
  /* lofiURL(variant, w, h, t) → PNG data URL (e.g. as a texture source for FX.thermalImage) */
  M.lofiURL = (variant = 0, w = 1280, h = 720, t = 0) => {
    const cv = mk(w, h);
    M.lofiArt(cv, w, h, { variant, t });
    return cv.toDataURL("image/png");
  };
})();
