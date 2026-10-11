/* Act 4 — beat montage · "say hey." with the pixel hands · end card */
(function () {
  const E = window.E, C = E.C, K = E.K, T = K.T, ez = E.ease;

  /* ============ MONTAGE: every feature, one beat each ============ */
  E.scene("montage", T.montage[0], T.montage[1], (root) => {
    const CUTS = [
      ["demo", 2.0, "play it."], ["typing", 2.3, "type it."], ["memory", 1.4, "remember it."],
      ["asks", 0.75, "ask first."], ["instant", 1.15, "instantly."], ["skills", 2.95, "automate it."],
      ["apps", 1.25, "any app."], ["code", 2.2, "ship it."], ["privacy", 3.1, "private."],
    ];
    const beats = [1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    let acc = 0;
    const cuts = CUTS.map(([name, at, word], i) => { const c = { name, at, word, t0: E.b(acc), d: E.b(beats[i]) }; acc += beats[i]; return c; });
    const shade = E.h("div", "fill", root);
    E.css(shade, { background: "radial-gradient(60% 50% at 50% 52%, rgba(0,0,0,.55), rgba(0,0,0,.72))" });
    const word = E.h("div", "abs display", root);
    E.css(word, { left: 0, right: 0, top: "420px", textAlign: "center", fontSize: "240px", color: "#fff", textShadow: "0 10px 60px rgba(0,0,0,.45)", whiteSpace: "nowrap" });
    cuts.forEach((c) => E.cue(T.montage[0] + c.t0, "cut", { g: 0.8 }));
    return (lt) => {
      const i = Math.max(0, cuts.findIndex((c, j) => lt >= c.t0 && (j === cuts.length - 1 || lt < cuts[j + 1].t0)));
      const c = cuts[i];
      const s = E.find(c.name);
      const u = lt - c.t0;
      s.forced = true;
      if (!s.on) { s.wrap.style.display = ""; s.on = true; }
      s.update(c.at + u, s.start + c.at + u);
      const p = E.k(u, 0, c.d, ez.outCubic);
      E.tf(s.wrap, { s: E.lerp(1.16, 1.04, p), rz: (i % 2 ? 1 : -1) * E.lerp(2.2, 0.6, p) });
      s.wrap.style.zIndex = 0;
      if (word._i !== i) { word._i = i; word.textContent = c.word; }
      const w = E.k(u, 0, 0.16, ez.outExpo);
      E.tf(word, { s: E.lerp(1.35, 1, w), blur: (1 - w) * 14, o: w });
    };
  }, { z: 5 });

  /* ============ HANDS: say hey. ============ */
  E.scene("hands", T.hands[0], T.hands[1], (root) => {
    E.css(root, { background: "#000" });
    const cv = E.h("canvas", "abs", root);
    cv.width = 1920; cv.height = 1080;
    const ctx = cv.getContext("2d");
    const glow = E.h("div", "abs", root);
    E.css(glow, { left: "560px", top: "320px", width: "800px", height: "640px", background: "radial-gradient(closest-side, rgba(15,127,255,.45), transparent)" });
    const win = E.h("div", "abs", root);
    E.css(win, { left: 960 - 210 + "px", top: "490px", width: "420px", height: "300px", border: "2px solid rgba(255,255,255,.9)", background: "#000", boxShadow: "0 0 40px rgba(15,127,255,.35)" });
    win.innerHTML = `<div style="height:34px;border-bottom:2px solid rgba(255,255,255,.9);display:flex;align-items:center;justify-content:space-between;padding:0 10px;font:500 15px var(--mono);letter-spacing:.12em;color:#fff">HEYSWAEY.APP<span style="letter-spacing:.3em">_□×</span></div><div class="hw-face" style="position:absolute;left:0;right:0;top:34px;bottom:0;display:grid;place-items:center"></div>`;
    const face = new C.Face(win.querySelector(".hw-face"), { size: 150, stroke: 9 });
    const ringEl = E.h("div", "abs", root);
    E.css(ringEl, { left: "960px", top: "640px", width: "200px", height: "200px", borderRadius: "50%", border: "4px solid #9ec5ff", boxShadow: "0 0 40px #0f7fff", opacity: 0 });
    const title = E.h("div", "abs display", root);
    E.css(title, { left: 0, right: 0, top: "120px", textAlign: "center", fontSize: "230px", color: "#fff" });
    const letters = E.chars(title, "say hey.");
    const sub = E.h("div", "abs", root);
    E.css(sub, { left: 0, right: 0, top: "350px", textAlign: "center", fontSize: "38px", fontWeight: 500, letterSpacing: "-0.03em", color: "rgba(255,255,255,.6)" });
    sub.textContent = "your mac has been waiting for a voice.";
    const wipe = E.h("div", "abs", root);
    E.css(wipe, { background: "#f5f5f5", opacity: 0 });

    // pixelate the two hands from the site's finale
    const hands = [];
    (E.ready ||= []).push(async () => {
      const load = (src) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = src; });
      const spec = [["assets/hand-left.png", 900, 438, 0.9985, 0.5252, "L"], ["assets/hand-right.png", 900, 459, 0, 0.5178, "R"]];
      for (const [src, w, h, tx, ty, side] of spec) {
        const im = await load(src);
        const DW = 900, DH = (h / w) * DW, cell = 7;
        const cols = Math.floor(DW / cell), rows = Math.floor(DH / cell);
        const oc = document.createElement("canvas"); oc.width = cols; oc.height = rows;
        const o = oc.getContext("2d"); o.drawImage(im, 0, 0, cols, rows);
        const d = o.getImageData(0, 0, cols, rows).data;
        const cells = [];
        const r = E.rng(side === "L" ? 3 : 9);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const b = d[(y * cols + x) * 4] / 255;
          if (b > 0.1) cells.push([x * cell, y * cell, b, r()]);
        }
        hands.push({ cells, cell, tipX: tx * DW, tipY: ty * DH, side });
      }
    });
    const S = T.hands[0];
    E.cue(S, "dark", { g: 0.8 });
    E.cue(S + 0.9, "letters", { g: 0.7 });
    E.cue(S + 1.875, "touch", { g: 1 });
    E.cue(S + 3.35, "whooshIn", { g: 0.7 });
    E.flashes = (E.flashes || []).concat([{ t: S + 1.875, d: 0.35, a: 0.55 }]);
    return (lt) => {
      ctx.clearRect(0, 0, 1920, 1080);
      const app = E.k(lt, 0, 1.875, ez.out);
      const touchX = { L: 750, R: 1170 }, Y = 640;
      for (const h of hands) {
        const off = (1 - app) * (h.side === "L" ? -520 : 520) + Math.sin(lt * 1.6 + (h.side === "L" ? 0 : 2)) * 4 * E.k(lt, 1.875, 0.5);
        const gap = (1 - E.k(lt, 1.2, 0.675, ez.inOutCubic)) * (h.side === "L" ? -40 : 40);
        const ox = touchX[h.side] - h.tipX + off + gap, oy = Y - h.tipY;
        const rev = E.k(lt, 0, 1.2, ez.linear);
        for (const [x, y, b, r] of h.cells) {
          if (r > rev * 1.15) continue;
          const lum = Math.round(150 + b * 105);
          ctx.fillStyle = `rgba(${lum},${lum},${Math.min(255, lum + 12)},${(0.25 + b * 0.75).toFixed(2)})`;
          const s = h.cell * (0.45 + b * 0.45);
          ctx.fillRect(ox + x + (h.cell - s) / 2, oy + y + (h.cell - s) / 2, s, s);
        }
      }
      const wi = E.k(lt, 0.3, 0.6, ez.island);
      E.tf(win, { s: 0.6 + 0.4 * wi, o: wi });
      const touch = lt >= 1.875;
      face.render(Object.assign(C.moodAt([[0, "listen"], [1.875, "happy"]], lt), { draw: touch ? E.k(lt, 1.9, 0.45) : undefined, blink: C.blinkAt([1.2, 2.9], lt) }));
      E.op(glow, wi * (0.6 + 0.4 * E.k(lt, 1.875, 0.2)) * (0.9 + 0.1 * Math.sin(lt * 5)));
      const rp = E.k(lt, 1.875, 0.9, ez.outExpo);
      E.css(ringEl, { transform: `translate(-50%,-50%) scale(${(0.3 + rp * 6).toFixed(3)})`, opacity: (touch ? (1 - rp) * 0.9 : 0).toFixed(3) });
      letters.forEach((s, i) => { const p = E.k(lt, 0.85 + i * 0.05, 0.5, ez.out); E.tf(s, { y: (1 - p) * 110, o: p, blur: (1 - p) * 10 }); });
      E.tf(sub, { o: E.k(lt, 1.3, 0.5), y: (1 - E.k(lt, 1.3, 0.5, ez.out)) * 20 });
      // the window opens into the end card
      const w = E.k(lt, 3.35, 0.4, ez.inOutExpo);
      E.css(wipe, { left: E.lerp(750, 0, w) + "px", top: E.lerp(490, 0, w) + "px", width: E.lerp(420, 1920, w) + "px", height: E.lerp(300, 1080, w) + "px", opacity: w > 0 ? Math.min(1, w * 3) : 0 });
    };
  });

  /* ============ END CARD ============ */
  E.scene("end", T.end[0], T.end[1], (root) => {
    E.css(root, { background: "var(--paper)" });
    const half = new C.Shader(root, 1920, 1080, C.FRAG_HALF, { scale: 1 });
    const mark = K.appMark(root, 200);
    E.css(mark.el, { left: "860px", top: "96px" });
    const word = E.h("div", "abs display", root);
    E.css(word, { left: 0, right: 0, top: "330px", textAlign: "center", fontSize: "250px" });
    const letters = E.chars(word, "heyswaey");
    const tag = E.h("div", "abs", root);
    E.css(tag, { left: 0, right: 0, top: "580px", textAlign: "center", fontSize: "40px", fontWeight: 500, letterSpacing: "-0.03em", color: "rgba(0,0,0,.6)" });
    tag.textContent = "a voice agent that lives in your mac’s notch";
    const btns = E.h("div", "abs", root);
    E.css(btns, { left: 0, right: 0, top: "668px", display: "flex", justifyContent: "center", gap: "18px", fontSize: "32px" });
    const dl = E.h("div", "btn-dl", btns, '<svg width="26" height="30" viewBox="0 0 15 18"><path fill="#fff" d="M12.3 9.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM10 2.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></svg>download for mac');
    const url = E.h("div", "btn-ghost mono", btns, "heyswaey.com");
    E.css(url, { fontSize: "28px", letterSpacing: "0" });
    const micro = E.h("div", "abs", root);
    E.css(micro, { left: 0, right: 0, top: "786px", textAlign: "center", fontSize: "25px", color: "rgba(0,0,0,.45)", letterSpacing: "-0.02em" });
    micro.textContent = "free to start · macOS 15 or later on apple silicon";
    const cursor = new C.Cursor(root, { size: 1.7 });
    const S = T.end[0];
    E.cue(S, "logo", { g: 0.9 });
    E.cue(S + 0.3, "letters", { g: 0.6 });
    E.cue(S + 2.35, "click", { g: 1 });
    E.cue(S + 2.4, "check", { g: 0.8 });
    E.cue(S + 2.45, "outro", { g: 1 });
    return (lt, t) => {
      half.render(t, { uAmt: E.k(lt, 0, 1.2, ez.out) * (0.9 + 0.1 * Math.sin(lt * 2)), uCell: 16 });
      const mp = E.spring(lt - 0.05);
      E.tf(mark.el, { s: 0.4 + 0.6 * mp, o: E.k(lt, 0.05, 0.12) });
      mark.face.render(Object.assign(C.moodAt([[0, "neutral"], [2.35, "happy"]], lt), { draw: lt > 2.35 ? E.k(lt, 2.4, 0.45) : E.k(lt, 0.1, 0.5), blink: C.blinkAt([1.4, 3.5], lt) }));
      letters.forEach((s, i) => { const p = E.k(lt, 0.25 + i * 0.045, 0.6, ez.out); E.tf(s, { y: (1 - p) * 130, o: p, blur: (1 - p) * 12 }); });
      const tp = E.k(lt, 0.8, 0.6, ez.out);
      E.tf(tag, { y: (1 - tp) * 24, o: tp });
      const bp = E.k(lt, 1.1, 0.6, ez.spring);
      E.tf(btns, { y: (1 - bp) * 40, o: E.k(lt, 1.1, 0.2) });
      E.op(micro, E.k(lt, 1.4, 0.5));
      // click "download for mac"
      const r = E.rect(dl);
      const ca = E.k(lt, 1.6, 0.7, ez.inOutCubic);
      cursor.render(E.lerp(1500, r.left + r.width * 0.55, ca), E.lerp(1100, r.top + r.height * 0.6, ca), lt, [2.35], E.k(lt, 1.6, 0.2) * (1 - E.k(lt, 3.4, 0.4)));
      const pr = Math.max(0, 1 - Math.abs(lt - 2.35) / 0.12);
      dl.style.transform = `scale(${(1 - 0.06 * pr).toFixed(3)})`;
      dl.style.filter = `brightness(${(1 + 0.15 * pr).toFixed(3)})`;
    };
  });
})();
