/* Act 2 — talk & it types · it remembers you · it asks first · instant (→ dark mode) */
(function () {
  const E = window.E, C = E.C, K = E.K, T = K.T, ez = E.ease;

  const avatar = (parent, letter, bg, size = 44) => {
    const a = E.h("div", "", parent);
    E.css(a, { width: size + "px", height: size + "px", borderRadius: "50%", background: bg, color: "#fff", display: "grid", placeItems: "center", font: `600 ${size * 0.42}px/1 var(--sans)`, flex: "none" });
    a.textContent = letter;
    return a;
  };

  /* ============ TYPING: talk, and it types. anywhere. ============ */
  E.scene("typing", T.typing[0], T.typing[1], (root) => {
    E.h("div", "fill dots", root);
    E.css(root, { perspective: "2000px" });
    const cap = K.caption(root, { eyebrow: "voice typing", title: "talk, and it types.\nanywhere.", size: 92, x: 130, y: 270, w: 760, sub: "hold fn and talk. the “ums” gone, your “no wait, i mean” fixed." });

    const win = C.Window(root, { w: 1000, h: 700, title: "Messages" });
    E.css(win.el, { left: "840px", top: "190px" });
    const side = E.h("div", "abs", win.body);
    E.css(side, { left: 0, top: 0, bottom: 0, width: "320px", background: "#f6f6f8", borderRight: "1px solid var(--line)", padding: "18px 14px" });
    side.innerHTML = `<div style="height:38px;border-radius:10px;background:rgba(0,0,0,.05);display:flex;align-items:center;padding:0 14px;color:rgba(0,0,0,.4);font-size:17px">Search</div>`;
    const convos = [["J", "#5aa2ff", "Jake Miller", "are we still shipping the…", "9:41", true], ["M", "#ff8fa3", "Mom", "Call me when you’re free ❤️", "9:12"], ["S", "#a78bfa", "Sarah Chen", "See you at 10:30!", "Yesterday"]];
    convos.forEach(([l, c, n, m, tm, sel]) => {
      const r = E.h("div", "", side);
      E.css(r, { display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderRadius: "12px", marginTop: "10px", background: sel ? "var(--electric)" : "transparent", color: sel ? "#fff" : "#111" });
      avatar(r, l, c, 48);
      const tx = E.h("div", "", r);
      E.css(tx, { flex: 1, minWidth: 0 });
      tx.innerHTML = `<div style="display:flex;justify-content:space-between;font:600 18px/1.2 var(--sans)"><span>${n}</span><span style="font-weight:400;font-size:15px;opacity:.6">${tm}</span></div><div style="font-size:16px;opacity:.65;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m}</div>`;
    });
    const chat = E.h("div", "abs", win.body);
    E.css(chat, { left: "320px", right: 0, top: 0, bottom: 0 });
    chat.innerHTML = `<div style="text-align:center;padding-top:22px"><div style="width:56px;height:56px;margin:0 auto;border-radius:50%;background:#5aa2ff;color:#fff;display:grid;place-items:center;font:600 24px var(--sans)">J</div><div style="font:600 17px var(--sans);margin-top:8px">Jake Miller</div><div style="font-size:14px;color:rgba(0,0,0,.4);margin-top:12px">Today 9:41 AM</div></div>`;
    const inb = E.h("div", "abs", chat);
    E.css(inb, { left: "26px", top: "170px", maxWidth: "430px", background: "#e9e9eb", borderRadius: "22px", padding: "14px 18px", fontSize: "21px", lineHeight: 1.35 });
    inb.textContent = "are we still shipping the update this week?";
    const out = E.h("div", "abs", chat);
    E.css(out, { right: "26px", top: "280px", maxWidth: "460px", background: "var(--electric)", color: "#fff", borderRadius: "22px", padding: "14px 18px", fontSize: "21px", lineHeight: 1.35, transformOrigin: "100% 100%" });
    out.textContent = "Yes! The launch is on Wednesday.";
    const deliv = E.h("div", "abs", chat);
    E.css(deliv, { right: "30px", top: "348px", fontSize: "14px", color: "rgba(0,0,0,.4)" });
    deliv.textContent = "Delivered";
    const input = E.h("div", "abs", chat);
    E.css(input, { left: "22px", right: "22px", bottom: "22px", height: "52px", borderRadius: "26px", boxShadow: "0 0 0 1.5px rgba(0,0,0,.12)", display: "flex", alignItems: "center", padding: "0 20px", fontSize: "20px" });
    const inText = E.h("span", "", input);
    const ph = E.h("span", "", input);
    E.css(ph, { color: "rgba(0,0,0,.3)" });
    ph.textContent = "iMessage";
    const caret = E.h("span", "", input);
    E.css(caret, { width: "2px", height: "26px", background: "var(--electric)", marginLeft: "2px" });

    // dictation HUD
    const hud = E.h("div", "abs", root);
    E.css(hud, { left: "1100px", top: "640px", width: "720px", minHeight: "130px", borderRadius: "26px", background: "#0c0d12", color: "#fff", padding: "20px 26px", boxShadow: "0 30px 70px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)", transformOrigin: "50% 100%" });
    const hudTop = E.h("div", "", hud);
    E.css(hudTop, { display: "flex", alignItems: "center", gap: "14px", font: "500 14px/1 var(--mono)", letterSpacing: ".1em", color: "rgba(255,255,255,.5)" });
    hudTop.innerHTML = `<span style="width:12px;height:12px;border-radius:50%;background:#0f7fff;box-shadow:0 0 12px #0f7fff"></span>YOU, HOLDING FN`;
    const hw = new C.Wave(hud, 668, 46, { bar: 4, gap: 3.4 });
    E.css(hw.c, { margin: "10px 0 6px" });
    const raw = E.h("div", "", hud);
    E.css(raw, { fontSize: "27px", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.3, whiteSpace: "nowrap" });
    const RAW = ["um", "so", "the", "launch", "is", "on", "tuesday,", "no", "wait,", "wednesday"];
    const KILL = new Set([0, 1, 6, 7, 8]);
    const rw = RAW.map((w, i) => {
      const s = E.h("span", "", raw);
      E.css(s, { display: "inline-block", position: "relative", overflow: "hidden", verticalAlign: "bottom", whiteSpace: "nowrap" });
      s.innerHTML = `<span>${w}&nbsp;</span>`;
      if (KILL.has(i)) {
        const st = E.h("i", "", s);
        E.css(st, { position: "absolute", left: 0, top: "54%", height: "3px", background: "#ff5f57", borderRadius: "2px", width: "0" });
        s._strike = st;
      }
      return s;
    });
    const fn = C.Keycap(root, "fn", { w: 150, h: 150, sub: "" });
    E.css(fn.el, { left: "880px", top: "760px" });

    const S = T.typing[0];
    E.cue(S + 0.32, "keydown", { g: 0.8 });
    E.cue(S + 0.4, "open", { g: 0.5 });
    E.cue(S + 1.5, "keyup", { g: 0.6 });
    E.cue(S + 1.58, "scratch", { g: 0.7 });
    E.cue(S + 1.95, "swoosh", { g: 0.6 });
    E.cue(S + 2.25, "send", { g: 0.8 });
    E.cue(S + 2.6, "whoosh", { g: 0.5 });
    return (lt, t) => {
      cap.render(lt, 0.05, 2.55);
      const wi = E.k(lt, 0, 0.7, ez.outExpo);
      const ex = E.k(lt, 2.58, 0.23, ez.inExpo);
      E.tf(win.el, { x: (1 - wi) * 500 + ex * 300, ry: -14 + wi * 6, rx: 4, o: wi * (1 - ex), s: 1 + ex * 0.2 });
      // fn
      const fi = E.k(lt, 0.15, 0.35, ez.outBack);
      E.tf(fn.el, { y: (1 - fi) * 80, o: fi * (1 - ex), rx: 25 });
      fn.press(lt > 0.32 && lt < 1.5 ? 1 : 0);
      // hud
      const ho = E.k(lt, 0.35, 0.45, ez.island) * (1 - E.k(lt, 1.95, 0.2, ez.inCubic));
      E.tf(hud, { s: 0.6 + 0.4 * ho, o: ho, y: (1 - ho) * 40 });
      hw.render(lt < 1.5 ? "listen" : "think", t, { amp: 1 - E.k(lt, 1.5, 0.3) * 0.7 });
      const heard = E.clamp((lt - 0.45) / 1.0) * RAW.length;
      rw.forEach((s, i) => {
        const vis = E.clamp(heard - i);
        s.style.opacity = vis.toFixed(3);
        s.firstChild.style.color = KILL.has(i) && lt > 1.55 ? "rgba(255,255,255,.45)" : "#fff";
        if (s._strike) s._strike.style.width = (E.k(lt, 1.55 + (i > 2 ? 0.1 : 0), 0.18, ez.out) * 100).toFixed(1) + "%";
        if (KILL.has(i)) {
          if (s._w == null && lt > 1.0) s._w = s.firstChild.offsetWidth;
          const col = E.k(lt, 1.78 + (i > 2 ? 0.05 : 0), 0.22, ez.inOutCubic);
          s.style.maxWidth = s._w != null ? (s._w * (1 - col)).toFixed(1) + "px" : "";
        }
      });
      // polished text lands at the cursor
      const land = "Yes! The launch is on Wednesday.";
      const nType = E.clamp((lt - 1.95) / 0.25) * land.length;
      const sent = lt > 2.25;
      K.typeInto(inText, sent ? "" : land, nType);
      ph.style.display = nType > 0 && !sent ? "none" : "";
      caret.style.opacity = Math.floor(lt * 4) % 2 ? 0.2 : 1;
      const bo = E.k(lt, 2.25, 0.4, ez.spring);
      E.tf(out, { s: 0.4 + 0.6 * bo, o: E.k(lt, 2.25, 0.1), y: (1 - bo) * 60 });
      E.op(deliv, E.k(lt, 2.45, 0.2));
    };
  });

  /* ============ MEMORY: it remembers you. ============ */
  E.scene("memory", T.memory[0], T.memory[1], (root) => {
    E.h("div", "fill dots", root);
    E.css(root, { perspective: "2000px" });
    const cap = K.caption(root, { eyebrow: "memory", title: "it remembers you.", size: 92, x: 130, y: 330, w: 760, sub: "tell it once. swaey keeps a little notebook about you, right on your mac. read and edit every line." });
    const win = C.Window(root, { w: 980, h: 620, title: "" });
    E.css(win.el, { left: "860px", top: "250px" });
    const side = E.h("div", "abs", win.body);
    E.css(side, { left: 0, top: 0, bottom: 0, width: "270px", background: "#f6f6f8", borderRight: "1px solid var(--line)", padding: "20px 16px" });
    const head = E.h("div", "", side);
    E.css(head, { display: "flex", gap: "12px", alignItems: "center", marginBottom: "18px" });
    const mk = K.appMark(head, 46);
    E.css(mk.el, { position: "relative" });
    E.h("div", "", head, `<div style="font:600 18px/1.2 var(--sans)">HeySwaey</div><div style="font-size:14px;color:rgba(0,0,0,.4)">Swaey Pro</div>`);
    [["General", "#8e8e93"], ["Brain", "#ff375f", 1], ["Voice", "#0f7fff"], ["Routines", "#ff9f0a"], ["Privacy", "#30d158"]].forEach(([n, c, sel]) => {
      const r = E.h("div", "", side);
      E.css(r, { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "9px", fontSize: "18px", fontWeight: 500, background: sel ? "var(--electric)" : "", color: sel ? "#fff" : "#1c1c1e" });
      r.innerHTML = `<i style="width:24px;height:24px;border-radius:6px;background:${c};display:inline-block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)"></i>${n}`;
    });
    const main = E.h("div", "abs", win.body);
    E.css(main, { left: "270px", right: 0, top: 0, bottom: 0, padding: "30px 34px" });
    main.innerHTML = `<div style="font:600 30px/1 var(--sans);letter-spacing:-.02em">Brain</div><div style="font-size:17px;color:rgba(0,0,0,.45);margin-top:10px">Things Swaey knows about you</div>`;
    const list = E.h("div", "", main);
    E.css(list, { marginTop: "26px", borderRadius: "14px", boxShadow: "0 0 0 1px var(--line)", overflow: "hidden" });
    const ROWS = [["mail", "uses Gmail, not Apple Mail"], ["messages", "manager is Sarah Chen"], ["music", "lofi when coding"], ["calendar", "standup is at 10:00"]];
    const rows = ROWS.map(([ic, txt], i) => {
      const r = E.h("div", "", list);
      E.css(r, { display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", borderTop: i ? "1px solid var(--line)" : "", background: "#fff", position: "relative" });
      const im = C.icon(r, ic, 40); E.css(im, { position: "relative", filter: "none" });
      E.h("div", "", r, txt).style.cssText = "flex:1;font:500 21px/1.2 var(--sans);letter-spacing:-.01em";
      const tag = E.h("div", "", r, "remembered: now");
      E.css(tag, { fontSize: "15px", color: "var(--electric)", fontWeight: 500 });
      const flash = E.h("i", "", r);
      E.css(flash, { position: "absolute", inset: 0, background: "rgba(15,127,255,.12)", pointerEvents: "none" });
      return { r, flash, tag };
    });
    const pill = E.h("div", "pill pill-blue", root);
    E.css(pill, { fontSize: "30px", left: "1080px", top: "150px" });
    pill.textContent = "remember i use gmail";
    const S = T.memory[0];
    E.cue(S + 0.25, "pop", { g: 0.6 });
    E.cue(S + 0.62, "swoosh", { g: 0.6 });
    [0.72, 0.98, 1.2, 1.42].forEach((d, i) => E.cue(S + d, "tick", { g: 0.6, v: i }));
    E.cue(S + 1.66, "whoosh", { g: 0.5 });
    return (lt) => {
      cap.render(lt, 0.0, 1.66);
      const wi = E.k(lt, 0, 0.55, ez.outExpo), ex = E.k(lt, 1.66, 0.21, ez.inExpo);
      E.tf(win.el, { y: (1 - wi) * 200 - ex * 200, ry: -10 + 4 * wi, rx: 5, o: wi * (1 - ex) });
      // pill flies into the first row
      const pa = E.k(lt, 0.22, 0.3, ez.spring), pb = E.k(lt, 0.6, 0.18, ez.inCubic);
      E.tf(pill, { s: E.lerp(0.5, 1, pa) * (1 - pb * 0.5), y: pb * 300, x: pb * 40, o: pa * (1 - pb) });
      const times = [0.72, 0.98, 1.2, 1.42];
      rows.forEach((o, i) => {
        const p = E.k(lt, times[i], 0.35, ez.island);
        E.tf(o.r, { x: (1 - p) * 60, o: E.k(lt, times[i], 0.12) });
        E.op(o.flash, E.k(lt, times[i], 0.05) * (1 - E.k(lt, times[i] + 0.1, 0.5)));
        E.op(o.tag, i === rows.length - 1 || lt < (times[i + 1] || 9) ? 1 : 0.0);
      });
      mk.face.render({ mood: "neutral", blink: C.blinkAt([0.5, 1.3], lt) });
    };
  });

  /* ============ ASKS: it asks before it acts. ============ */
  E.scene("asks", T.asks[0], T.asks[1], (root) => {
    E.css(root, { background: "#000", perspective: "2200px" });
    const cam = E.h("div", "fill", root);
    const mac = K.macScreen(cam, { w: 2000, h: 1250, notchW: 300, notchH: 42 });
    E.css(mac.el, { left: "-40px", top: "-30px" });
    const isl = new C.Island(mac.notch, { em: 27, width: 22 });
    const trash = E.h("div", "abs", mac.scr);
    E.css(trash, { right: "70px", top: "760px", width: "150px", textAlign: "center", color: "#fff", font: "500 19px var(--sans)", textShadow: "0 1px 3px rgba(0,0,0,.5)" });
    const tFull = C.icon(trash, "trash-full", 130), tEmpty = C.icon(trash, "trash", 130);
    [tFull, tEmpty].forEach((im) => E.css(im, { left: "10px", top: 0 }));
    E.h("div", "", trash, "Trash").style.marginTop = "140px";
    const act = C.Window(mac.scr, { w: 620, h: 300, title: "Activity" });
    E.css(act.el, { left: "150px", top: "650px" });
    const actList = E.h("div", "", act.body);
    E.css(actList, { padding: "10px 22px" });
    const ACT = [["youtube", "played lofi girl on youtube", "9:02"], ["mail", "emailed sarah: running late", "9:14"], ["trash", "emptied the trash", "9:41"]];
    const actRows = ACT.map(([ic, tx, tm]) => {
      const r = E.h("div", "", actList);
      E.css(r, { display: "flex", alignItems: "center", gap: "14px", padding: "13px 0", borderBottom: "1px solid var(--line)", fontSize: "20px" });
      const im = ic === "youtube" ? E.h("i", "", r) : C.icon(r, ic, 30);
      if (ic === "youtube") E.css(im, { width: "30px", height: "22px", borderRadius: "6px", background: "#ff0033", display: "inline-block" });
      E.css(im, { position: "relative", filter: "none" });
      E.h("span", "", r, tx).style.flex = "1";
      E.h("span", "", r, tm).style.cssText = "color:rgba(0,0,0,.4);font-size:17px;font-variant-numeric:tabular-nums";
      return r;
    });
    const cap = K.caption(root, { eyebrow: "safety", title: "it asks before it acts.", size: 80, x: 140, y: 330, w: 900, dark: true, sub: "anything risky gets a quick “should i go ahead?” first. say “stop” anytime." });
    E.css(cap.el, { textShadow: "0 2px 30px rgba(0,10,40,.5)" });
    const cursor = new C.Cursor(root, { size: 1.6 });
    const S = T.asks[0];
    E.cue(S + 0.1, "open", { g: 0.7 });
    E.cue(S + 0.95, "click", { g: 1 });
    E.cue(S + 1.05, "trash", { g: 0.9 });
    E.cue(S + 1.2, "check", { g: 0.6 });
    E.cue(S + 1.68, "whoosh", { g: 0.5 });
    return (lt, t) => {
      mac.wall.render(t, { uDark: 0.35 });
      const z = E.k(lt, 0, 1.875, ez.linear), ex = E.k(lt, 1.68, 0.2, ez.inExpo);
      E.tf(cam, { s: E.lerp(1.05, 1.0, z) + ex * 0.3, blur: ex * 12 });
      cap.render(lt, 0.15, 1.7);
      const o = E.k(lt, 0.05, 0.6, ez.island);
      const done = lt > 1.0;
      isl.render({ w: E.lerp(11, 22, o), h: E.lerp(1.6, done ? 7.4 : 12.4, o), open: o, content: E.k(lt, 0.2, 0.3), actions: done ? 0 : E.k(lt, 0.3, 0.3) });
      isl.setIcon(done ? "check" : "hand");
      isl.setText(done ? "done. the trash is empty." : "empty the trash? 3 items will be gone for good.", done ? E.k(lt, 1.05, 0.4, ez.linear) : E.k(lt, 0.2, 0.55, ez.linear));
      isl.face.render(Object.assign(C.moodAt([[0, "ask"], [1.02, "happy"]], lt), { draw: done ? E.k(lt, 1.02, 0.4) : undefined, blink: C.blinkAt([0.55], lt) }));
      isl.wave.render(done ? "speak" : "speak", t, { amp: o * 0.7 });
      // cursor → "Go ahead"
      const r = E.rect(isl.btnGo);
      const tx = r.left + r.width * 0.5, ty = r.top + r.height * 0.55;
      const ca = E.k(lt, 0.35, 0.55, ez.inOutCubic);
      cursor.render(E.lerp(1500, tx, ca), E.lerp(900, ty, ca), lt, [0.95], E.k(lt, 0.3, 0.15) * (1 - E.k(lt, 1.4, 0.2)));
      isl.btnGo.style.transform = `scale(${(1 - 0.1 * Math.max(0, 1 - Math.abs(lt - 0.95) / 0.1)).toFixed(3)})`;
      // trash empties
      const em = E.k(lt, 1.05, 0.12);
      E.op(tFull, 1 - em); E.op(tEmpty, em);
      E.tf(trash, { s: 1 + 0.12 * Math.sin(E.k(lt, 1.05, 0.35) * Math.PI) });
      const ai = E.k(lt, 0.1, 0.5, ez.outExpo);
      E.tf(act.el, { y: (1 - ai) * 120, o: ai });
      actRows.forEach((rw, i) => { if (i === 2) { const p = E.k(lt, 1.12, 0.35, ez.island); E.tf(rw, { x: (1 - p) * -40, o: p }); } });
    };
  });

  /* ============ INSTANT: "dark mode on" → the whole film flips ============ */
  E.scene("instant", T.instant[0], T.instant[1], (root) => {
    const build = (layer, dark) => {
      E.h("div", "fill " + (dark ? "" : "dots"), layer).style.background = dark ? "#07080b" : "";
      const cap = K.caption(layer, { eyebrow: "instant", title: "instant when it can be.", size: 88, x: 130, y: 300, w: 820, dark, sub: "volume, brightness, timers, dark mode, apps. well under 300 ms, completely offline." });
      const cc = E.h("div", "abs", layer);
      E.css(cc, { left: "1010px", top: "210px", width: "760px", height: "640px", borderRadius: "40px", padding: "28px", background: dark ? "rgba(40,42,50,.75)" : "rgba(255,255,255,.75)", boxShadow: dark ? "0 0 0 1px rgba(255,255,255,.08), 0 50px 100px -40px rgba(0,0,0,.8)" : "0 0 0 1px rgba(0,0,0,.06), 0 50px 100px -40px rgba(0,0,0,.35)", color: dark ? "#fff" : "#111", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "150px 150px 110px 110px", gap: "18px" });
      const tile = (html, span, extra = {}) => { const d = E.h("div", "", cc, html); E.css(d, Object.assign({ borderRadius: "26px", background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.045)", padding: "22px 24px", gridColumn: span ? "span 2" : "", display: "flex", alignItems: "center", gap: "18px", fontSize: "22px", fontWeight: 600 }, extra)); return d; };
      const circ = (bg, svg) => `<span style="width:58px;height:58px;border-radius:50%;background:${bg};display:grid;place-items:center;flex:none">${svg}</span>`;
      const moon = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#fff"/></svg>';
      const wifi = '<svg width="30" height="24" viewBox="0 0 20 15"><path d="M10 13.5l2.4-2.9a3.6 3.6 0 0 0-4.8 0zM10 7.2a7 7 0 0 1 4.6 1.7l1.7-2a9.6 9.6 0 0 0-12.6 0l1.7 2A7 7 0 0 1 10 7.2zm0-4.6a11.6 11.6 0 0 1 7.6 2.8l1.7-2A14.2 14.2 0 0 0 .7 3.4l1.7 2A11.6 11.6 0 0 1 10 2.6z" fill="#fff"/></svg>';
      tile(`${circ("#0f7fff", wifi)}<div>Wi‑Fi<div style="font-weight:500;font-size:18px;opacity:.55">Home</div></div>`);
      const dm = tile(`<span class="dm-c" style="width:58px;height:58px;border-radius:50%;display:grid;place-items:center;flex:none">${moon}</span><div>Dark Mode<div class="dm-s" style="font-weight:500;font-size:18px;opacity:.55">Off</div></div>`);
      tile(`${circ("#ff9f0a", '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M12 9v4l3 2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>')}<div>Timer<div style="font-weight:500;font-size:18px;opacity:.55">—</div></div>`);
      tile(`${circ("#5e5ce6", moon)}<div>Focus<div style="font-weight:500;font-size:18px;opacity:.55">Off</div></div>`);
      const slider = (label, v) => tile(`<div style="width:100%"><div style="font-size:18px;margin-bottom:12px">${label}</div><div style="height:30px;border-radius:15px;background:${dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.08)"};overflow:hidden"><div class="sl" style="height:100%;width:${v}%;background:${dark ? "#fff" : "#fff"};box-shadow:0 0 0 1px rgba(0,0,0,.06)"></div></div></div>`, true, { alignItems: "flex-start" });
      const s1 = slider("Display", 70), s2 = slider("Sound", 45);
      return { cap, cc, dmC: dm.querySelector(".dm-c"), dmS: dm.querySelector(".dm-s"), dm, sl: [s1.querySelector(".sl"), s2.querySelector(".sl")] };
    };
    const light = E.h("div", "fill", root), darkL = E.h("div", "fill", root);
    const A = build(light, false), D = build(darkL, true);
    // the voice command + latency readout (shared, on top)
    const pill = E.h("div", "pill pill-blue", root);
    E.css(pill, { fontSize: "34px", left: "1180px", top: "110px" });
    pill.textContent = "“dark mode on”";
    const ms = E.h("div", "abs mono", root);
    E.css(ms, { left: "1300px", top: "880px", fontSize: "30px", color: "var(--electric)" });
    const S = T.instant[0];
    E.cue(S + 0.25, "pop", { g: 0.7 });
    E.cue(S + 0.6, "toggle", { g: 1 });
    E.cue(S + 0.62, "flip", { g: 1 });
    E.cue(S + 1.68, "whoosh", { g: 0.5 });
    return (lt) => {
      const flip = E.k(lt, 0.62, 0.55, ez.inOutCubic);
      const r = E.rect(A.dm);
      const cx = r.left + 52, cy = r.top + r.height / 2;
      darkL.style.clipPath = `circle(${(flip * 2400).toFixed(1)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px)`;
      darkL.style.display = flip > 0 ? "" : "none";
      const ex = E.k(lt, 1.68, 0.2, ez.inExpo);
      for (const L of [A, D]) {
        L.cap.render(lt, 0.0, 1.68);
        const ci = E.k(lt, 0, 0.5, ez.outExpo);
        E.tf(L.cc, { x: (1 - ci) * 300, o: ci * (1 - ex), s: 1 - ex * 0.08 });
        const on = lt > 0.6;
        L.dmC.style.background = on ? "#0f7fff" : L === A ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.2)";
        L.dmS.textContent = on ? "On" : "Off";
        const pop = E.k(lt, 0.6, 0.3, ez.outBack);
        E.tf(L.dm, { s: on ? 0.94 + 0.06 * pop : 1 });
        L.sl[0].style.width = (70 - 25 * E.k(lt, 0.65, 0.4, ez.out)) + "%";
      }
      const pi = E.k(lt, 0.22, 0.35, ez.spring);
      E.tf(pill, { s: 0.5 + 0.5 * pi, o: E.k(lt, 0.22, 0.1) * (1 - ex), y: -ex * 60 });
      const lat = lt < 0.6 ? "" : `${Math.round(E.lerp(0, 38, E.k(lt, 0.6, 0.12, ez.linear)))} ms · offline`;
      if (ms._t !== lat) { ms._t = lat; ms.textContent = lat; }
      E.op(ms, (lt > 0.6 ? 1 : 0) * (1 - ex));
    };
  });
})();
