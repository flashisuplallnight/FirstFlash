/* S30–S35 — Download for Mac · montage · voice cloud → orb → logo · lockup · "say it. swaey does it." pill · out.
   Mirrors reference frames f_0420–f_0505 (see docs/SHOTS.md). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, C = E.C, K = E.K, ez = E.ease;
  const S = K.S;

  /* ================= S30 · Download for Mac (42.0–44.0) ================= */
  E.shot("S30", (root) => {
    const bg = FX.sunset(root, 1920, 1080);
    const btn = E.h("div", "", root);
    E.css(btn, { position: "absolute", left: "960px", top: "540px", transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: "12px", padding: "0 30px", height: "86px", borderRadius: "14px", background: "#111", color: "#fff", font: "500 38px/1 var(--sf)", letterSpacing: "-0.01em", whiteSpace: "nowrap", boxShadow: "0 1px 0 rgba(255,255,255,.08) inset, 0 10px 30px -14px rgba(0,0,0,.45)" });
    btn.innerHTML = M.icon("apple", 34) + "<span>Download for Mac</span>";
    const cur = FX.cursor(root, { size: 34 });
    // the reference re-frames the button between hard cuts (f_0420–f_0440)
    const CUTS = [[0.0, 960, 540, 1.0], [0.5, 640, 540, 0.92], [1.0, 1280, 470, 1.08], [1.5, 960, 600, 1.0]];
    E.cue(S.S30[0] + 1.62, "click", { g: 1 });
    E.cue(S.S30[0] + 1.66, "check", { g: 0.5 });
    return (lt, t) => {
      bg.render(t);
      let c = CUTS[0];
      for (const k of CUTS) if (lt >= k[0]) c = k;
      const [, x, y, s] = c;
      const press = FX.pressAt ? FX.pressAt(lt, [1.62]) : 0;
      btn.style.left = x + "px"; btn.style.top = y + "px";
      btn.style.transform = `translate(-50%,-50%) scale(${(s * (1 - 0.05 * press)).toFixed(3)})`;
      btn.style.background = lt > 1.62 ? "#2a2326" : "#111";
      const ca = E.k(lt, 1.0, 0.55, ez.out);
      const tx = x + 60 * s, ty = y + 30 * s;
      cur.render(E.lerp(tx + 260, tx, ca), E.lerp(ty + 220, ty, ca), { press, o: lt > 1.0 ? 1 : 0 });
    };
  });

  /* ================= S31 · montage (44.0–46.0) ================= */
  E.shot("S31", (root) => {
    const bg = FX.sunset(root, 1920, 1080);
    const kinds = ["messages", "calendar", "maps", "youtube", "mail"];
    const cuts = kinds.map((k) => {
      const c = K.card(k, 1180, 740, 0.86);
      root.appendChild(c.el);
      E.css(c.el, { left: 960 - 590 + "px", top: 540 - 370 + "px", borderRadius: "14px" });
      return c;
    });
    const d = (S.S31[1] - S.S31[0]) / cuts.length;
    cuts.forEach((_, i) => E.cue(S.S31[0] + i * d, "cut", { g: 0.55 }));
    return (lt, t) => {
      bg.render(t);
      const i = Math.min(cuts.length - 1, Math.floor(lt / d));
      cuts.forEach((c, j) => {
        c.el.style.display = j === i ? "" : "none";
        if (j === i) { const u = (lt - j * d) / d; E.tf(c.el, { s: E.lerp(0.97, 1.02, u) }); if (c.ok && c.ok.render) { try { c.ok.render(1 + u, {}); } catch (e) {} } }
      });
    };
  });

  /* ================= S32 · voice cloud → orb → logo (46.0–46.8) ================= */
  E.shot("S32", (root) => {
    root.style.background = "var(--cream)";
    const vc = FX.voiceCloud(root, { seed: 41, size: 20, count: 46, area: { x: 560, y: 300, w: 800, h: 480 } });
    const lg = FX.orbLogo(root, { x: 960, y: 540, size: 96, speed: 1.6, timing: { smudge: 0, orb: 0.06 } });
    E.cue(S.S32[0] + 0.3, "logo", { g: 0.8 });
    return (lt) => {
      vc.render(lt, { p: 1, out: E.k(lt, 0.12, 0.2, ez.linear) });
      const u = lt - 0.22;
      E.op(lg.el, u > 0 ? 1 : 0);
      if (u > 0) lg.render(u);
    };
  });

  /* ================= S33 · lockup (46.8–48.0) ================= */
  E.shot("S33", (root) => {
    root.style.background = "var(--cream)";
    const lk = FX.lockup(root, { x: 960, y: 540, size: 96 });
    return (lt) => { lk.face && lk.face.render({ mood: "neutral", blink: C.blinkAt([0.6], lt) }); };
  });

  /* ================= S34 · "say it. swaey does it." (48.0–49.5) + S35 hold (49.5–50.5) ================= */
  E.shot("S34", (root) => {
    root.style.background = "var(--cream)";
    const pl = FX.pill(root, { x: 960, y: 540, size: 50 });
    const txt = "say it. swaey does it.";
    // words land on the beat like the reference's 'Build' → 'Build it' → 'Build it your way'
    const W = [[0.0, 2], [0.32, 3], [0.62, 5]];
    W.forEach(([t]) => E.cue(S.S34[0] + t, "tick", { g: 0.5, v: 3 }));
    return (lt) => {
      let k = 1;
      for (const [t, n] of W) if (lt >= t) k = n;
      const n = FX.wordsN(txt, k);
      pl.render({ text: txt, n, tint: 1 - E.k(lt, 0.05, 0.4, ez.linear), outline: lt < 1.0 ? 1 : 1 - E.k(lt, 1.0, 0.3, ez.linear), t: lt, jitter: lt < 1.0 ? 1.5 : 0 });
    };
  }, { post: S.S35[1] - S.S34[1] - 0.3 });

  E.shot("S35", (root) => {
    root.style.background = "#000";
    return (lt) => {};
  }, { pre: -(S.S35[1] - S.S35[0] - 0.3) });
})();
