/* S15 notch focus timer on an iridescent wash (ref ride tracker f_0190–f_0210) ·
   S18 big type on black → tiny terminal + glitch (ref f_0230–f_0250) ·
   S20 hero macro: monochrome MacBook grille with a gliding cursor, then the glowing notch (ref f_0270–f_0295). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, C = E.C, K = E.K, ez = E.ease;
  const S = K.S;

  /* ================= S15 · focus timer (19.0–21.0) ================= */
  E.shot("S15", (root) => {
    const w = FX.wash(root, 1920, 1080, { palette: "ribbons", seed: 3 });
    const host = E.h("div", "", root);
    E.css(host, { position: "absolute", left: "960px", top: "250px", width: 0, height: 0 });
    const isl = new C.Island(host, { em: 30, width: 22 });
    const big = E.h("div", "", isl.inner);
    E.css(big, { position: "absolute", left: "1.3em", right: "1.3em", top: "5.2em", display: "flex", alignItems: "baseline", justifyContent: "space-between", color: "#fff", fontFamily: "var(--sf)" });
    big.innerHTML = `<span style="font-size:.9em;font-weight:600;opacity:.6;letter-spacing:.02em">focus</span><span class="tm" style="font-size:3.1em;font-weight:500;letter-spacing:-.03em;font-variant-numeric:tabular-nums">25:00</span>`;
    const tm = big.querySelector(".tm");
    const T = S.S15[0];
    E.cue(T + 0.05, "open", { g: 0.6 });
    [0.5, 1.0].forEach((d) => E.cue(T + d, "tick", { g: 0.35, v: 1 }));
    E.cue(T + 1.25, "check", { g: 0.7 });
    return (lt, t) => {
      w.render(t, { flow: 1 });
      const o = E.k(lt, 0, 0.5, ez.island);
      const done = lt >= 1.25;
      const hh = done ? E.lerp(10.5, 7.6, E.k(lt, 1.25, 0.35, ez.island)) : 10.5;
      isl.render({ w: E.lerp(11, 22, o), h: E.lerp(2.3, hh, o), open: o, content: E.k(lt, 0.1, 0.25) });
      isl.setIcon(done ? "check" : "rec");
      isl.setText(done ? "focus mode is on. slack’s closed." : "", done ? E.k(lt, 1.28, 0.45, ez.linear) : 1, { dim: 0.36 });
      const secs = 1500 - Math.max(0, Math.floor((lt - 0.2) / 0.5) + 1);
      const s = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      if (tm.textContent !== s) tm.textContent = s;
      E.op(big, done ? 1 - E.k(lt, 1.25, 0.15) : E.k(lt, 0.15, 0.2));
      isl.face.render(Object.assign(C.moodAt([[0, "listen"], [0.5, "neutral"], [1.25, "happy"]], lt), { draw: done ? E.k(lt, 1.25, 0.4) : undefined, blink: C.blinkAt([0.8], lt), t: lt }));
      isl.wave.render(done ? "speak" : "listen", t, { amp: o * (done ? 1 : 0.7) });
      E.tf(host, { s: E.lerp(1, 1.03, lt / 2) });
    };
  });

  /* ================= S18 · big type → terminal (23.0–25.0) ================= */
  E.shot("S18", (root) => {
    root.style.background = FX.COL.night;
    const tl = FX.typeLine(root, { x: 960, y: 540, size: 74 });
    const text = "ask claude code to fix the failing test";
    // the tiny terminal frame the line collapses into (ref f_0244–f_0248)
    const frame = E.h("div", "", root);
    E.css(frame, { position: "absolute", left: "960px", top: "540px", width: "760px", height: "200px", transform: "translate(-50%,-50%)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "8px", background: "#202020" });
    frame.innerHTML = `<div style="position:absolute;left:14px;top:10px;font:500 11px var(--sf-mono);color:rgba(255,255,255,.28);letter-spacing:.04em">Ln 14, Col 9 · Spaces: 2 · UTF-8 · LF · Swift</div><div style="position:absolute;right:14px;bottom:10px;font:500 11px var(--sf-mono);color:rgba(255,255,255,.22)">zsh — heyswaey</div><div class="gl" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font:500 46px var(--sf);color:#fff;letter-spacing:-.01em"></div>`;
    const gl = frame.querySelector(".gl");
    const T = S.S18[0];
    K.typeCues(T + 0.3, text, 52, 2, 0.45);
    E.cue(T + 1.45, "pop", { g: 0.5 });
    E.cue(T + 1.62, "glitch", { g: 0.7 });
    return (lt) => {
      const n = E.clamp((lt - 0.3) / 0.75) * text.length;
      tl.render({
        text, n: FX.hold(n, 1), caretColor: lt < 0.3 ? FX.caretColor(lt, 10) : "#a98bff",
        highlights: [{ word: "claude code", kind: "coral", p: E.k(lt, 1.1, 0.12, ez.linear) }, { word: "failing test", kind: "select", p: E.k(lt, 1.25, 0.15, ez.outCubic) }],
        box: E.k(lt, 1.35, 0.2), caret: lt < 1.3 ? 1 : 0,
        arrowScale: E.lerp(1.45, 1, E.k(lt, 0.25, 0.4)), arrowDim: E.k(lt, 0.5, 0.6),
      });
      const intro = E.lerp(2.6, 1, E.k(lt, 0.2, 1.0, ez.inOutCubic));
      const shrink = E.k(lt, 1.42, 0.2, ez.inOutExpo);
      E.tf(tl.el, { s: intro * E.lerp(1, 0.62, shrink), o: 1 - E.k(lt, 1.6, 0.04) });
      E.op(frame, E.k(lt, 1.45, 0.08));
      // glitch: the reference's "→ push .cain" scramble
      const g = lt >= 1.6;
      const scr = ["→ fix   .tset", "→ fix the .gnilia", "→ ask   .edoc", "→ fix the failing test"];
      const s = g ? scr[Math.min(3, FX.step(lt - 1.6, 12))] : "";
      if (gl.textContent !== s) gl.innerHTML = s.replace("→", '<span style="color:#8fbf3f">→</span>').replace(/(fix|ask)/, '<span style="color:#9fd04a">$1</span>');
      E.tf(frame, { s: g ? 1 + 0.04 * (FX.step(lt, 12) % 2) : 1 });
    };
  });

  /* ================= S20 · hero macro (27.0–29.5) ================= */
  E.shot("S20", (root) => {
    root.style.background = "#000";
    const mac = FX.macro(root, 1920, 1080, { kind: "grille", scale: 0.6 });
    const cur = FX.cursor(root, { size: 34 });
    // part 2: the notch in the dark, glowing (ref: the cassette close-up gives way to the product)
    const top = E.h("div", "", root);
    E.css(top, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px", perspective: "1400px", background: "radial-gradient(70% 60% at 50% 20%, #15171c, #050506 70%)" });
    const lid = E.h("div", "", top);
    E.css(lid, { position: "absolute", left: "-200px", top: "120px", width: "2320px", height: "1200px", transformOrigin: "50% 0%", borderRadius: "40px 40px 0 0", background: "linear-gradient(180deg, #0b0c0f 0%, #050507 55%)", boxShadow: "0 -2px 0 #4a4d55, 0 -5px 0 #1d1e22, 0 -7px 18px rgba(160,170,190,.15)" });
    const glass = E.h("div", "", lid);
    E.css(glass, { position: "absolute", left: "40px", right: "40px", top: "26px", bottom: 0, borderRadius: "16px 16px 0 0", background: "linear-gradient(180deg, #0a1022 0%, #050812 40%, #030305 100%)" });
    const host = E.h("div", "", glass);
    E.css(host, { position: "absolute", left: "50%", top: 0, width: 0, height: 0 });
    const isl = new C.Island(host, { em: 34, width: 24 });
    const spill = E.h("div", "", glass);
    E.css(spill, { position: "absolute", left: "50%", top: 0, width: "1600px", height: "900px", marginLeft: "-800px", background: "radial-gradient(45% 45% at 50% 0%, rgba(40,110,255,.42), rgba(20,60,200,.12) 55%, transparent 75%)" });
    const sheen = E.h("div", "", top);
    E.css(sheen, { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.05) 45%, transparent 60%)" });
    const T = S.S20[0];
    E.cue(T, "dark", { g: 0.7 });
    E.cue(T + 1.4, "open", { g: 0.7 });
    E.cue(T + 1.45, "riser2", { g: 0.5 });
    return (lt, t) => {
      const part2 = lt >= 1.4;
      mac.el.style.display = part2 ? "none" : "";
      top.style.display = part2 ? "" : "none";
      if (!part2) {
        mac.render(t, { zoom: E.lerp(1.0, 1.16, lt / 1.4), exposure: 1.25 * E.k(lt, 0, 0.35) });
        const cx = E.kf(lt, [[0, 1250], [0.6, 980, ez.out], [1.4, 1010]]), cy = E.kf(lt, [[0, 660], [0.6, 560, ez.out], [1.4, 600]]);
        cur.render(cx, cy, { o: E.k(lt, 0.15, 0.1) });
        return;
      }
      cur.render(0, 0, { o: 0 });
      const u = lt - 1.4;
      const tilt = E.lerp(58, 42, E.k(u, 0, 1.1, ez.out));
      E.tf(lid, { rx: tilt, y: E.lerp(60, 0, E.k(u, 0, 1.1, ez.out)), s: E.lerp(1.15, 1.0, E.k(u, 0, 1.1, ez.out)) });
      const o = E.k(u, 0.05, 0.6, ez.island);
      isl.render({ w: E.lerp(11, 24, o), h: E.lerp(1.4, 7.6, o), open: o, content: E.k(u, 0.2, 0.3) });
      isl.setIcon("rec");
      isl.setText("make this sound more formal", E.k(u, 0.25, 0.7, ez.linear), { dim: 0 });
      isl.face.render({ mood: "listen", t: u });
      isl.wave.render("listen", t, { amp: o });
      E.op(spill, o * (0.85 + 0.15 * Math.sin(u * 7)));
      E.tf(sheen, { x: E.lerp(-300, 300, u / 1.1) });
    };
  });
})();
