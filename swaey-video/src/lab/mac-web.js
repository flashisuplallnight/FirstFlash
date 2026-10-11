/* lab: mac-web — lofi illustrations, Safari, YouTube watch page, YouTube hero page */
(function () {
  const E = window.E, M = E.Mac;
  E.K.LAB_DURATION = 8;
  // 0..7: each lofi variant full-frame (animated)
  for (let v = 0; v < 7; v++) {
    E.scene("lab-lofi-" + v, v, v + 1, (root) => {
      root.style.background = "#111";
      const a = M.lofiArt(root, 1920, 1080, { variant: v });
      return (lt) => a.render(lt + 3);
    });
  }
  E.scene("lab-lofi-grid", 7, 8, (root) => {
    root.style.background = "#0f0f0f";
    const arts = [];
    for (let v = 0; v < 7; v++) {
      const d = E.h("div", "", root);
      E.css(d, { position: "absolute", left: 40 + (v % 4) * 466 + "px", top: 60 + Math.floor(v / 4) * 300 + "px", borderRadius: "12px", overflow: "hidden" });
      arts.push(M.lofiArt(d, 440, 248, { variant: v, dpr: 1 }));
    }
    const d = E.h("div", "", root);
    E.css(d, { position: "absolute", left: "40px", top: "680px", display: "flex", gap: "16px" });
    for (let v = 1; v < 7; v++) { const k = E.h("div", "", d); E.css(k, { borderRadius: "8px", overflow: "hidden" }); arts.push(M.lofiArt(k, 168, 94, { variant: v, dpr: 2 })); }
    const tall = E.h("div", "", root);
    E.css(tall, { position: "absolute", left: "1240px", top: "680px", display: "flex", gap: "12px" });
    for (let v = 1; v < 4; v++) { const k = E.h("div", "", tall); E.css(k, { borderRadius: "8px", overflow: "hidden" }); arts.push(M.lofiArt(k, 180, 240, { variant: v, dpr: 1 })); }
    return (lt) => arts.forEach((a) => a.render(lt + 2));
  });
})();
