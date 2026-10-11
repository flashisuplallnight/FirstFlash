/* S08 — the Skills tree builds like the reference's "Code Files" tree (f_0103–f_0118). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, K = E.K, ez = E.ease;
  const S = K.S;
  const GREY = "#aaa49f", LINE = "rgba(0,0,0,.08)";
  const fileIcon = (sz) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" style="flex:none"><path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z"/><path d="M14 3.5v4h4"/><path d="M10.5 12.5 9 14l1.5 1.5M13.5 12.5 15 14l-1.5 1.5" stroke-linecap="round"/></svg>`;
  const chev = (open, sz) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:rotate(${open ? 0 : -90}deg)"><path d="M6 9.5l6 6 6-6"/></svg>`;

  E.shot("S08", (root) => {
    root.style.background = "var(--cream)";
    const cam = E.h("div", "", root);
    E.css(cam, { position: "absolute", left: 0, top: 0, width: "1920px", height: "1080px", transformOrigin: "0 0" });
    const SZ = 50, ROW = 66, IND = 92;
    // [depth, label, kind ('folder'|'file'), appear time (s from shot start), open time for folders]
    const ROWS = [
      [0, "Skills", "folder", 0.0, 0.08],
      [1, "focus mode", "file", 0.08],
      [1, "good night", "file", 0.26],
      [1, "ship it", "folder", 0.42, 0.6],
      [2, "open editor", "file", 0.62],
      [2, "start the server", "file", 0.78],
      [2, "brief claude code", "file", 0.94],
      [3, "morning briefing", "file", 1.16],
    ];
    const X0 = 150, Y0 = 220;
    const els = ROWS.map(([d, label, kind], i) => {
      const r = E.h("div", "", cam);
      E.css(r, { position: "absolute", left: X0 + d * IND + "px", top: Y0 + i * ROW + "px", display: "flex", alignItems: "center", gap: "14px", font: `400 ${SZ}px/1 var(--sf)`, letterSpacing: "-0.01em", whiteSpace: "nowrap", color: GREY });
      r.innerHTML = (kind === "folder" ? `<span class="tv-ch">${chev(false, 30)}</span>` : `<span class="tv-ic">${fileIcon(34)}</span>`) + `<span class="tv-l">${label}</span>`;
      return r;
    });
    // indent guides
    const guides = [[0, 1, 7], [1, 4, 7], [2, 7, 7]].map(([d, a, b]) => {
      const g = E.h("div", "", cam);
      E.css(g, { position: "absolute", left: X0 + d * IND + 14 + "px", top: Y0 + a * ROW - 14 + "px", width: "1.5px", height: (b - a + 1) * ROW + "px", background: LINE, transformOrigin: "0 0" });
      return { g, a };
    });
    ROWS.forEach((r, i) => E.cue(S.S08[0] + r[3], "tick", { g: 0.4, v: i % 6 }));
    E.cue(S.S08[0] + 1.16, "pop", { g: 0.5 });
    return (lt) => {
      // camera: drift right/down as the tree grows (stop-motion steps like the reference)
      const h = FX.hold(lt, 12);
      const z = E.lerp(1.0, 1.12, E.k(h, 0, 1.5, ez.inOutCubic));
      const dx = E.lerp(0, -70, E.k(h, 0.4, 1.0, ez.inOutCubic)), dy = E.lerp(30, -110, E.k(h, 0.3, 1.1, ez.inOutCubic));
      E.tf(cam, { x: dx, y: dy, s: z });
      ROWS.forEach(([d, label, kind, t0, topen], i) => {
        const el = els[i];
        const u = lt - t0;
        E.op(el, u < 0 ? 0 : 1);
        const last = i === ROWS.length - 1;
        // new rows flash electric → lavender → settle grey (ref: orange → pink → grey)
        let col = GREY;
        if (last) col = u < 0.08 ? FX.COL.electric : "#111";
        else if (u < 0.1) col = FX.COL.electric;
        else if (u < 0.2) col = FX.COL.lavender;
        if (el._c !== col) { el._c = col; el.style.color = col; }
        if (kind === "folder") {
          const open = lt >= topen;
          if (el._o !== open) { el._o = open; el.querySelector(".tv-ch").innerHTML = chev(open, 30); }
        }
        if (last) E.tf(el, { s: u < 0.1 ? 1.04 : 1 });
      });
      guides.forEach(({ g, a }) => {
        const t0 = ROWS[a][3];
        g.style.transform = `scaleY(${E.k(lt, t0, 0.3, ez.out).toFixed(3)})`;
      });
    };
  });
})();
