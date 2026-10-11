/* S16 Activity window (ref 'My Rides' f_0210–f_0224) · S17 toolbar zoom + click (f_0224–f_0230) ·
   S19 code editor: claude code fixes the failing test (f_0250–f_0270). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, K = E.K, ez = E.ease;
  const S = K.S;

  /* ================= S16 · Activity (21.0–22.4) ================= */
  E.shot("S16", (root) => {
    const bg = FX.sunset(root, 1920, 1080);
    const holder = E.h("div", "", root);
    E.css(holder, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px", transformOrigin: "50% 30%" });
    const act = M.activity(holder, { x: 250, y: 120, w: 900, h: 560, zoom: 1.6 });
    const T = S.S16[0];
    E.cue(T, "whooshIn", { g: 0.5 });
    act.rows.forEach((r, i) => E.cue(T + 0.12 + i * 0.08, "tick", { g: 0.22, v: i }));
    // hard re-frame half way (ref f_0212 → f_0218)
    return (lt, t) => {
      bg.render(t);
      act.rows.forEach((r, i) => E.op(r, E.k(lt, 0.1 + i * 0.08, 0.15)));
      const cut2 = lt >= 0.7;
      E.tf(holder, cut2 ? { x: -180, y: 40, s: 1.12 + (lt - 0.7) * 0.03 } : { x: 0, y: 0, s: 1 + lt * 0.03 });
    };
  });

  /* ================= S17 · toolbar zoom + click (22.4–23.0) ================= */
  E.shot("S17", (root) => {
    const bg = FX.sunset(root, 1920, 1080);
    const holder = E.h("div", "", root);
    E.css(holder, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px" });
    const Z = 4.2;
    const act = M.activity(holder, { x: 0, y: 0, w: 900, h: 560, zoom: Z });
    const cur = FX.cursor(root, { size: 64 });
    const T = S.S17[0];
    E.cue(T + 0.3, "click", { g: 1 });
    return (lt, t) => {
      bg.render(t);
      // frame the toolbar icons: place the </> button near frame centre-left like the ref's GitHub icon
      const ic = act.toolbarIcons.code;
      const r = E.rect(ic);
      const want = { x: 760, y: 330 };
      const cur0 = { x: parseFloat(act.el.style.left || 0) * Z, y: parseFloat(act.el.style.top || 0) * Z };
      // shift the holder so the icon lands on `want` (computed from the un-shifted layout once)
      if (holder._dx == null) { holder._dx = want.x - (r.left + r.width / 2); holder._dy = want.y - (r.top + r.height / 2); }
      const drift = lt * 14;
      E.tf(holder, { x: holder._dx - drift, y: holder._dy });
      const hover = lt > 0.12;
      ic.classList.toggle("on", hover);
      const press = FX.pressAt(lt, [0.3]);
      const cx = want.x - drift + 10, cy = want.y + 22;
      const ca = E.k(lt, 0, 0.25, ez.out);
      cur.render(E.lerp(cx + 160, cx, ca), E.lerp(cy + 120, cy, ca), { press });
      act.toolbarIcons.code.style.background = press > 0.2 ? "rgba(0,0,0,.14)" : hover ? "rgba(0,0,0,.07)" : "";
    };
  });

  /* ================= S19 · code editor (25.0–27.0) ================= */
  E.shot("S19", (root) => {
    root.style.background = "#0d0d0d";
    const holder = E.h("div", "", root);
    E.css(holder, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px", transformOrigin: "40% 35%" });
    const ed = M.editor(holder, { x: 270, y: 90, w: 1100, h: 680, zoom: 1.25 });
    const total = 600;
    const T = S.S19[0];
    K.typeCues(T + 0.05, "XCTAssertEqual(Plan.pro.monthly, 15)".repeat(2), 70, 3, 0.35);
    E.cue(T + 0.95, "think", { g: 0.5 });
    E.cue(T + 1.2, "card", { g: 0.5 });
    E.cue(T + 1.45, "check", { g: 0.7 });
    return (lt) => {
      const typed = E.lerp(0, total, E.k(lt, 0.0, 0.85, ez.linear));
      const peek = E.k(lt, 1.15, 0.25, ez.outCubic);
      const fixed = E.k(lt, 1.45, 0.15, ez.linear);
      ed.render({ typed, peek, fixed, t: lt });
      // camera: start wide, push toward the failing line, drift (ref moves between framings)
      const push = E.k(lt, 0.85, 0.5, ez.inOutCubic);
      E.tf(holder, { s: E.lerp(1, 1.55, push), x: E.lerp(0, 120, push), y: E.lerp(0, 40, push), o: 1 - E.k(lt, 1.75, 0.25, ez.inCubic) });
    };
  });
})();
