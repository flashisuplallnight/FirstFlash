/* S22–S29 — kinetic "Sent ⊙ Formal" · thermal push · "Show what left my Mac" · glitch → node grid ·
   privacy bento · confirm card · dot matrix · lime shield. Mirrors reference frames f_0320–f_0420. */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, C = E.C, K = E.K, ez = E.ease;
  const S = K.S;
  const tryKit = (fn, ...a) => { try { return fn ? fn(...a) : null; } catch (e) { console.warn("e-trust", e.message); return null; } };

  /* ================= S22 · "Sent ⊙ Formal" over the sent mail (32.0–33.0) ================= */
  E.shot("S22", (root) => {
    const desk = M.desktop(root, { w: 1920, h: 1080, wallpaper: "sonoma", app: "Mail", menubar: true, scale: 1.4 });
    const holder = E.h("div", "", desk.el);
    E.css(holder, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px" });
    let win = tryKit(M.compose, holder, { x: 300, y: 150, w: 880, h: 560, zoom: 1.5 });
    if (win && win.setBody) tryKit(win.setBody.bind(win), "Hi Sarah, I’m running about ten minutes late. See you shortly.", { changed: [] });
    if (!win) {
      win = M.window(holder, { x: 300, y: 150, w: 880, h: 560, title: "Running late", zoom: 1.5 });
      win.content.innerHTML = `<div style="padding:12px 18px;font-size:13px"><div style="border-bottom:.5px solid rgba(0,0,0,.1);padding:7px 0;color:rgba(0,0,0,.5)">To: <span style="color:#007aff">Sarah Chen</span></div><div style="border-bottom:.5px solid rgba(0,0,0,.1);padding:7px 0">Subject: Running late</div><div style="padding-top:14px;line-height:1.6;font-size:14px">Hi Sarah, I’m running about ten minutes late. See you shortly.</div></div>`;
    }
    const mq = FX.marquee(root, { text: "Sent ⊙ Formal ", size: 250, color: "#111111", x: 0, y: 560, repeat: 3, iri: true });
    E.cue(S.S22[0], "slam", { g: 0.7 });
    E.cue(S.S22[0] + 0.6, "whooshIn", { g: 0.5 });
    return (lt) => {
      // camera pushes in on the type (ref f_0320 → f_0330)
      const push = E.k(lt, 0.55, 0.45, ez.inCubic);
      E.tf(desk.el, { s: 1 + push * 0.5 });
      mq.render(lt * 260 + 40, { iri: E.k(lt, 0.55, 0.35, ez.linear) });
      E.tf(mq.el, { s: 1 + push * 0.9, y: -push * 40 });
    };
  });

  /* ================= S23–S25 · thermal push · tooltip · glitch (33.0–36.0) ================= */
  E.shot("S23", (root) => {
    const th = FX.thermalImage(root, 1920, 1080, { src: "assets/wp/sonoma.jpg", scale: 0.5, seed: 5 });
    const btn = E.h("div", "", root, "Show what left my Mac");
    E.css(btn, { position: "absolute", left: "960px", top: "540px", transform: "translate(-50%,-50%)", padding: "16px 26px", borderRadius: "12px", background: "rgba(20,20,22,.94)", color: "#fff", font: "500 30px/1 var(--sf)", letterSpacing: "-.01em", whiteSpace: "nowrap", boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)" });
    const gt = FX.glitchTiles(root, 1920, 1080, { geom: th.geom, region: { x: 560, y: 160, w: 800, h: 480 } });
    const cur = FX.cursor(root, { size: 30 });
    const A = S.S23[0], B = S.S24[0], G = S.S25[0];
    // tooltip framings (hard cuts, ref f_0338–f_0352): top-centre → centre
    const POS = [[0, 960, 230], [0.55, 960, 540], [1.0, 960, 540]];
    E.cue(A, "whoosh", { g: 0.5 });
    E.cue(A + 0.35, "shimmer", { g: 0.5 });
    E.cue(B + 1.05, "click", { g: 0.9 });
    E.cue(G, "glitch", { g: 0.8 });
    return (lt, t) => {
      const u = t - A;                       // 0 … 3.0 across S23–S25
      const mix = E.k(u, 0.15, 0.55, ez.inOutCubic);
      const g = E.k(t, G + 0.05, 0.7, ez.inCubic);
      th.render(t, { mix, zoom: 1.05 + u * 0.06, flow: 1, glitch: g, grid: E.k(t, G + 0.1, 0.7, ez.outCubic) });
      const v = t - B;
      let p = POS[0];
      for (const q of POS) if (v >= q[0]) p = q;
      btn.style.left = p[1] + "px"; btn.style.top = p[2] + "px";
      const press = FX.pressAt(v, [1.05]);
      btn.style.transform = `translate(-50%,-50%) scale(${(1 - 0.05 * press).toFixed(3)})`;
      btn.style.background = v > 1.05 ? "rgba(48,40,44,.96)" : "rgba(20,20,22,.94)";
      E.op(btn, v < 0 ? 0 : 1 - E.k(t, G + 0.45, 0.2));
      gt.render(t, g, { geom: th.geom });
      const ca = E.k(v, 0.6, 0.4, ez.out);
      cur.render(E.lerp(1240, p[1] + 70, ca), E.lerp(800, p[2] + 14, ca), { press, o: v > 0.55 && t < G + 0.3 ? 1 : 0 });
    };
  }, { post: S.S25[1] - S.S23[1] });

  /* ================= S26 · privacy bento (36.0–37.6) ================= */
  E.shot("S26", (root) => {
    const b = FX.bento(root, 1920, 1080, { seed: 2, step: 0.2 });
    E.cue(S.S26[0], "drop", { g: 0.6 });
    for (let t = 0.2; t < 1.6; t += 0.2) E.cue(S.S26[0] + t, "tick", { g: 0.3, v: Math.round(t * 5) % 6 });
    return (lt) => b.render(lt, { p: E.clamp(lt / 0.5) });
  });

  /* ================= S27 · "Empty the Trash?" (37.6–39.6) ================= */
  E.shot("S27", (root) => {
    const w = FX.wash(root, 1920, 1080, { palette: "pastel", seed: 6 });
    let card = tryKit(M.confirmCard, root, { title: "Empty the Trash?", info: "3 items will be gone for good", cancel: "Cancel", ok: "Go ahead" });
    let okBtn = null;
    if (!card) {
      const c = M.window(root, { x: 0, y: 0, w: 410, h: 132, bar: "none" });
      c.tls.remove();
      c.content.innerHTML = `<div style="padding:16px 18px"><div style="font-weight:600;font-size:15px">Empty the Trash?</div><div style="margin-top:4px;color:#e0443e;font-size:12px">ⓘ <span style="color:rgba(0,0,0,.5)">3 items will be gone for good</span></div><div style="display:flex;align-items:center;gap:8px;justify-content:space-between;margin-top:18px"><span style="font-size:13px;color:rgba(0,0,0,.8)">Trash · 3 items</span><span style="display:flex;gap:8px"><span class="mac-btn">Cancel</span><span class="mac-btn okb" style="background:#111;color:#fff">Go ahead</span></span></div></div>`;
      card = { el: c.el };
      okBtn = c.el.querySelector(".okb");
    }
    const wrap = E.h("div", "", root);
    E.css(wrap, { position: "absolute", left: "960px", top: "540px", width: 0, height: 0 });
    wrap.appendChild(card.el);
    E.css(card.el, { position: "absolute", left: 0, top: 0, transform: "translate(-50%,-50%)", zoom: 1 });
    const cur = FX.cursor(root, { size: 30 });
    const CUTS = [[0, 960, 260, 1.35, 6], [0.5, 960, 540, 1.65, 0], [1.0, 1000, 540, 1.65, 0]];
    E.cue(S.S27[0], "open", { g: 0.5 });
    E.cue(S.S27[0] + 1.45, "click", { g: 1 });
    E.cue(S.S27[0] + 1.5, "trash", { g: 0.7 });
    return (lt, t) => {
      w.render(t, {});
      let c = CUTS[0];
      for (const q of CUTS) if (lt >= q[0]) c = q;
      wrap.style.left = c[1] + "px"; wrap.style.top = c[2] + "px";
      card.el.style.zoom = c[3];
      card.el.style.filter = c[4] ? `blur(${c[4]}px)` : "";
      const press = FX.pressAt(lt, [1.45]);
      if (card.render) card.render({ press: lt > 1.45 ? 1 : press });
      else if (okBtn) { okBtn.style.background = lt > 1.45 ? "#3a2a22" : "#111"; okBtn.style.transform = `scale(${(1 - 0.06 * press).toFixed(3)})`; }
      const r = E.rect(card.el);
      const tx = r.left + r.width * 0.86, ty = r.top + r.height * 0.78;
      const ca = E.k(lt, 1.0, 0.4, ez.out);
      cur.render(E.lerp(tx + 220, tx, ca), E.lerp(ty + 180, ty, ca), { press, o: lt > 1.0 ? 1 : 0 });
    };
  });

  /* ================= S28–S29 · dot matrix → lime shield (39.6–42.0) ================= */
  E.shot("S28", (root) => {
    root.style.background = "#1d1d1d";
    const tint = FX.wash(root, 1920, 1080, { palette: "night", seed: 9 });
    const d = FX.dotMatrix(root, 1920, 1080, { seed: 4 });
    E.cue(S.S28[0], "dark", { g: 0.7 });
    for (let t = 0.3; t < 1.3; t += 0.1) E.cue(S.S28[0] + t, "tick", { g: 0.18, v: Math.round(t * 10) % 6 });
    E.cue(S.S28[0] + 1.35, "rise", { g: 0.5 });
    return (lt, t) => {
      const ta = 1 - E.k(lt, 0.0, 0.5, ez.linear);
      E.op(tint.el, ta);
      if (ta > 0) tint.render(t, { alpha: ta });
      d.render(lt, { p: E.k(lt, 0.35, 0.9, ez.inOutQuad), condense: E.k(lt, 1.3, 0.6, ez.inOutCubic) });
    };
  });
  E.shot("S29", (root) => {
    root.style.background = "#1d1d1d";
    const s = FX.bigShield(root, 150, { x: 960, y: 540 });
    E.cue(S.S29[0], "check", { g: 0.8 });
    return (lt) => s.render(E.clamp(lt / 0.4));
  });
})();
