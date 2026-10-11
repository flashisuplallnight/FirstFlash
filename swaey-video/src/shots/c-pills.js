/* S11 — "Talk to (face) Calendar" pills (f_0142–f_0155), then they drift top-left and fade over S12's
   colour bars (f_0155–f_0160). Loaded after c-plan.js so it sits on top of S12 during the hand-off. */
(function () {
  const E = window.E, FX = E.FX, K = E.K, ez = E.ease;
  const S = K.S;
  E.shot("S11", (root) => {
    const bg = E.h("div", "", root);
    E.css(bg, { position: "absolute", inset: 0, background: "var(--cream)" });
    const size = 50;
    const a = FX.pill(root, { size, align: "right" }), b = FX.pill(root, { size, align: "left" });
    const bd = FX.faceBadge(root, a.height);
    const aw = a.measure("Talk to").w, bw = b.measure("Calendar").w, bh = a.height;
    const T = S.S11[0];
    E.cue(T + 0.05, "pop", { g: 0.5 });
    E.cue(T + 0.35, "tick", { g: 0.45, v: 2 });
    E.cue(T + 0.6, "tick", { g: 0.45, v: 4 });
    E.cue(T + 1.0, "toggle", { g: 0.8 });
    return (lt, t) => {
      const dur = S.S11[1] - S.S11[0];
      // the reference first shows the icon alone on the left, then the full row, then it snaps
      const solo = lt < 0.3;
      const snap = E.k(lt, 1.0, 0.25, ez.outBack);
      const gap = E.lerp(46, -2, snap);
      const total = aw + bh + bw + gap * 2;
      // exit (into S12): drift to top-left, shrink, fade
      const ex = E.k(lt, dur, 0.45, ez.inOutCubic);
      E.op(bg, 1 - E.k(lt, dur - 0.02, 0.06, ez.linear));
      const cx = E.lerp(960, 420, ex), cy = E.lerp(540, 185, ex), sc = E.lerp(1, 0.86, ex);
      const x0 = cx - (total * sc) / 2;
      if (solo) {
        E.tf(bd.el, { x: 330, y: 540 });
        E.op(a.el, 0); E.op(b.el, 0);
      } else {
        E.op(a.el, 1); E.op(b.el, 1);
        E.tf(a.el, { x: x0 + aw * sc, y: cy, s: sc });
        E.tf(bd.el, { x: x0 + (aw + gap + bh / 2) * sc, y: cy, s: sc });
        E.tf(b.el, { x: x0 + (aw + gap * 2 + bh) * sc, y: cy, s: sc });
      }
      const fade = 1 - E.k(lt, dur + 0.15, 0.3, ez.linear);
      [a.el, b.el, bd.el].forEach((el) => (el.style.opacity = (solo && el !== bd.el ? 0 : fade).toFixed(3)));
      a.render({ text: "Talk to", n: E.clamp((lt - 0.3) / 0.2) * 7, tint: 0 });
      bd.render({ fill: E.k(lt, 0.9, 0.12, ez.linear), draw: E.k(lt, 0.0, 0.3), t: lt });
      b.render({ text: "Calendar", n: E.clamp((lt - 0.45) / 0.25) * 8, tint: 1 - E.k(lt, 0.75, 0.3, ez.linear) });
    };
  }, { post: 0.5, z: 6 });
})();
