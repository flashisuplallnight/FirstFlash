/* lab: fx-surface — one slot per component (times in the comments). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac;
  const SL = [];
  const slot = (name, a, b, build) => { SL.push([name, a, b]); E.scene("fxs-" + name, a, b, build); };

  /* 0–1.5  cyan flood over a floating island */
  slot("wash-cyan", 0, 1.5, (root) => {
    root.classList.add("cream");
    const isl = new E.C.Island(root, { em: 20, width: 24 });
    E.css(isl.el, { top: "330px" });
    isl.setText("hey swaey, put on some lofi on youtube", 1);
    const w = FX.wash(root, 1920, 1080, { palette: "cyan" });
    w.el.style.zIndex = 3;
    return (lt) => {
      isl.render({ w: 34, h: 9.6, open: 1 });
      isl.face.render({ mood: "listen", t: lt });
      isl.wave.render("listen", lt);
      w.render(lt, { cover: E.k(lt, 0.1, 0.7, E.ease.inOutCubic), from: [0.5, 0.45] });
    };
  });
  /* 1.5–3  pastel blobs + confirm card */
  slot("wash-pastel", 1.5, 3, (root) => {
    const w = FX.wash(root, 1920, 1080, { palette: "pastel" });
    const card = M.window(root, { x: 650, y: 420, w: 410, h: 150, bar: "none", zoom: 1.5 });
    card.tls.remove();
    card.content.innerHTML = `<div style="padding:16px 18px"><div style="font-weight:600;font-size:15px">Empty the Trash?</div><div style="margin-top:4px;color:rgba(0,0,0,.5);font-size:12px">ⓘ 3 items will be gone for good</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:22px"><span class="mac-btn">Cancel</span><span class="mac-btn" style="background:#111;color:#fff">Go ahead</span></div></div>`;
    return (lt) => w.render(lt, {});
  });
  /* 3–4.5  holo ribbons behind a phone-sized card */
  slot("wash-ribbons", 3, 4.5, (root) => {
    const w = FX.wash(root, 1920, 1080, { palette: "ribbons", seed: 3 });
    const isl = new E.C.Island(root, { em: 18, width: 22 });
    E.css(isl.el, { top: "390px" });
    isl.setText("focus mode is on. slack’s closed.", 1);
    return (lt) => { w.render(lt, {}); isl.render({ w: 30, h: 9, open: 1 }); isl.face.render({ mood: "happy", t: lt }); isl.wave.render("speak", lt); };
  });
  /* 4.5–5.5  full */
  slot("wash-full", 4.5, 5.5, (root) => {
    const w = FX.wash(root, 1920, 1080, { palette: "full" });
    return (lt) => w.render(lt, {});
  });
  /* 5.5–8.5  thermal: photo → thermal (5.5–6.3), hold, glitch + grid (7.2–8.5) */
  slot("thermal", 5.5, 8.5, (root) => {
    const th = FX.thermalImage(root, 1920, 1080, { src: "assets/wp/sonoma.jpg" });
    const btn = E.h("div", "", root, "Show what left my Mac");
    E.css(btn, { position: "absolute", left: "820px", top: "500px", padding: "12px 20px", borderRadius: "10px", background: "rgba(20,20,22,.92)", color: "#fff", font: "500 22px/1 var(--sf)", letterSpacing: "-.01em" });
    const gt = FX.glitchTiles(root, 1920, 1080, { geom: th.geom, region: { x: 760, y: 440, w: 400, h: 170 } });
    return (lt) => {
      const mix = E.k(lt, 0.15, 0.6, E.ease.inOutCubic);
      const g = E.k(lt, 1.7, 1.2, E.ease.inCubic);
      th.render(lt, { mix, zoom: 1.04 + lt * 0.03, flow: 1, glitch: g, grid: E.k(lt, 1.6, 1.1, E.ease.outCubic) });
      gt.render(lt, g, { geom: th.geom });
      E.op(btn, 1 - E.k(lt, 2.3, 0.3));
    };
  });
  /* 8.5–9.5  sunset + applyThermal on a DOM card (left plain, right thermal) */
  slot("sunset", 8.5, 9.5, (root) => {
    const s = FX.sunset(root, 1920, 1080);
    const mk = (x) => {
      const w = M.window(root, { x, y: 300, w: 420, h: 300, sidebar: 0, title: "Notes", zoom: 1.5 });
      w.content.innerHTML = `<div style="padding:14px 18px;font-size:13px;line-height:1.5"><div style="font-weight:700;font-size:17px">Dentist</div>Dr. Patel · Tue 9:00 AM<br>bring the insurance card<br><span style="color:#007aff">leave at 8:40</span></div>`;
      return w;
    };
    mk(220);
    const b = mk(1050);
    FX.applyThermal(b.el, true);
    return (lt) => s.render(lt);
  });
  /* 9.5–11  colour bars streak in and land on calendar-like event rects */
  slot("bars", 9.5, 11, (root) => {
    root.classList.add("cream");
    const targets = [];
    const cols = ["#ffd6b8", "#cfe6ff", "#f6cdee", "#ffcf9f", "#d7f0a8", "#e6dcff", "#ffd6b8", "#cfe6ff", "#f6cdee"];
    for (let i = 0; i < 9; i++) targets.push({ x: 260 + (i % 5) * 300 + (i % 2) * 40, y: 250 + Math.floor(i / 2) * 120 + (i % 3) * 18, w: 220 + (i % 3) * 70, h: 46, color: cols[i] });
    const outline = E.h("div", "", root);
    targets.forEach((t) => { const d = E.h("div", "", outline); E.css(d, { position: "absolute", left: t.x + "px", top: t.y + "px", width: t.w + "px", height: t.h + "px", borderRadius: "6px", boxShadow: "0 0 0 1px rgba(0,0,0,.12)" }); });
    const bars = FX.colorBars(root, { seed: 4, targets });
    return (lt) => bars.render(lt, E.clamp(lt / 1.2));
  });
  /* 11–13.5  collage scatter (11–12.4) then condense (12.4–13.5) */
  slot("collage", 11, 13.5, (root) => {
    root.classList.add("cream");
    const cap = E.h("div", "cap", root, 'just <span style="color:#0f7fff">listen?</span>');
    E.css(cap, { position: "absolute", left: 0, right: 0, top: "500px", textAlign: "center" });
    const cards = [];
    const hold = E.h("div", "", root);
    const win = (o, fill) => { const w = M.window(hold, Object.assign({ x: 0, y: 0 }, o)); fill(w); cards.push(w.el); return w; };
    win({ w: 520, h: 330, title: "Music", bar: "title", center: true, dark: true }, (w) => { w.content.innerHTML = `<div style="display:flex;gap:16px;padding:18px"><div style="width:150px;height:150px;border-radius:8px;background:linear-gradient(135deg,#f3a7c9,#7b6cf0 55%,#1f2a6b)"></div><div style="color:#fff"><div style="font-weight:600;font-size:15px">lofi hip hop radio</div><div style="opacity:.6;font-size:12px;margin-top:3px">beats to relax/study to</div><div style="margin-top:60px;height:4px;border-radius:2px;background:rgba(255,255,255,.2)"><div style="width:40%;height:100%;border-radius:2px;background:#fff"></div></div></div></div>`; });
    win({ w: 420, h: 300, title: "Sarah Chen", bar: "unified" }, (w) => { w.content.innerHTML = `<div style="padding:16px;display:flex;flex-direction:column;gap:8px;font-size:13px"><div style="align-self:flex-start;background:#e9e9eb;padding:7px 11px;border-radius:16px">running late?</div><div style="align-self:flex-end;background:#0a84ff;color:#fff;padding:7px 11px;border-radius:16px">10 min, see you soon</div><div style="align-self:flex-end;background:#0a84ff;color:#fff;padding:7px 11px;border-radius:16px">sent by swaey ✓</div></div>`; });
    win({ w: 460, h: 300, title: "New Message", bar: "unified" }, (w) => { w.content.innerHTML = `<div style="padding:10px 16px;font-size:13px"><div style="border-bottom:.5px solid rgba(0,0,0,.1);padding:6px 0;color:rgba(0,0,0,.5)">To: <span style="color:#007aff">Sarah Chen</span></div><div style="border-bottom:.5px solid rgba(0,0,0,.1);padding:6px 0">Subject: Acme invoice — September</div><div style="padding-top:10px;line-height:1.5">Hi Sarah, attached is invoice-acme-sept.pdf.</div></div>`; });
    win({ w: 380, h: 340, title: "Today", bar: "unified" }, (w) => { w.content.innerHTML = `<div style="padding:10px 14px;font-size:12px">${[["9:00", "Dentist · Dr. Patel", "#cfe3ff", "#0a63d6"], ["11:30", "Standup", "#e7dcff", "#6b48d9"], ["19:00", "Call Mom", "#ffe0cc", "#c4561c"]].map(([t, n, b, c]) => `<div style="display:flex;gap:8px;margin:8px 0"><span style="width:38px;color:rgba(0,0,0,.45)">${t}</span><span style="flex:1;background:${b};color:${c};border-left:3px solid ${c};padding:6px 8px;border-radius:4px;font-weight:600">${n}</span></div>`).join("")}</div>`; });
    win({ w: 500, h: 280, title: "zsh — swaey", bar: "title", center: true, dark: true }, (w) => { w.content.innerHTML = `<pre style="margin:12px 14px;font:12px/1.6 var(--sf-mono);color:#ddd">~ % claude "fix the failing test"\n<span style="color:#d4ef4f">✓</span> PricingTests.swift — 1 fixed\n<span style="color:#888">all 42 tests passing</span></pre>`; });
    win({ w: 340, h: 260, title: "Notes", bar: "unified" }, (w) => { w.content.innerHTML = `<div style="padding:12px 16px;font-size:13px;line-height:1.55"><b>morning briefing</b><br>• 3 meetings, first at 9:00<br>• Acme invoice due Fri<br>• focus 2–4 pm</div>`; });
    const wp = E.h("div", "", hold); E.css(wp, { width: "560px", height: "350px", borderRadius: "12px", background: "url(assets/wp/sonoma.jpg) center/cover", boxShadow: "var(--mac-shadow)" }); cards.push(wp);
    const wp2 = E.h("div", "", hold); E.css(wp2, { width: "460px", height: "300px", borderRadius: "12px", background: "url(assets/wp/imac-blue.jpg) center/cover", boxShadow: "var(--mac-shadow)" }); cards.push(wp2);
    const col = FX.collage(root, { cards, seed: 3 });
    return (lt) => {
      if (lt < 1.4) col.render(lt, { mode: "scatter" });
      else col.render(lt, { mode: "condense", p: E.clamp((lt - 1.4) / 1.0) });
      E.op(cap, 1 - E.k(lt, 2.0, 0.3));
    };
  });
  /* 13.5–14.7  node grid draws in */
  slot("grid", 13.5, 14.7, (root) => {
    const g = FX.nodeGrid(root, 1920, 1080, {});
    return (lt) => g.render(E.clamp(lt / 0.9), { marks: [[0, 0], [2, 0], [0, 2], [2, 2]] });
  });
  /* 14.7–17  bento (builds in, then keeps re-arranging) */
  slot("bento", 14.7, 17, (root) => {
    const b = FX.bento(root, 1920, 1080, {});
    return (lt) => b.render(lt, { p: E.clamp(lt / 0.6) });
  });
  /* 17–19.2  dot matrix: flicker, flip to lime (17.4–18.4), condense (18.5–19.2) */
  slot("dots", 17, 19.2, (root) => {
    const d = FX.dotMatrix(root, 1920, 1080, {});
    return (lt) => d.render(lt, { p: E.k(lt, 0.4, 1.0, E.ease.inOutQuad), condense: E.k(lt, 1.5, 0.7, E.ease.inOutCubic) });
  });
  /* 19.2–20  big lime shield */
  slot("shield", 19.2, 20, (root) => {
    root.style.background = "#1d1d1d";
    const s = FX.bigShield(root, 150, {});
    return (lt) => s.render(E.clamp(lt / 0.6));
  });
  /* 20–21.5  macro mic; 21.5–22.5 macro grille */
  slot("macro-mic", 20, 21.5, (root) => {
    root.style.background = "#000";
    const m = FX.macro(root, 1920, 1080, { kind: "mic", scale: 0.6 });
    return (lt) => m.render(lt);
  });
  slot("macro-grille", 21.5, 22.5, (root) => {
    root.style.background = "#000";
    const m = FX.macro(root, 1920, 1080, { kind: "grille", scale: 0.6 });
    return (lt) => m.render(lt);
  });
  E.K.LAB_DURATION = 22.5;
  E.K.LAB_SLOTS = SL;
})();
