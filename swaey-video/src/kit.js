/* Shared pieces for the scenes: the storyboard clock, the MacBook screen
   with its notch, Swaey's live app icon and kinetic captions. */
(function () {
  const E = window.E, C = E.C;
  const K = (E.K = {});

  /* ---------- Swaey's app icon, with a live face ---------- */
  K.appMark = (parent, size) => {
    const el = E.h("div", "appmark", parent);
    E.css(el, { width: size + "px", height: size + "px" });
    const face = new C.Face(el, { size: Math.round(size * 0.66), stroke: 10 });
    face.el.style.position = "relative";
    face.el.style.zIndex = 2;
    return { el, face };
  };

  /* ---------- MacBook display with notch, menu bar and wallpaper ---------- */
  K.macScreen = (parent, { w = 1920, h = 1200, bezel = 22, radius = 46, notchW = 230, notchH = 38, menubar = true, wallScale = 0.34, clock = "Sun 11 Oct  9:41 AM", app = "Finder" } = {}) => {
    const el = E.h("div", "macbook", parent);
    E.css(el, { position: "absolute", width: w + "px", height: h + "px", borderRadius: radius + "px", background: "#050506", boxShadow: "0 0 0 2px #2a2b30, 0 0 0 3px #0c0c0e" });
    const scr = E.h("div", "mac-screen", el);
    const sw = w - bezel * 2, sh = h - bezel * 2;
    E.css(scr, { position: "absolute", left: bezel + "px", top: bezel + "px", width: sw + "px", height: sh + "px", borderRadius: radius - bezel + 6 + "px", overflow: "hidden", background: "#0b1a3a" });
    const wall = new C.Shader(scr, sw, sh, C.FRAG_WALL, { scale: wallScale });
    const desk = E.h("div", "fill", scr);
    let mb = null;
    if (menubar) {
      mb = E.h("div", "mb", scr);
      E.css(mb, { height: notchH + "px", background: "rgba(10,20,50,.22)" });
      const wifi = '<svg width="20" height="15" viewBox="0 0 20 15"><path d="M10 13.5l2.4-2.9a3.6 3.6 0 0 0-4.8 0zM10 7.2a7 7 0 0 1 4.6 1.7l1.7-2a9.6 9.6 0 0 0-12.6 0l1.7 2A7 7 0 0 1 10 7.2zm0-4.6a11.6 11.6 0 0 1 7.6 2.8l1.7-2A14.2 14.2 0 0 0 .7 3.4l1.7 2A11.6 11.6 0 0 1 10 2.6z" fill="#fff"/></svg>';
      const batt = '<svg width="28" height="13" viewBox="0 0 28 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".6"/><rect x="2.5" y="2.5" width="17" height="8" rx="2" fill="#fff"/><path d="M25.5 4.5v4a2 2 0 0 0 0-4z" fill="#fff" fill-opacity=".6"/></svg>';
      mb.innerHTML = `<div style="display:flex;align-items:center"><b class="mb-apple" style="font-size:17px"></b><b>${app}</b><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></div>
        <div style="display:flex;align-items:center"><span class="mb-face" style="width:22px;height:22px;display:inline-grid;place-items:center"></span><span style="display:inline-flex">${wifi}</span><span style="display:inline-flex">${batt}</span><span style="font-variant-numeric:tabular-nums;margin-right:0">${clock}</span></div>`;
      mb.querySelector(".mb-apple").innerHTML = '<svg width="15" height="18" viewBox="0 0 15 18"><path fill="#fff" d="M12.3 9.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM10 2.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></svg>';
      new C.Face(mb.querySelector(".mb-face"), { size: 20, stroke: 11 });
    }
    const notch = E.h("div", "notch-host", scr);
    E.css(notch, { position: "absolute", left: "50%", top: "0", width: "0", height: "0", zIndex: 40 });
    return { el, scr, wall, desk, mb, notch, sw, sh, notchW, notchH };
  };

  /* ---------- Kinetic caption: eyebrow + title, words rise out of a mask ---------- */
  K.caption = (parent, { eyebrow = "heyswaey", title, size = 64, x = 0, y = 0, w = 900, dark = false, align = "left", sub = "", subSize = 27 } = {}) => {
    const el = E.h("div", "abs cap", parent);
    E.css(el, { left: x + "px", top: y + "px", width: w + "px", textAlign: align, color: dark ? "#fff" : "#000" });
    const eb = E.h("div", "eyebrow", el);
    E.css(eb, { marginBottom: "22px", color: dark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.42)", display: "flex", alignItems: "center", gap: "12px", justifyContent: align === "center" ? "center" : "flex-start" });
    const bars = E.h("span", "", eb);
    bars.innerHTML = [3, 6, 10, 14, 10, 6, 3].map((hh) => `<i style="display:inline-block;width:3px;height:${hh}px;margin-right:2px;border-radius:2px;background:currentColor;vertical-align:middle"></i>`).join("");
    const ebt = E.h("span", "", eb);
    ebt.textContent = eyebrow;
    const tt = E.h("div", "h3", el);
    E.css(tt, { fontSize: size + "px" });
    const lines = title.split("\n");
    const words = [];
    lines.forEach((ln) => {
      const row = E.h("div", "", tt);
      E.css(row, { overflow: "hidden", paddingBottom: ".08em", marginBottom: "-.08em" });
      ln.split(" ").forEach((wd, i, a) => {
        const s = E.h("span", "wd", row);
        s.textContent = wd + (i < a.length - 1 ? " " : "");
        words.push(s);
      });
    });
    let subEl = null;
    if (sub) {
      subEl = E.h("div", "", el);
      E.css(subEl, { marginTop: "22px", fontSize: subSize + "px", lineHeight: 1.45, letterSpacing: "-0.03em", color: dark ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.5)", maxWidth: "30em", marginLeft: align === "center" ? "auto" : 0, marginRight: align === "center" ? "auto" : 0 });
      subEl.textContent = sub;
    }
    return {
      el,
      render(lt, t0 = 0, out = 99) {
        const ea = E.k(lt, t0, 0.5, E.ease.out);
        E.tf(eb, { y: (1 - ea) * 14, o: ea * (1 - E.k(lt, out, 0.25)) });
        words.forEach((s, i) => {
          const p = E.k(lt, t0 + 0.08 + i * 0.045, 0.62, E.ease.out);
          const q = E.k(lt, out + i * 0.02, 0.3, E.ease.inCubic);
          E.tf(s, { y: (1 - p) * size * 1.15 - q * size * 1.15, rz: (1 - p) * 4 });
        });
        if (subEl) {
          const p = E.k(lt, t0 + 0.35, 0.6, E.ease.out);
          E.tf(subEl, { y: (1 - p) * 18, o: p * (1 - E.k(lt, out, 0.25)), blur: (1 - p) * 6 });
        }
      },
    };
  };

  /* typewriter: shows n characters (with optional caret) */
  K.typeInto = (el, text, n, caret = false) => {
    const k = Math.max(0, Math.min(text.length, Math.floor(n)));
    const s = text.slice(0, k);
    const key = s + (caret ? "|" : "");
    if (el._k !== key) {
      el._k = key;
      el.textContent = s;
      if (caret) { const c = E.h("span", "caret", el); E.css(c, { display: "inline-block", width: ".08em", height: "1em", background: "currentColor", marginLeft: ".04em", verticalAlign: "-.12em", borderRadius: "1px" }); }
    }
    return k;
  };
  /* typing cues: one key tick per character (thinned so it never gets noisy) */
  K.typeCues = (t0, text, cps, every = 2, gain = 0.5) => {
    for (let i = 0; i < text.length; i += every) if (text[i] !== " ") E.cue(t0 + i / cps, "key", { g: gain, v: i });
  };

  /* camera: a perspective wrapper that the whole scene sits in */
  K.camera = (root, persp = 1800) => {
    E.css(root, { perspective: persp + "px", perspectiveOrigin: "50% 50%" });
    const cam = E.h("div", "fill", root);
    E.css(cam, { transformStyle: "preserve-3d" });
    return cam;
  };
})();
