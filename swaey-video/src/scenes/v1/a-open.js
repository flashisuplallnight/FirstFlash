/* Act 1 — hook, notch reveal + logo, live demo, "say it. swaey does it." */
(function () {
  const E = window.E, C = E.C, K = E.K, T = K.T, ez = E.ease;

  /* ============ HOOK: you type at 40 wpm → you talk at 150 ============ */
  E.scene("hook", T.hook[0], T.hook[1], (root) => {
    const bg = E.h("div", "fill dots", root);
    const cam = E.h("div", "fill", root);
    E.css(cam, { transformOrigin: "50% 0%" });

    const wave = new C.Wave(cam, 1700, 420, { bar: 9, gap: 7 });
    E.css(wave.c, { position: "absolute", left: "110px", top: "300px" });

    const line = E.h("div", "abs display", cam);
    E.css(line, { left: 0, right: 0, top: "400px", textAlign: "center", fontSize: "168px", letterSpacing: "-0.055em", whiteSpace: "nowrap" });
    const mk = (txt, cls = "") => { const s = E.h("span", cls, line); s.style.display = "inline-block"; s.style.verticalAlign = "top"; if (txt) s.textContent = txt; return s; };
    const w1 = mk("you ");
    const slot1 = mk("", "slot");
    E.css(slot1, { overflow: "hidden", height: "1.2em", paddingRight: ".02em" });
    const s1a = E.h("div", "", slot1); s1a.textContent = "type"; E.css(s1a, { height: "1.2em" });
    const s1b = E.h("div", "", slot1); s1b.textContent = "talk"; E.css(s1b, { height: "1.2em", color: "var(--electric)" });
    const w2 = mk(" at ");
    const num = mk("40", "num");
    E.css(num, { fontVariantNumeric: "tabular-nums", minWidth: "1.1em", textAlign: "right" });
    const w3 = mk(" wpm.");
    w3.style.color = "rgba(0,0,0,.28)";
    [w1, slot1, w2, num, w3, s1a, s1b].forEach((s) => (s.style.lineHeight = "1.2"));
    E.css(slot1, { minWidth: "2.05em" });

    const caret = E.h("div", "abs", cam);
    E.css(caret, { width: "10px", height: "150px", borderRadius: "5px", background: "var(--electric)", top: "430px" });

    const line2 = E.h("div", "abs h2", cam);
    E.css(line2, { left: 0, right: 0, top: "680px", textAlign: "center", fontSize: "76px", color: "rgba(0,0,0,.55)", whiteSpace: "nowrap" });
    const l2a = E.h("span", "", line2); l2a.textContent = "yet your mac still waits for a ";
    const l2b = E.h("span", "", line2); l2b.textContent = "click."; E.css(l2b, { color: "#000", display: "inline-block" });

    const cursor = new C.Cursor(cam, { size: 2.1 });

    // the notch that swallows the frame at the end
    const notch = E.h("div", "abs", root);
    E.css(notch, { left: "50%", top: 0, background: "#000", zIndex: 50 });

    // typing: "you type at 40 wpm." between 0.12s and 1.15s
    const typed = "you type at 40 wpm.";
    const t0 = 0.12, cps = 19;
    K.typeCues(t0, typed, cps, 1, 0.55);
    E.cue(E.b(3), "slot", { g: 0.9 });
    E.cue(E.b(3), "hit", { g: 0.8 });
    E.cue(E.b(5), "type2", { g: 0.5 });
    K.typeCues(E.b(5), "yet your mac still waits for a click.", 62, 3, 0.35);
    E.cue(2.95, "click", { g: 0.9 });
    E.cue(3.13, "click", { g: 0.9 });
    E.cue(3.0, "suck", { g: 0.9 });
    E.flashes = (E.flashes || []).concat([{ t: T.hook[1], d: 0.3, a: 0.4 }]);

    return (lt) => {
      const B3 = E.b(3), B5 = E.b(5);
      // ---- phase A: typed line
      const n = (lt - t0) * cps;
      const parts = [[w1, "you ", 0], [s1a, "type", 4], [w2, " at ", 8], [num, "40", 12], [w3, " wpm.", 14]];
      for (const [el, full, off] of parts) {
        if (el === num && lt >= B3) continue;
        const k = E.clamp(Math.floor(n) - off, 0, full.length);
        const txt = full.slice(0, k);
        if (el._t !== txt) { el._t = txt; el.textContent = txt; }
      }
      // caret follows the typed text
      const typing = lt < t0 + typed.length / cps + 0.25;
      const last = n < 4 ? w1 : n < 8 ? slot1 : n < 12 ? w2 : n < 14 ? num : w3;
      const r = last.offsetLeft + last.offsetWidth;
      E.css(caret, { left: Math.max(r, 20) + 8 + "px", opacity: typing ? (Math.floor(lt * 3.2) % 2 === 0 || n < typed.length ? 1 : 0.15) : 0 });
      if (lt < t0) E.css(caret, { left: "955px", opacity: Math.floor(lt * 5) % 2 ? 0.2 : 1 });

      // ---- phase B: type → talk, 40 → 150
      const p = E.k(lt, B3, 0.42, ez.inOutExpo);
      E.tf(s1a, { y: -p * 202 });
      E.tf(s1b, { y: -p * 202 });
      if (lt >= B3) {
        const c = Math.round(E.lerp(40, 150, E.k(lt, B3, 0.5, ez.outExpo)));
        if (num._t !== "" + c) { num._t = "" + c; num.textContent = c; }
        num.style.color = "var(--electric)";
      } else num.style.color = "";
      const punch = E.k(lt, B3, 0.6, ez.outCubic);
      E.tf(line, { s: 1 + Math.sin(punch * Math.PI) * 0.035 });
      const wa = E.k(lt, B3, 0.35, ez.outExpo) * (1 - E.k(lt, B5 - 0.1, 0.4));
      wave.render("burst", lt * 0.9, { amp: wa * 0.95, core: "#0f7fff", tip: "#9ec5ff", under: "rgba(15,127,255,.25)", glow: "rgba(15,127,255,.55)", blur: 18 });
      E.op(wave.c, wa * 0.22);

      // ---- phase C: "yet your mac still waits for a click."
      const q = E.k(lt, B5, 0.45, ez.out);
      E.tf(line, { y: -q * 120, s: E.lerp(1, 0.86, q) + Math.sin(punch * Math.PI) * 0.035 });
      const full2 = "yet your mac still waits for a ";
      const m = (lt - B5) * 62;
      K.typeInto(l2a, full2, m);
      K.typeInto(l2b, "click.", m - full2.length);
      E.tf(line2, { y: -q * 120 + (1 - q) * 30, o: q });
      const cl = [2.95, 3.13];
      let press = 0;
      cl.forEach((c) => { const u = lt - c; if (u > 0 && u < 0.2) press = Math.max(press, Math.sin((u / 0.2) * Math.PI)); });
      E.tf(l2b, { s: 1 - press * 0.08 });
      const cx = l2b.offsetLeft + l2b.offsetWidth * 0.55, cy = 680 - 120 + 70;
      const ca = E.k(lt, 2.55, 0.35, ez.out);
      cursor.render(E.lerp(1700, cx, ca), E.lerp(1050, cy, ca), lt, cl, ca);

      // ---- exit: sucked into the notch
      const s = E.k(lt, 3.18, 0.57, ez.inExpo);
      E.tf(cam, { y: -s * 260, s: 1 - s * 0.82, blur: s * 18, o: 1 - E.k(lt, 3.5, 0.2) });
      const g = E.k(lt, 3.5, 0.25, ez.inExpo);
      const nw = E.lerp(0, 330, E.k(lt, 3.0, 0.35, ez.out)) + s * 120 + g * 2200;
      const nh = E.lerp(0, 69, E.k(lt, 3.0, 0.35, ez.out)) + s * 30 + g * 1300;
      E.css(notch, { width: nw + "px", height: nh + "px", marginLeft: -nw / 2 + "px", borderRadius: `0 0 ${nh * 0.45}px ${nh * 0.45}px`, opacity: lt > 3.0 ? 1 : 0 });
      E.op(bg, 1);
    };
  });

  /* ============ NOTCH: the island bursts out · logo lockup ============ */
  E.scene("notch", T.notch[0], T.notch[1], (root) => {
    const L1 = E.bar; // first bar: the Mac; second bar: logo
    const macWrap = E.h("div", "fill", root);
    E.css(macWrap, { background: "#000", perspective: "2000px" });
    const cam = E.h("div", "fill", macWrap);
    const mac = K.macScreen(cam, { w: 2060, h: 1300, notchW: 330, notchH: 46 });
    E.css(mac.el, { left: "-70px", top: "-24px" });
    const ring = E.h("div", "abs", mac.scr);
    E.css(ring, { left: "50%", top: "0", width: "200px", height: "200px", borderRadius: "50%", border: "6px solid rgba(255,255,255,.8)", boxShadow: "0 0 24px rgba(158,197,255,.9)" });
    const isl = new C.Island(mac.notch, { em: 30, width: 28 });
    const glowFloor = E.h("div", "abs", mac.scr);
    E.css(glowFloor, { left: "50%", top: 0, width: "1400px", height: "700px", marginLeft: "-700px", background: "radial-gradient(50% 50% at 50% 0%, rgba(80,160,255,.42), transparent 70%)" });

    // logo lockup
    const logo = E.h("div", "fill dots", root);
    const morph = E.h("div", "abs", logo);
    const mark = K.appMark(logo, 300);
    const word = E.h("div", "abs display", logo);
    E.css(word, { fontSize: "250px", top: "380px", left: "0", whiteSpace: "nowrap" });
    const letters = E.chars(word, "heyswaey");
    const tag = E.h("div", "abs", logo);
    E.css(tag, { left: 0, right: 0, top: "700px", textAlign: "center", fontSize: "40px", fontWeight: 500, letterSpacing: "-0.03em", color: "rgba(0,0,0,.55)" });
    const tagWords = E.words(tag, "a voice agent that lives in your mac’s notch");

    E.cue(T.notch[0], "drop", { g: 1 });
    E.cue(T.notch[0] + 0.02, "notch", { g: 1 });
    E.cue(T.notch[0] + 1.02, "chime", { g: 0.55 });
    E.cue(T.notch[0] + L1 - 0.18, "whooshIn", { g: 0.7 });
    E.cue(T.notch[0] + L1, "logo", { g: 1 });
    E.cue(T.notch[0] + L1 + 0.5, "letters", { g: 0.6 });
    E.cue(T.notch[0] + L1 + 1.62, "whoosh", { g: 0.6 });

    const blinks = [0.7, 2.6, 3.2];
    return (lt, t) => {
      const onMac = lt < L1;
      macWrap.style.display = onMac ? "" : "none";
      logo.style.display = onMac ? "none" : "";
      if (onMac) {
        // camera eases out from a tight push on the notch
        const z = E.k(lt, 0, 1.8, ez.outCubic);
        E.tf(cam, { s: E.lerp(1.42, 1.06, z), y: E.lerp(260, 30, z), rx: E.lerp(-6, 0, z) });
        cam.style.transformOrigin = "50% 0%";
        mac.wall.render(t, { uDark: 0.15 });
        // island
        const o = E.k(lt, 0, 0.7, ez.island);
        const close = E.k(lt, 1.58, 0.28, ez.inCubic);
        const speak = lt > 0.98;
        const w = E.lerp(11, 30, o) - close * 19;
        const h = E.lerp(2.3, speak ? 9.6 : 9.6, o) - close * 7.3;
        isl.render({ w, h, open: o * (1 - close), content: E.k(lt, 0.12, 0.3) * (1 - E.k(lt, 1.5, 0.12)) });
        isl.setIcon(speak ? "speaker" : "rec");
        if (!speak) isl.setText("hey swaey", E.k(lt, 0.1, 0.55, ez.linear), { dim: 0 });
        else isl.setText("hi! i live in your notch.", E.k(lt, 1.02, 0.5, ez.linear));
        isl.face.render(Object.assign(C.moodAt([[0, "listen"], [0.98, "talk"], [1.5, "happy"]], lt), { blink: C.blinkAt(blinks, lt), t: lt }));
        isl.wave.render(speak ? "speak" : "listen", t, { amp: o });
        // shockwave + floor glow on the drop
        const rp = E.k(lt, 0, 0.9, ez.outExpo);
        E.css(ring, { transform: `translate(-50%,-50%) scale(${(0.2 + rp * 9).toFixed(3)})`, opacity: ((1 - rp) * 0.9).toFixed(3), display: rp > 0.97 ? "none" : "" });
        E.op(glowFloor, o * (1 - close) * (0.8 + 0.2 * Math.sin(lt * 6)));
        return;
      }
      // ---------- logo ----------
      const u = lt - L1;
      const m = E.k(u, 0, 0.55, ez.inOutExpo);
      // the black notch shape drops and becomes the app icon
      const w = E.lerp(330, 300, m), h = E.lerp(69, 300, m);
      const x = 960 - w / 2, y = E.lerp(0, 390 - 150, m);
      const slide = E.k(u, 0.62, 0.55, ez.inOutExpo);
      const lockX = -545 * slide;
      E.css(morph, { left: x + lockX + "px", top: y + "px", width: w + "px", height: h + "px", background: "#000", borderRadius: m < 0.98 ? `${E.lerp(0, 67, m)}px ${E.lerp(0, 67, m)}px ${E.lerp(31, 67, m)}px ${E.lerp(31, 67, m)}px` : "67px", opacity: m < 0.98 ? 1 : 0 });
      const ms = E.spring(u - 0.5);
      E.css(mark.el, { left: 960 - 150 + lockX + "px", top: 390 - 150 + "px" });
      E.tf(mark.el, { s: u < 0.5 ? 0.0001 : 0.92 + 0.08 * ms, o: u < 0.5 ? 0 : 1 });
      mark.face.render(Object.assign(C.moodAt([[0, "neutral"], [1.25, "happy"]], u), { blink: C.blinkAt([1.0], u), draw: E.k(u, 0.55, 0.5, ez.out), eyes: E.k(u, 0.5, 0.2) }));
      // wordmark
      const wx = 960 - 545 + 200 + 40;
      E.css(word, { left: wx + "px" });
      letters.forEach((s, i) => {
        const p = E.k(u, 0.78 + i * 0.045, 0.55, ez.out);
        E.tf(s, { y: (1 - p) * 120, o: p, blur: (1 - p) * 10 });
      });
      tagWords.forEach((s, i) => {
        const p = E.k(u, 1.2 + i * 0.04, 0.5, ez.out);
        E.tf(s, { y: (1 - p) * 26, o: p });
      });
      // exit
      const ex = E.k(u, 1.62, 0.25, ez.inCubic);
      E.tf(logo, { s: 1 + ex * 0.25, blur: ex * 14, o: 1 - ex });
    };
  });

  /* ============ DEMO: "hey swaey, play some lofi" ============ */
  E.scene("demo", T.demo[0], T.demo[1], (root) => {
    E.css(root, { background: "#04050a", perspective: "2200px" });
    const cam = E.h("div", "fill", root);
    E.css(cam, { transformStyle: "preserve-3d" });
    const mac = K.macScreen(cam, { w: 1820, h: 1150, notchW: 286, notchH: 40, app: "YouTube" });
    E.css(mac.el, { left: "50px", top: "60px" });
    const isl = new C.Island(mac.notch, { em: 26, width: 26 });

    // now-playing card
    const card = E.h("div", "abs", mac.scr);
    E.css(card, { left: "50%", width: "720px", marginLeft: "-360px", top: "330px", height: "150px", borderRadius: "28px", background: "rgba(10,12,22,.78)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,.08), 0 40px 80px -30px rgba(0,0,0,.7)", display: "flex", alignItems: "center", gap: "26px", padding: "0 30px", color: "#fff" });
    card.innerHTML = `<div style="width:96px;height:96px;border-radius:18px;background:radial-gradient(80% 80% at 30% 20%,#ffb46b,#c25bd6 55%,#3b2a8f);position:relative;flex:none;box-shadow:0 10px 30px rgba(194,91,214,.5)">
      <div style="position:absolute;left:18px;bottom:16px;width:40px;height:28px;border-radius:6px;background:rgba(255,255,255,.85)"></div></div>
      <div style="flex:1;min-width:0"><div style="font:600 30px/1.15 var(--sans);letter-spacing:-.02em">lofi hip hop radio · beats to relax/study to</div>
      <div style="font:500 22px/1.4 var(--sans);opacity:.55;margin-top:6px">Lofi Girl · YouTube</div>
      <div style="margin-top:14px;height:6px;border-radius:3px;background:rgba(255,255,255,.15)"><div class="np-bar" style="height:100%;width:30%;border-radius:3px;background:linear-gradient(90deg,#9ec5ff,#0f7fff)"></div></div></div>
      <div class="eq" style="display:flex;gap:6px;align-items:flex-end;height:56px"><i></i><i></i><i></i><i></i></div>`;
    const eqBars = [...card.querySelectorAll(".eq i")];
    eqBars.forEach((b) => E.css(b, { display: "block", width: "9px", borderRadius: "4px", background: "#9ec5ff" }));
    const npBar = card.querySelector(".np-bar");

    // ⌥ ↑ keycaps floating in front
    const keys = E.h("div", "abs", root);
    E.css(keys, { left: "120px", top: "690px", width: "420px", height: "260px" });
    const k1 = C.Keycap(keys, "⌥", { w: 170, h: 170, sub: "option" });
    const k2 = C.Keycap(keys, "↑", { w: 170, h: 170 });
    E.css(k2.el, { left: "200px" });
    const plus = E.h("div", "abs", root);

    const D = T.demo[0];
    E.cue(D + 0.12, "keydown", { g: 0.9 });
    E.cue(D + 0.18, "open", { g: 0.8 });
    E.cue(D + 1.18, "think", { g: 0.5 });
    E.cue(D + 1.55, "pop", { g: 0.7 });
    E.cue(D + 1.6, "card", { g: 0.7 });
    E.cue(D + 2.3, "check", { g: 0.7 });
    E.cue(D + 2.56, "whip", { g: 0.8 });

    return (lt, t) => {
      const drift = E.k(lt, 0, 2.8, ez.linear);
      const ex = E.k(lt, 2.56, 0.25, ez.inExpo);
      E.tf(cam, { ry: E.lerp(-9, -3, drift) - ex * 25, rx: E.lerp(7, 4, drift), x: E.lerp(40, -10, drift) - ex * 1600, s: E.lerp(1.02, 1.08, drift), blur: ex * 10 });
      mac.wall.render(t, { uDark: 0.25 });
      // island phases
      const o = E.k(lt, 0.15, 0.62, ez.island);
      const phase = lt < 1.18 ? "listen" : lt < 1.55 ? "think" : "speak";
      const card_ = E.k(lt, 1.6, 0.6, ez.island);
      const h = phase === "speak" ? E.lerp(7.6, 10.2, E.k(lt, 1.55, 0.5, ez.island)) : 7.6;
      isl.render({ w: E.lerp(11, 26, o), h: E.lerp(1.55, h, o), open: o, content: E.k(lt, 0.3, 0.3) });
      isl.setIcon(phase === "listen" ? "rec" : phase === "think" ? "spin" : lt > 2.3 ? "check" : "speaker");
      const spin = isl.iconEl.querySelector(".spin");
      if (spin) spin.style.transform = `rotate(${(lt * 450) % 360}deg)`;
      if (phase === "listen") isl.setText("hey swaey, play some lofi", E.k(lt, 0.35, 0.8, ez.linear), { dim: 0 });
      else if (phase === "think") isl.setText("on it.", 1);
      else isl.setText("playing lofi girl on youtube. i’ll keep it low.", E.k(lt, 1.6, 0.75, ez.linear));
      isl.face.render(Object.assign(C.moodAt([[0, "listen"], [1.18, "think"], [1.55, "talk"], [2.3, "happy"]], lt), { blink: C.blinkAt([0.9, 2.5], lt), t: lt, draw: lt > 2.3 ? E.k(lt, 2.3, 0.45, ez.out) : undefined }));
      isl.wave.render(phase === "listen" ? "listen" : phase === "think" ? "think" : "speak", t, { amp: o });
      // card
      E.tf(card, { y: (1 - card_) * -120, s: 0.7 + 0.3 * card_, o: card_ });
      eqBars.forEach((b, i) => { b.style.height = (14 + 42 * Math.abs(Math.sin(t * (5 + i * 1.7) + i))).toFixed(1) + "px"; });
      npBar.style.width = (30 + lt * 3) + "%";
      // keys
      const kin = E.k(lt, 0, 0.35, ez.out);
      const press = lt > 0.12 && lt < 1.15 ? 1 : E.k(lt, 0.04, 0.08) * (1 - E.k(lt, 1.15, 0.1));
      k1.press(press); k2.press(press);
      E.tf(keys, { y: (1 - kin) * 120 + E.k(lt, 1.3, 0.5, ez.inCubic) * 500, rx: 30, rz: -8, o: kin });
    };
  });

  /* ============ SAYS: "say it. swaey does it." ============ */
  const SAYS = [
    ["email sarah i’ll be 10 minutes late", "b"], ["sent ✓", "w"], ["what’s on my calendar tomorrow?", "b"], ["put on some lofi on youtube", "b"],
    ["remind me to call mom at 7", "b"], ["on it.", "w"], ["find the invoice from last week", "b"], ["turn the volume down a bit", "b"],
    ["ask claude code to fix the failing test", "b"], ["focus mode", "b"], ["focus mode is on. slack’s closed.", "w"], ["remind me about the dentist tomorrow at 9", "b"],
    ["make this sound more formal", "b"], ["do i need an umbrella today?", "b"], ["reply to jake: sounds good, see you at 6", "b"], ["what’s this error on my screen?", "b"],
    ["good morning! here’s your day.", "w"], ["remember i use gmail", "b"],
  ];
  E.scene("says", T.says[0], T.says[1], (root) => {
    const bg = E.h("div", "fill dots", root);
    E.css(root, { perspective: "1600px" });
    const plane = E.h("div", "abs", root);
    E.css(plane, { left: "-700px", top: "-420px", width: "3320px", height: "1920px", transformStyle: "preserve-3d" });
    const rows = [];
    const rr = E.rng(7);
    for (let r = 0; r < 13; r++) {
      const row = E.h("div", "abs", plane);
      E.css(row, { left: 0, top: r * 148 + "px", height: "120px", whiteSpace: "nowrap" });
      let x = 0;
      const items = [];
      for (let j = 0; j < 9; j++) {
        const [txt, kind] = SAYS[(r * 5 + j * 3) % SAYS.length];
        const p = E.h("div", "pill " + (kind === "b" ? "pill-blue" : "pill-white"), row);
        E.css(p, { left: x + "px", top: "18px", fontSize: "40px" });
        p.textContent = txt;
        items.push(p);
        x += txt.length * 21 + 150 + rr() * 60;
      }
      rows.push({ row, dir: r % 2 ? 1 : -1, speed: 160 + rr() * 140, off: rr() * 600 });
    }
    const halo = E.h("div", "fill", root);
    E.css(halo, { background: "radial-gradient(40% 32% at 50% 50%, rgba(245,245,245,.98) 35%, rgba(245,245,245,.85) 60%, rgba(245,245,245,0) 100%)" });
    const t1 = E.h("div", "abs display", root);
    E.css(t1, { left: 0, right: 0, top: "330px", textAlign: "center", fontSize: "210px" });
    t1.textContent = "say it.";
    const t2 = E.h("div", "abs display", root);
    E.css(t2, { left: 0, right: 0, top: "540px", textAlign: "center", fontSize: "210px", color: "var(--electric)" });
    t2.innerHTML = "swaey does it.";
    const S = T.says[0];
    E.cue(S + 0.05, "whooshIn", { g: 0.6 });
    E.cue(S + E.b(1), "slam", { g: 0.9 });
    E.cue(S + E.b(3), "slam", { g: 1 });
    E.cue(S + 2.45, "whoosh", { g: 0.7 });
    return (lt) => {
      const a = E.k(lt, 0, 0.7, ez.outExpo);
      const ex = E.k(lt, 2.42, 0.38, ez.inExpo);
      E.tf(plane, { rx: 34 - a * 6, rz: -12, z: -500 + a * 300 + ex * 900, y: (1 - a) * 300 });
      rows.forEach((r) => E.tf(r.row, { x: r.dir * (lt * r.speed + r.off) - 400 }));
      const p1 = E.k(lt, E.b(1), 0.34, ez.outExpo), p2 = E.k(lt, E.b(3), 0.34, ez.outExpo);
      E.tf(t1, { s: E.lerp(1.6, 1, p1) * (1 + ex * 1.5), o: p1 * (1 - ex), blur: (1 - p1) * 20 + ex * 20, y: -ex * 120 });
      E.tf(t2, { s: E.lerp(1.6, 1, p2) * (1 + ex * 1.5), o: p2 * (1 - ex), blur: (1 - p2) * 20 + ex * 20, y: ex * 120 });
      E.op(halo, E.k(lt, 0.3, 0.4) * (1 - ex));
    };
  });
})();
