/* lab: fx-type — glyph captions, voice cloud, orb → logo, pills, marquee, type line, cursor.
   Slots (s):  A 0–2.4 S01 glyph hook · B 2.4–3.6 dense voice cloud · B2 3.6–4.4 airy voice cloud
               C 4.4–5.8 orb → logo · D 5.8–7.0 lockup + typing pill · E 7.0–8.2 face badge + pills + cursor
               F 8.2–9.4 marquee · G 9.4–11 dark type line */
(function () {
  const E = window.E, FX = E.FX;
  E.K.LAB_DURATION = 11;
  const cream = (root) => { root.style.background = FX.COL.cream; };

  /* ---------- A: S01 glyph hook ---------- */
  E.scene("A-hook", 0, 2.4, (root) => {
    cream(root);
    const gs = FX.glyphSequence(root, {
      y: 540, seed: 3,
      seq: [
        { t: 0.0, text: "", frame: "/" },
        { t: 0.2, text: "", frame: "//" },
        { t: 0.4, text: "What", frame: "/ /" },
        { t: 0.6, text: "What if", frame: "< >", glyphs: 3 },
        { t: 0.8, text: "What if", frame: "< >", glyphs: 9, frameTint: true },
        { t: 1.0, text: "your", glyphs: 12 },
        { t: 1.2, text: "your mac", glyphs: 16, accent: "mac" },
        { t: 1.45, text: "could just", glyphs: 18 },
        { t: 1.65, text: "could just", glyphs: 0 },
      ],
    });
    const vc = FX.voiceCloud(root, { seed: 5, size: 32, count: 28, area: { x: 150, y: 70, w: 1620, h: 940 }, exclude: { x: 960 - 330, y: 470, w: 660, h: 140 } });
    return (lt) => {
      gs.render(lt);
      vc.render(lt, { p: E.k(lt, 1.65, 0.5, E.ease.linear) });
    };
  });

  /* ---------- B: dense voice cloud (ref f_0460) behind a caption ---------- */
  E.scene("B-cloud", 2.4, 3.6, (root) => {
    cream(root);
    const vc = FX.voiceCloud(root, { seed: 11, size: 20, count: 46, area: { x: 120, y: 60, w: 1680, h: 960 }, exclude: { x: 620, y: 480, w: 680, h: 120 } });
    const gs = FX.glyphSequence(root, { y: 540, seq: [{ t: 0, text: "just listen?", accent: "listen?" }] });
    return (lt) => {
      vc.render(lt, { p: E.k(lt, 0, 0.7, E.ease.linear), out: E.k(lt, 0.95, 0.25, E.ease.linear) });
      gs.render(lt);
    };
  });

  /* ---------- B2: airy voice cloud (ref f_0020) ---------- */
  E.scene("B2-cloud", 3.6, 4.4, (root) => {
    cream(root);
    const vc = FX.voiceCloud(root, { seed: 21, size: 32, count: 28, area: { x: 140, y: 60, w: 1640, h: 960 }, exclude: { x: 640, y: 470, w: 640, h: 140 } });
    const gs = FX.glyphSequence(root, { y: 540, seq: [{ t: 0, text: "could just" }] });
    return (lt) => { vc.render(lt, { p: E.k(lt, 0, 0.45, E.ease.linear) }); gs.render(lt); };
  });

  /* ---------- C: orb → icon → wordmark ---------- */
  E.scene("C-logo", 4.4, 5.8, (root) => {
    cream(root);
    const lg = FX.orbLogo(root, { x: 960, y: 540, size: 96 });
    return (lt) => { lg.render(lt); };
  });

  /* ---------- D: lockup + typing pill (S33/S34) ---------- */
  E.scene("D-pill", 5.8, 7.0, (root) => {
    cream(root);
    const lk = FX.lockup(root, { x: 960, y: 300, size: 96 });
    const pl = FX.pill(root, { x: 960, y: 560, size: 50 });
    const txt = "say it. swaey does it.";
    const small = FX.lockup(root, { x: 960, y: 820, size: 48 });
    return (lt) => {
      const n = FX.wordsN(txt, 1 + FX.step(lt, 10) / 2);
      pl.render({ text: txt, n, tint: 1 - E.k(lt, 0.1, 0.5, E.ease.linear), outline: lt < 0.95 ? 1 : 0, t: lt, jitter: lt < 0.95 ? 1.5 : 0 });
    };
  });

  /* ---------- E: face badge + pills snap (S11) + cursor ---------- */
  E.scene("E-badge", 7.0, 8.2, (root) => {
    cream(root);
    const size = 50;
    const a = FX.pill(root, { size, align: "right" }), b = FX.pill(root, { size, align: "left" });
    const bd = FX.faceBadge(root, a.height);
    const cur = FX.cursor(root, { size: 28 });
    const aw = a.measure("Talk to").w, bw = b.measure("Calendar").w, bh = a.height;
    return (lt) => {
      const snap = E.k(lt, 0.7, 0.28, E.ease.outBack);
      const gap = E.lerp(46, -2, snap);
      const total = aw + bh + bw + gap * 2;
      const x0 = 960 - total / 2;
      E.tf(a.el, { x: x0 + aw, y: 540 });
      E.tf(bd.el, { x: x0 + aw + gap + bh / 2, y: 540 });
      E.tf(b.el, { x: x0 + aw + gap * 2 + bh, y: 540 });
      a.render({ text: "Talk to", n: E.clamp((lt - 0.0) / 0.25) * 7, tint: 1 - E.k(lt, 0.15, 0.3, E.ease.linear) });
      bd.render({ fill: E.k(lt, 0.55, 0.12, E.ease.linear), draw: E.k(lt, 0.05, 0.3), t: lt });
      b.render({ text: "Calendar", n: E.clamp((lt - 0.2) / 0.3) * 8, tint: 1 - E.k(lt, 0.4, 0.3, E.ease.linear), o: lt > 0.2 ? 1 : 0 });
      const bx = x0 + aw + gap + bh / 2;
      const cx = E.kf(lt, [[0, 1250], [0.45, 972, E.ease.out], [1.2, 972]]), cy = E.kf(lt, [[0, 760], [0.45, 556, E.ease.out], [1.2, 556]]);
      cur.render(cx, cy, { press: FX.pressAt(lt, [0.52]) });
    };
  });

  /* ---------- F: marquee ---------- */
  E.scene("F-marquee", 8.2, 9.4, (root) => {
    cream(root);
    const hero = E.h("div", "", root);
    E.css(hero, { position: "absolute", left: "160px", top: "90px", width: "1600px", height: "560px", borderRadius: "14px", overflow: "hidden", background: "linear-gradient(180deg,#3b4f78 0%,#a7769a 48%,#e7a07a 72%,#2a2233 100%)" });
    const m = FX.marquee(hero, { text: "lofi hip hop ⊙ radio ", size: 230, x: 60, y: 300, repeat: 3 });
    const m2 = FX.marquee(root, { text: "Sent ⊙ Formal", size: 220, x: 160, y: 850, color: "#111", iri: true, repeat: 2 });
    return (lt) => {
      m.render(lt * 520 + 120, { loop: true });
      m2.render(lt * 380, { iri: E.k(lt, 0.4, 0.5, E.ease.linear) });
    };
  });

  /* ---------- G: dark type line (S18) ---------- */
  E.scene("G-typeline", 9.4, 11.0, (root) => {
    root.style.background = FX.COL.night;
    const tl = FX.typeLine(root, { x: 960, y: 540, size: 74 });
    const text = "ask claude code to fix the failing test";
    return (lt) => {
      const n = E.clamp((lt - 0.3) / 0.75) * text.length;
      tl.render({
        text, n: FX.hold(n, 1), caretColor: lt < 0.3 ? FX.caretColor(lt, 10) : "#a98bff",
        highlights: [{ word: "claude code", kind: "coral", p: E.k(lt, 1.1, 0.12, E.ease.linear) }, { word: "failing test", kind: "select", p: E.k(lt, 1.25, 0.15, E.ease.outCubic) }],
        box: E.k(lt, 1.35, 0.2), caret: lt < 1.3 ? 1 : 0,
        arrowScale: E.lerp(1.45, 1, E.k(lt, 0.25, 0.4)), arrowDim: E.k(lt, 0.5, 0.6),
      });
      const s = E.lerp(2.6, 1, E.k(lt, 0.2, 1.0, E.ease.inOutCubic));
      E.tf(tl.el, { s });
    };
  });
})();
