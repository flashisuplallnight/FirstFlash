/* S01–S05 — glyph hook · stop-motion Mac collage · orb → logo · the island listens · cyan wash.
   Mirrors reference frames f_0002–f_0080 (see docs/SHOTS.md). */
(function () {
  const E = window.E, FX = E.FX, M = E.Mac, C = E.C, K = E.K, ez = E.ease;
  const S = K.S;
  const cream = (root) => { root.style.background = "var(--cream)"; };

  /* ---------- collage cards: real Mac UI at thumbnail size (kits are used when present) ---------- */
  const tryKit = (fn, ...a) => { try { return fn ? fn(...a) : null; } catch (e) { console.warn("card", e.message); return null; } };
  K.card = (kind, w, h, zoom = 0.62) => {
    const box = E.h("div", "", null);
    E.css(box, { position: "absolute", width: w + "px", height: h + "px", borderRadius: "10px", overflow: "hidden", boxShadow: "0 18px 40px -18px rgba(0,0,0,.35), 0 0 0 .5px rgba(0,0,0,.18)", background: "#fff" });
    const iw = w / zoom, ih = h / zoom;
    const inner = E.h("div", "", box);
    E.css(inner, { position: "absolute", left: 0, top: 0, width: iw + "px", height: ih + "px", zoom });
    const win = (o) => { const wn = M.window(inner, Object.assign({ x: 0, y: 0, w: iw, h: ih }, o)); wn.el.style.borderRadius = "0"; wn.el.style.boxShadow = "none"; return wn; };
    let ok = null;
    switch (kind) {
      case "youtube": {
        const sf = tryKit(M.safari, inner, { x: 0, y: 0, w: iw, h: ih, url: "youtube.com", title: "lofi hip hop radio" });
        if (sf) ok = tryKit(M.youtubeWatch, sf.page || sf.content, { w: iw, h: ih - 52 });
        break;
      }
      case "messages": ok = tryKit(M.messages, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "mail": ok = tryKit(M.mail, inner, { x: 0, y: 0, w: iw, h: ih, mode: "message" }); break;
      case "music": ok = tryKit(M.music, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "calendar": ok = tryKit(M.calendar, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "maps": ok = tryKit(M.maps, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "notes": ok = tryKit(M.notes, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "terminal": ok = tryKit(M.terminal, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "editor": ok = tryKit(M.editor, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "settings": ok = tryKit(M.swaeySettings, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "activity": ok = tryKit(M.activity, inner, { x: 0, y: 0, w: iw, h: ih }); break;
      case "sonoma": case "imac-blue": {
        const d = M.desktop(inner, { w: iw, h: ih, wallpaper: kind, app: "Finder", dock: kind === "sonoma" });
        ok = d;
        break;
      }
      case "island": {
        box.style.background = "transparent"; box.style.boxShadow = "none"; box.style.overflow = "visible";
        const host = E.h("div", "", inner);
        E.css(host, { position: "absolute", left: "50%", top: 0, width: 0, height: 0 });
        const isl = new C.Island(host, { em: 18, width: 22 });
        isl.render({ w: 22, h: 7.6, open: 1, content: 1 });
        isl.setIcon("speaker");
        isl.setText("playing lofi girl on youtube. i’ll keep it low.", 0.7);
        isl.face.render({ mood: "talk", t: 0.3 });
        isl.wave.render("speak", 1.3, { amp: 1 });
        ok = isl;
        break;
      }
    }
    if (ok && ok.render) { try { ok.render(0.6, {}); } catch (e) { /* static is fine */ } }
    if (!ok) {
      // fallback: a plain window with a title so the collage still reads as Mac UI
      const wn = win({ title: kind[0].toUpperCase() + kind.slice(1), sidebar: Math.round(iw * 0.26) });
      M.sideItem(wn.side, { icon: "tray", label: "Inbox", sel: true }); M.sideItem(wn.side, { icon: "send", label: "Sent" });
    }
    return { el: box, w, h, kind, ok };
  };

  /* ================= S01 · glyph hook (0.0–2.0) ================= */
  E.shot("S01", (root) => {
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
        { t: 1.68, text: "could just", glyphs: 0 },
      ],
    });
    const vc = FX.voiceCloud(root, { seed: 5, size: 30, count: 28, area: { x: 150, y: 70, w: 1620, h: 940 }, exclude: { x: 960 - 330, y: 470, w: 660, h: 140 } });
    [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.45].forEach((t, i) => E.cue(t, "tick", { g: 0.35, v: i % 6 }));
    E.cue(1.66, "letters", { g: 0.45 });
    return (lt) => {
      gs.render(lt);
      vc.render(lt, { p: E.k(lt, 1.66, 0.34, ez.linear) });
    };
  });

  /* ================= S02 · collage + "just listen?" (2.0–4.4) ================= */
  E.shot("S02", (root) => {
    cream(root);
    const kinds = [["youtube", 560, 340], ["messages", 470, 300], ["sonoma", 520, 330], ["mail", 520, 320], ["music", 480, 300], ["calendar", 500, 320],
      ["island", 420, 150], ["terminal", 420, 260], ["maps", 500, 320], ["notes", 400, 280], ["imac-blue", 360, 240], ["settings", 460, 300], ["editor", 500, 300], ["activity", 480, 280]];
    const cards = kinds.map(([k, w, h]) => K.card(k, w, h));
    const capY = 248;
    const cl = FX.collage(root, { cards: cards.map((c) => ({ el: c.el, w: c.w, h: c.h })), seed: 8, keepOut: { x: 960 - 260, y: capY - 50, w: 520, h: 100 }, step: 0.15 });
    const gs = FX.glyphSequence(root, { y: capY, seed: 9, seq: [{ t: 0, text: "just listen?", accent: "listen?" }, { t: 1.75, text: "listen?", accent: "listen?" }, { t: 2.15, text: "listen" }] });
    const vc = FX.voiceCloud(root, { seed: 13, size: 30, count: 22, area: { x: 150, y: 70, w: 1620, h: 940 }, exclude: { x: 960 - 330, y: capY - 70, w: 660, h: 140 } });
    for (let t = 0.3; t < 2.3; t += 0.3) E.cue(S.S02[0] + t, "tick", { g: 0.22, v: Math.round(t * 10) % 6 });
    E.cue(S.S02[0] + 0.02, "whooshIn", { g: 0.45 });
    return (lt) => {
      vc.render(lt, { p: 1, out: E.k(lt, 0.0, 0.25, ez.linear) });
      gs.render(lt);
      const condense = E.k(lt, 1.4, 0.95, ez.inOutCubic);
      cl.render(lt, { mode: lt < 1.4 ? "scatter" : "condense", p: condense, step: lt < 1.4 ? 0.15 : 0.1, at: [960, 330], shrink: 0.42 });
      E.op(cl.el, lt < 0.08 ? 0 : 1);
    };
  });

  /* ================= S03 · orb → logo (4.4–5.3) ================= */
  E.shot("S03", (root) => {
    cream(root);
    const lg = FX.orbLogo(root, { x: 960, y: 540, size: 96, speed: 1.15 });
    E.cue(S.S03[0], "drop", { g: 0.9 });
    E.cue(S.S03[0] + 0.5, "logo", { g: 0.8 });
    E.cue(S.S03[0] + 0.6, "letters", { g: 0.5 });
    return (lt) => { lg.render(lt); };
  }, { post: 0.0 });

  /* ================= S04 · the island listens (5.3–7.2) ================= */
  E.shot("S04", (root) => {
    cream(root);
    const lk = FX.lockup(root, { x: 960, y: 540, size: 96 });
    const host = E.h("div", "", root);
    E.css(host, { position: "absolute", left: 0, top: 0, width: 0, height: 0 });
    const isl = new C.Island(host, { em: 22, width: 24 });
    const say = "hey swaey, put on some lofi on youtube";
    const burst = FX.glyphSequence(root, { y: 540, seed: 21, spread: 1.6, seq: [{ t: 0, text: "", glyphs: 0 }, { t: 1.55, text: "", glyphs: 9 }, { t: 1.75, text: "", glyphs: 14 }] });
    // framings (hard cuts, like the prompt box moving between shots in the reference)
    const CUTS = [[0.0, 960, 150, 0.8], [0.45, 1420, 170, 0.85], [0.9, 600, 470, 1.0], [1.4, 960, 430, 1.05]];
    const T0 = S.S04[0];
    E.cue(T0 + 0.05, "open", { g: 0.7 });
    say.split(" ").forEach((w, i) => E.cue(T0 + 0.22 + i * 0.17, "key", { g: 0.3, v: i }));
    E.cue(T0 + 1.55, "check", { g: 0.6 });
    E.cue(T0 + 1.6, "shimmer", { g: 0.4 });
    return (lt, t) => {
      // logo slides up and away (ref f_0054–f_0056)
      const up = E.k(lt, 0, 0.3, ez.inCubic);
      E.tf(lk.el, { y: -up * 640, o: lt < 0.3 ? 1 : 0 });
      let cut = CUTS[0];
      for (const c of CUTS) if (lt >= c[0]) cut = c;
      const [, cx, cy, sc] = cut;
      host.style.left = cx + "px";
      host.style.top = cy + "px";
      host.style.zoom = sc;
      const o = E.k(lt, 0.05, 0.6, ez.island);
      const heard = E.clamp((lt - 0.2) / 1.25);
      const done = lt > 1.55;
      isl.render({ w: E.lerp(11, 24, o), h: E.lerp(2.3, done ? 7.6 : 7.6, o), open: o, content: E.k(lt, 0.15, 0.25) });
      isl.setIcon(done ? "check" : "rec");
      isl.setText(say, heard, { dim: 0 });
      isl.face.render(Object.assign(C.moodAt([[0, "listen"], [1.55, "happy"]], lt), { draw: done ? E.k(lt, 1.55, 0.35) : undefined, blink: C.blinkAt([0.95], lt), t: lt }));
      isl.wave.render(done ? "speak" : "listen", t, { amp: o });
      E.tf(burst.el, { x: cx - 960, y: cy + 90 * sc - 540 });
      burst.render(lt);
    };
  });

  /* ================= S05 · cyan wash (7.2–8.0) ================= */
  E.shot("S05", (root) => {
    cream(root);
    const host = E.h("div", "", root);
    E.css(host, { position: "absolute", left: "960px", top: "430px", width: 0, height: 0, zoom: 1.05 });
    const isl = new C.Island(host, { em: 22, width: 24 });
    isl.render({ w: 24, h: 7.6, open: 1, content: 1 });
    isl.setIcon("check");
    isl.setText("hey swaey, put on some lofi on youtube", 1, { dim: 0 });
    isl.face.render({ mood: "happy" });
    const wash = FX.wash(root, 1920, 1080, { palette: "cyan", seed: 4 });
    // thermal, motion-blurred frame sliding through (the lofi art when mac-web provides it, else the wallpaper)
    let src = "assets/wp/sonoma.jpg";
    if (M.lofiArt) {
      try { const cv = document.createElement("canvas"); cv.width = 1280; cv.height = 720; M.lofiArt(cv, 1280, 720, { variant: 0, t: 0.5 }); src = cv.toDataURL("image/jpeg", 0.9); } catch (e) {}
    }
    const art = FX.thermalImage(root, 1920, 1080, { src, scale: 0.5, seed: 3 });
    const mq = FX.marquee(root, { text: "beats to relax ⊙ study to ", size: 300, color: "#ffffff", x: 0, y: 900, repeat: 2 });
    const vc = FX.voiceCloud(root, { seed: 31, size: 22, count: 18, area: { x: 80, y: 60, w: 1760, h: 700 }, color: "#ffffff" });
    E.cue(S.S05[0], "whoosh", { g: 0.7 });
    E.cue(S.S05[0] + 0.4, "swoosh", { g: 0.5 });
    return (lt, t) => {
      const fl = E.k(lt, 0, 0.3, ez.outCubic);
      wash.render(t, { alpha: 1, cover: fl, from: [0.5, 0.45], flow: 1 });
      E.tf(host, { blur: fl * 8, o: 1 - E.k(lt, 0.2, 0.15) });
      const a = E.k(lt, 0.32, 0.12);
      E.op(art.el, a);
      if (a > 0) art.render(t, { mix: 1, zoom: 1.25, flow: 1, pan: [E.lerp(-0.12, 0.12, E.k(lt, 0.3, 0.5, ez.linear)), 0] });
      mq.render(E.lerp(-200, 900, E.k(lt, 0.3, 0.5, ez.linear)), { o: a, blur: 3 });
      vc.render(lt, { p: E.k(lt, 0.35, 0.25, ez.linear), o: 0.7 * a });
    };
  });
})();
