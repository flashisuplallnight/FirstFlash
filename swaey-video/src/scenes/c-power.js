/* Act 3 (dark mode) — skills & routines · the toolbox · coding agents · privacy */
(function () {
  const E = window.E, C = E.C, K = E.K, T = K.T, ez = E.ease;

  K.darkBg = (parent, gx = 50, gy = 55, a = 0.5) => {
    const d = E.h("div", "fill", parent);
    E.css(d, { background: `radial-gradient(55% 60% at ${gx}% ${gy}%, rgba(15,100,255,${a * 0.5}), rgba(34,24,152,${a * 0.18}) 45%, transparent 75%), #06070a` });
    const g = E.h("div", "fill", parent);
    E.css(g, { backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.3px, transparent 1.6px)", backgroundSize: "32px 32px", backgroundPosition: "16px 16px", maskImage: "radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 85%)" });
    return d;
  };
  const glass = (parent, cls = "") => {
    const d = E.h("div", "abs " + cls, parent);
    E.css(d, { borderRadius: "22px", background: "linear-gradient(180deg, rgba(34,36,44,.92), rgba(20,21,27,.92))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(255,255,255,.07), 0 30px 60px -30px rgba(0,0,0,.8)", color: "#fff" });
    return d;
  };
  const SVGNS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, parent, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent.appendChild(e); return e; };

  /* ============ SKILLS: teach it once. it runs forever. ============ */
  E.scene("skills", T.skills[0], T.skills[1], (root) => {
    K.darkBg(root, 50, 55, 0.55);
    const cam = E.h("div", "fill", root);
    E.css(root, { perspective: "2200px" });
    const cap = K.caption(cam, { eyebrow: "skills & routines", title: "teach it once.\nit runs forever.", size: 84, x: 130, y: 90, w: 900, dark: true });
    const sub = E.h("div", "abs", cam);
    E.css(sub, { left: "1060px", top: "190px", width: "720px", fontSize: "24px", lineHeight: 1.45, letterSpacing: "-0.02em", color: "rgba(255,255,255,.55)" });
    sub.textContent = "say “when i say focus mode, quit slack and put on lofi,” and that’s a skill now. put it on a schedule and it’s a routine.";

    const svg = svgEl("svg", cam, { width: 1920, height: 1080, style: "position:absolute;left:0;top:0;overflow:visible" });
    const defs = svgEl("defs", svg);
    const lg = svgEl("linearGradient", defs, { id: "sk-g", x1: 0, x2: 1, y1: 0, y2: 0 });
    svgEl("stop", lg, { offset: 0, "stop-color": "#9ec5ff" }); svgEl("stop", lg, { offset: 1, "stop-color": "#0f7fff" });

    const node = (x, y, w, h, html) => { const n = glass(cam); E.css(n, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", display: "flex", alignItems: "center", gap: "18px", padding: "0 22px" }); n.innerHTML = html; return n; };
    const badge = (bg, inner) => `<span style="width:54px;height:54px;border-radius:15px;background:${bg};display:grid;place-items:center;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)">${inner}</span>`;
    const mic = '<svg width="24" height="28" viewBox="0 0 24 28"><rect x="7" y="1" width="10" height="17" rx="5" fill="#fff"/><path d="M3 13a9 9 0 0 0 18 0M12 22v5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
    const clock = '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 7v5l3 2" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
    const moon = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#fff"/></svg>';
    const two = (a, b) => `<div><div style="font:500 16px/1 var(--mono);letter-spacing:.06em;color:rgba(255,255,255,.45)">${a}</div><div style="font:600 26px/1.2 var(--sans);letter-spacing:-.02em;margin-top:8px">${b}</div></div>`;
    const trigA = node(130, 450, 340, 104, badge("#0f7fff", mic) + two("YOU SAID", "“focus mode”"));
    const trigB = node(130, 610, 340, 104, badge("#ff9f0a", clock) + two("EVERY WEEKDAY", "at 9:00 am"));
    const skill = glass(cam);
    E.css(skill, { left: "600px", top: "400px", width: "620px", height: "330px", padding: "28px 30px" });
    skill.innerHTML = `<div style="display:flex;align-items:center;gap:16px"><span class="sk-face" style="width:54px;height:54px;border-radius:15px;background:radial-gradient(120% 90% at 50% 112%,#1d4fd6,#0b1236 62%);display:grid;place-items:center"></span>
      <div style="flex:1">${two("SKILL", "focus mode")}</div><span class="chip" style="background:rgba(15,127,255,.16);color:#9ec5ff;box-shadow:0 0 0 1px rgba(15,127,255,.35);font-size:13px">learned by voice</span></div>
      <div style="font:500 25px/1.45 var(--sans);letter-spacing:-.015em;margin-top:24px;color:rgba(255,255,255,.88)">“when i say <span style="background:#ffe066;color:#000;padding:0 .15em;border-radius:4px">focus mode</span>, quit slack, turn on do not disturb and put on some lofi.”</div>
      <div style="display:flex;justify-content:space-between;margin-top:26px;font:500 16px/1 var(--mono);color:rgba(255,255,255,.45)"><span class="sk-run" style="color:#9ec5ff">▸ runs in under a second</span><span>Settings → Skills</span></div>`;
    const skFace = new C.Face(skill.querySelector(".sk-face"), { size: 40, stroke: 11 });
    const skRun = skill.querySelector(".sk-run");
    const ACTS = [["slack", "Slack", "quit"], [null, "Do Not Disturb", "on until 12:00"], ["spotify", "Spotify", "lofi beats · 30% volume"]];
    const acts = ACTS.map(([ic, a, b], i) => {
      const n = node(1350, 410 + i * 118, 450, 96, "");
      if (ic) { const im = C.icon(n, ic, 54); E.css(im, { position: "relative", filter: "none" }); } else n.innerHTML = badge("#5e5ce6", moon);
      E.h("div", "", n, `<div style="font:600 24px/1.15 var(--sans);letter-spacing:-.02em">${a}</div><div style="font-size:18px;color:rgba(255,255,255,.5);margin-top:5px">${b}</div>`).style.flex = "1";
      const ck = E.h("div", "", n);
      E.css(ck, { width: "38px", height: "38px", borderRadius: "50%", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.2)", display: "grid", placeItems: "center" });
      ck.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return { n, ck };
    });
    const path = (d) => { const p = svgEl("path", svg, { d, fill: "none", stroke: "url(#sk-g)", "stroke-width": 3, "stroke-linecap": "round", style: "filter:drop-shadow(0 0 6px rgba(15,127,255,.9))" }); p._L = p.getTotalLength(); p.style.strokeDasharray = p._L; p.style.strokeDashoffset = p._L; return p; };
    const pA = path("M470 502 C 540 502, 530 540, 600 540");
    const pB = path("M470 662 C 540 662, 530 620, 600 620");
    const pO = [0, 1, 2].map((i) => path(`M1220 565 C 1290 565, 1280 ${458 + i * 118}, 1350 ${458 + i * 118}`));
    const dots = [pA, pB, ...pO].map(() => { const c = svgEl("circle", svg, { r: 7, fill: "#fff", style: "filter:drop-shadow(0 0 8px #0f7fff) drop-shadow(0 0 3px #9ec5ff)" }); return c; });
    const RT = [["MON–FRI · 9:00", "morning briefing", "weather, your first three meetings and the email that matters, read out while the kettle boils."], ["“GOOD NIGHT”", "shut down the day", "closes everything, sets tomorrow’s reminders and puts the mac to sleep."], ["“SHIP IT”", "dev mode", "opens your editor and terminal, starts the server and briefs claude code."]];
    const cards = RT.map(([a, b, c], i) => {
      const n = glass(cam);
      E.css(n, { left: 130 + i * 570 + "px", top: "800px", width: "530px", height: "170px", padding: "24px 26px" });
      n.innerHTML = `<div style="font:500 15px/1 var(--mono);letter-spacing:.06em;color:#9ec5ff">${a}</div><div style="font:600 27px/1.2 var(--sans);letter-spacing:-.02em;margin-top:12px">${b}</div><div style="font-size:18px;line-height:1.4;color:rgba(255,255,255,.5);margin-top:8px">${c}</div>`;
      return n;
    });

    const S = T.skills[0];
    E.cue(S + E.b(1), "pop", { g: 0.7 });
    E.cue(S + 0.72, "card", { g: 0.6 });
    [1.172, 1.406, 1.641].forEach((d, i) => E.cue(S + d, "tick", { g: 0.75, v: i + 2 }));
    E.cue(S + E.b(4), "pop", { g: 0.6 });
    E.cue(S + 2.1, "shimmer", { g: 0.5 });
    [2.34, 2.58, 2.81].forEach((d) => E.cue(S + d, "rise", { g: 0.45 }));
    E.cue(S + 3.45, "whoosh", { g: 0.6 });

    const pt = (p, u) => { const q = p.getPointAtLength(E.clamp(u) * p._L); return q; };
    return (lt) => {
      const drift = E.k(lt, 0, 3.75, ez.linear), ex = E.k(lt, 3.45, 0.3, ez.inExpo);
      E.tf(cam, { rx: E.lerp(10, 0, E.k(lt, 0, 1.2, ez.out)), s: E.lerp(0.97, 1.0, drift) - ex * 0.15, o: 1 - ex, blur: ex * 10, y: ex * -60 });
      cap.render(lt, 0, 9);
      E.tf(sub, { o: E.k(lt, 0.35, 0.5), y: (1 - E.k(lt, 0.35, 0.5, ez.out)) * 16 });
      const pop = (el, t0) => { const p = E.k(lt, t0, 0.5, ez.island); E.tf(el, { s: 0.7 + 0.3 * p, o: E.k(lt, t0, 0.15) }); };
      pop(trigA, E.b(1)); pop(skill, 0.7); pop(trigB, E.b(4));
      const draw = (p, t0, d = 0.3) => { const u = E.k(lt, t0, d, ez.inOutCubic); p.style.strokeDashoffset = (p._L * (1 - u)).toFixed(1); return u; };
      draw(pA, 0.55); draw(pB, E.b(4) + 0.1);
      const ts = [1.172, 1.406, 1.641];
      pO.forEach((p, i) => draw(p, ts[i] - 0.22, 0.22));
      // travelling pulses
      const pulse = (c, p, t0, d) => { const u = (lt - t0) / d; if (u < 0 || u > 1) { c.setAttribute("opacity", 0); return; } const q = pt(p, u); c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); c.setAttribute("opacity", Math.sin(u * Math.PI).toFixed(3)); };
      pulse(dots[0], pA, 0.55, 0.3); pulse(dots[1], pB, E.b(4) + 0.1, 0.3);
      pO.forEach((p, i) => pulse(dots[2 + i], p, ts[i] - 0.22, 0.22));
      acts.forEach((a, i) => {
        const p = E.k(lt, ts[i] - 0.05, 0.4, ez.island);
        E.tf(a.n, { x: (1 - p) * 60, o: E.k(lt, ts[i] - 0.1, 0.15) });
        const c = E.k(lt, ts[i], 0.2);
        a.ck.style.background = `rgba(40,200,64,${c.toFixed(3)})`;
        a.ck.style.boxShadow = `inset 0 0 0 2px rgba(255,255,255,${(0.2 * (1 - c)).toFixed(3)}), 0 0 ${(18 * c).toFixed(1)}px rgba(40,200,64,${(0.6 * c).toFixed(3)})`;
        a.ck.firstChild.style.opacity = c;
      });
      skFace.render(Object.assign(C.moodAt([[0, "neutral"], [1.17, "happy"]], lt), { draw: lt > 1.17 ? E.k(lt, 1.17, 0.4) : undefined, blink: C.blinkAt([2.6], lt) }));
      const g = E.k(lt, 2.1, 0.3) * (0.7 + 0.3 * Math.sin(lt * 9));
      skRun.style.textShadow = `0 0 ${(14 * g).toFixed(1)}px rgba(15,127,255,${g.toFixed(3)})`;
      cards.forEach((n, i) => { const p = E.k(lt, 2.34 + i * 0.234, 0.5, ez.outExpo); E.tf(n, { y: (1 - p) * 140, o: p }); });
    };
  });

  /* ============ APPS: works with the apps you already use. ============ */
  E.scene("apps", T.apps[0], T.apps[1], (root) => {
    K.darkBg(root, 50, 62, 0.8);
    const cam = E.h("div", "fill", root);
    const cap = K.caption(cam, { eyebrow: "the toolbox", title: "works with the apps\nyou already use.", size: 80, x: 460, y: 60, w: 1000, dark: true, align: "center" });
    const CX = 960, CY = 650;
    const beams = svgEl("svg", cam, { width: 1920, height: 1080, style: "position:absolute;left:0;top:0" });
    const rings = [[330, 0.34], [520, 0.36], [720, 0.38]];
    rings.forEach(([rx, k]) => svgEl("ellipse", beams, { cx: CX, cy: CY, rx, ry: rx * k, fill: "none", stroke: "rgba(255,255,255,.09)", "stroke-width": 1.5 }));
    const halo = E.h("div", "abs", cam);
    E.css(halo, { left: CX - 260 + "px", top: CY - 260 + "px", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(15,127,255,.55), rgba(15,127,255,0))" });
    const mark = K.appMark(cam, 190);
    E.css(mark.el, { left: CX - 95 + "px", top: CY - 95 + "px", zIndex: 100 });
    const NAMES = ["mail", "slack", "spotify", "calendar", "chrome", "safari", "notes", "reminders", "terminal", "vscode", "claude", "xcode", "music", "maps", "messages", "finder", "photos", "shortcuts", "weather"];
    const ring = (i) => (i < 5 ? 0 : i < 12 ? 1 : 2);
    const counts = [5, 7, 7];
    const idx = [0, 0, 0];
    const icons = NAMES.map((n, i) => {
      const r = ring(i);
      const k = idx[r]++;
      const im = C.icon(cam, n, 104);
      return { im, r, a0: (k / counts[r]) * Math.PI * 2 + r * 0.6, name: n };
    });
    const CHIPS = [["mail", "reply to jake: sounds good, see you at 6", 0.7], ["spotify", "play blinding lights", 1.17], ["calendar", "remind me to call mom at 7", 1.64], ["finder", "open the acme invoice", 2.1]];
    const chips = CHIPS.map(([n, txt, t0]) => {
      const c = E.h("div", "pill pill-blue", cam);
      E.css(c, { fontSize: "26px", zIndex: 200 });
      c.textContent = txt;
      const line = svgEl("line", beams, { stroke: "#9ec5ff", "stroke-width": 3, "stroke-linecap": "round", style: "filter:drop-shadow(0 0 8px #0f7fff)" });
      return { c, n, t0, line, ic: icons.find((o) => o.name === n) };
    });
    const S = T.apps[0];
    E.cue(S, "whooshIn", { g: 0.6 });
    CHIPS.forEach(([, , t0], i) => E.cue(S + t0, "zap", { g: 0.65, v: i }));
    E.cue(S + 2.5, "suck", { g: 0.8 });
    return (lt) => {
      cap.render(lt, 0.05, 2.45);
      const intro = E.k(lt, 0, 0.9, ez.outExpo);
      const out = E.k(lt, 2.45, 0.36, ez.inExpo);
      const pos = {};
      icons.forEach((o, i) => {
        const [rx, kk] = rings[o.r];
        const w = (o.r % 2 ? -1 : 1) * (0.32 - o.r * 0.06) * (1 + out * 6);
        const a = o.a0 + lt * w + (1 - intro) * 1.2 + out * 3;
        const rr = rx * E.lerp(0.2, 1, E.k(lt, i * 0.02, 0.8, ez.outExpo)) * (1 - out);
        const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr * kk;
        const depth = Math.sin(a);
        const s = (0.78 + 0.22 * depth) * E.k(lt, i * 0.025, 0.5, ez.outBack);
        E.tf(o.im, { x: x - 52, y: y - 52, s, o: E.k(lt, i * 0.025, 0.2) * (0.55 + 0.45 * (depth + 1) / 2) * (1 - out * 0.5) });
        o.im.style.zIndex = depth > 0 ? 150 : 50;
        pos[o.name] = [x, y];
      });
      const mp = E.spring(lt - 0.1);
      E.tf(mark.el, { s: (0.5 + 0.5 * mp) * (1 + out * 0.35) });
      mark.face.render(Object.assign(C.moodAt([[0, "neutral"], [0.7, "listen"], [2.3, "happy"]], lt), { blink: C.blinkAt([1.0, 1.9], lt) }));
      E.tf(halo, { s: 1 + 0.06 * Math.sin(lt * 6) + out * 0.8, o: 0.8 + out * 0.2 });
      chips.forEach((o) => {
        const [x, y] = pos[o.n];
        const p = E.k(lt, o.t0, 0.35, ez.spring) * (1 - E.k(lt, o.t0 + 0.75, 0.2));
        const side = x > CX ? 1 : -1;
        const cw = o.c.offsetWidth;
        E.tf(o.c, { x: side > 0 ? x + 70 : x - 70 - cw, y: y - 70, s: 0.6 + 0.4 * p, o: p });
        const b = E.k(lt, o.t0 - 0.05, 0.12) * (1 - E.k(lt, o.t0 + 0.35, 0.3));
        o.line.setAttribute("x1", CX); o.line.setAttribute("y1", CY);
        o.line.setAttribute("x2", x.toFixed(1)); o.line.setAttribute("y2", y.toFixed(1));
        o.line.setAttribute("opacity", b.toFixed(3));
      });
    };
  });

  /* ============ CODE: coding agents, by voice ============ */
  E.scene("code", T.code[0], T.code[1], (root) => {
    K.darkBg(root, 62, 50, 0.5);
    const cam = E.h("div", "fill", root);
    const big = E.h("div", "abs mono", cam);
    E.css(big, { left: "0", right: "0", top: "390px", textAlign: "center", fontSize: "88px", fontWeight: 500, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em", transformOrigin: "50% 50%" });
    const bigA = E.h("div", "", big), bigB = E.h("div", "", big);
    const cap = K.caption(cam, { eyebrow: "coding agents", title: "coding agents,\nby voice.", size: 80, x: 130, y: 330, w: 640, dark: true, sub: "kick off claude code or codex in the background. keep working. swaey tells you when it’s done." });
    const term = C.Window(cam, { w: 1000, h: 560, title: "zsh — heyswaey", dark: true });
    E.css(term.el, { left: "800px", top: "260px" });
    const body = E.h("div", "mono", term.body);
    E.css(body, { padding: "30px 34px", fontSize: "27px", lineHeight: 1.75, color: "rgba(255,255,255,.88)" });
    const LINES = [
      ['<span style="color:#5aa2ff">swaey ›</span> asking claude code to fix the failing test…', 1.05],
      ['<span class="sp" style="color:#9ec5ff">⠋</span> <span style="color:rgba(255,255,255,.5)">running PricingTests…</span>', 1.3],
      ['<span style="color:#28c840">✓</span> found it in <span style="color:#ffd479">PricingTests.swift</span>', 1.64],
      ['<span style="color:#28c840">✓</span> 1 test fixed, all passing', 1.875],
      ['<span style="color:#5aa2ff">swaey ›</span> done. want me to commit it?', 2.11],
    ];
    const rows = LINES.map(([h]) => E.h("div", "", body, h));
    const spin = rows[1].querySelector(".sp");
    const icC = C.icon(cam, "claude", 120), icV = C.icon(cam, "vscode", 100), icT = C.icon(cam, "terminal", 96);
    const BIG1 = "ask claude code", BIG2 = "to fix the failing test";
    const S = T.code[0];
    K.typeCues(S + 0.05, BIG1 + " " + BIG2, 44, 2, 0.5);
    E.cue(S + 0.98, "swoosh", { g: 0.7 });
    [1.64, 1.875].forEach((d) => E.cue(S + d, "tick", { g: 0.7, v: 3 }));
    E.cue(S + 2.11, "chime", { g: 0.45 });
    E.cue(S + 2.6, "whoosh", { g: 0.6 });
    return (lt) => {
      const n = (lt - 0.05) * 44;
      const hlA = (s) => s.replace("claude code", '<span style="color:#ff9a6b;text-shadow:0 0 30px rgba(217,119,87,.8)">claude code</span>');
      const hlB = (s) => s.replace("failing test", '<span style="color:#ff6b6b;text-shadow:0 0 30px rgba(255,80,80,.7)">failing test</span>');
      const a = BIG1.slice(0, E.clamp(Math.floor(n), 0, BIG1.length)), b = BIG2.slice(0, E.clamp(Math.floor(n - BIG1.length - 1), 0, BIG2.length));
      const ka = a + "|" + b;
      if (big._k !== ka) {
        big._k = ka;
        bigA.innerHTML = '<span style="color:#5aa2ff">› </span>' + (a.length === BIG1.length ? hlA(a) : a);
        bigB.innerHTML = (b.length === BIG2.length ? hlB(b) : b) + (lt < 0.95 ? '<span style="display:inline-block;width:.55em;height:.9em;background:#5aa2ff;vertical-align:-.1em;margin-left:.08em;opacity:.9"></span>' : "");
      }
      // big type shrinks into the terminal
      const m = E.k(lt, 0.95, 0.4, ez.inOutExpo);
      E.tf(big, { s: E.lerp(1, 0.28, m), x: m * 340, y: m * -150, o: 1 - E.k(lt, 1.2, 0.15) });
      const ti = E.k(lt, 0.98, 0.45, ez.outExpo), ex = E.k(lt, 2.6, 0.21, ez.inExpo);
      E.tf(term.el, { s: E.lerp(0.85, 1, ti) + ex * 0.15, o: ti * (1 - ex), ry: -8 * (1 - ti) - 6, rx: 3, blur: ex * 8 });
      cap.render(lt, 1.0, 2.6);
      rows.forEach((r, i) => { const p = E.k(lt, LINES[i][1], 0.2, ez.out); E.tf(r, { x: (1 - p) * -20, o: p }); });
      const fr = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
      spin.textContent = lt < 1.64 ? fr[Math.floor(lt * 14) % fr.length] : "✓";
      spin.style.color = lt < 1.64 ? "#9ec5ff" : "#28c840";
      const fl = (im, x, y, t0, ph) => { const p = E.k(lt, t0, 0.5, ez.outBack); E.tf(im, { x, y: y + Math.sin(lt * 2 + ph) * 10, s: p, o: p * (1 - ex), rz: Math.sin(lt * 1.5 + ph) * 6 }); };
      fl(icC, 1720, 190, 1.2, 0); fl(icV, 740, 760, 1.35, 1); fl(icT, 1730, 760, 1.5, 2);
    };
  });

  /* ============ PRIVACY: your voice never leaves your mac. ============ */
  E.scene("privacy", T.privacy[0], T.privacy[1], (root) => {
    K.darkBg(root, 50, 62, 0.65);
    const cam = E.h("div", "fill", root);
    const head = E.h("div", "abs display", cam);
    E.css(head, { left: 0, right: 0, top: "70px", textAlign: "center", fontSize: "128px", letterSpacing: "-0.055em", lineHeight: 0.95 });
    const h1 = E.h("div", "", head); h1.textContent = "your voice never leaves";
    E.css(h1, { background: "linear-gradient(180deg,#5c5f6b,#c9ccd6)", webkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" });
    const h2 = E.h("div", "", head); h2.textContent = "your mac."; h2.style.color = "#fff";
    // the mac outline that keeps everything in
    const W = 980, H = 600, X = 960 - W / 2, Y = 360;
    const svg = svgEl("svg", cam, { width: 1920, height: 1080, style: "position:absolute;left:0;top:0" });
    const box = svgEl("path", svg, { d: `M${X + 40} ${Y} H${960 - 90} v18 a18 18 0 0 0 18 18 h144 a18 18 0 0 0 18 -18 v-18 H${X + W - 40} a40 40 0 0 1 40 40 V${Y + H - 40} a40 40 0 0 1 -40 40 H${X + 40} a40 40 0 0 1 -40 -40 V${Y + 40} a40 40 0 0 1 40 -40 Z`, fill: "rgba(255,255,255,.02)", stroke: "rgba(158,197,255,.55)", "stroke-width": 2.5, style: "filter:drop-shadow(0 0 10px rgba(15,127,255,.6))" });
    const BL = box.getTotalLength();
    box.style.strokeDasharray = BL;
    const cv = E.h("canvas", "abs", cam);
    cv.width = 1920; cv.height = 1080;
    const ctx = cv.getContext("2d");
    const orb = E.h("div", "abs", cam);
    E.css(orb, { left: 960 - 170 + "px", top: Y + H / 2 - 170 + "px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(40,120,255,.75), rgba(15,60,200,.25) 60%, transparent)", display: "grid", placeItems: "center" });
    const face = new C.Face(orb, { size: 200, stroke: 9 });
    const rnd = E.rng(42);
    const P = Array.from({ length: 220 }, (_, i) => ({ a: rnd() * Math.PI * 2, v: 260 + rnd() * 380, t0: 0.15 + (i % 11) * 0.09 + rnd() * 0.05, s: 2 + rnd() * 3.5 }));
    const sprite = (col, r) => { const c = document.createElement("canvas"); c.width = c.height = r * 2; const g = c.getContext("2d"); const gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, col); gr.addColorStop(0.25, col); gr.addColorStop(0.45, "rgba(15,127,255,.45)"); gr.addColorStop(1, "rgba(15,127,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; };
    const spW = sprite("#ffffff", 22), spB = sprite("#8fc2ff", 18);
    const fold = (x, a, b) => { const L = b - a; let u = (x - a) / L; u = u - 2 * Math.floor(u / 2); return a + (u > 1 ? 2 - u : u) * L; };
    const panel = (x, title) => { const n = glass(cam); E.css(n, { left: x + "px", top: "540px", width: "520px", padding: "26px 28px" }); n.innerHTML = `<div style="font:600 25px/1.2 var(--sans);letter-spacing:-.02em;margin-bottom:16px">${title}</div>`; return n; };
    const pl = panel(70, "on-device, start to finish");
    const LIST = ["whisper hears you, on-device", "qwen3 talks back, on-device", "wake word trained on you", "risky actions ask first"];
    const li = LIST.map((s, i) => E.h("div", "", pl, `<span style="font:500 15px var(--mono);color:rgba(255,255,255,.35);margin-right:14px">0${i + 1}</span>${s}<span class="ok" style="float:right;color:#28c840;font-weight:700">✓</span>`));
    li.forEach((d) => E.css(d, { padding: "13px 16px", marginTop: "8px", borderRadius: "12px", background: "rgba(255,255,255,.05)", font: "500 19px/1.2 var(--mono)", color: "rgba(255,255,255,.85)" }));
    const pr = panel(1330, "Privacy · today");
    const LOG = [["9:14", "“email sarah i’ll be 10 min late”", "text → ai", "#9ec5ff"], ["9:31", "“find the acme invoice”", "stayed on mac", "#9ec5ff"], ["9:40", "“volume to 30”", "stayed on mac", "#9ec5ff"], ["10:02", "audio recordings", "0 sent", "#28c840"]];
    const lg = LOG.map(([tm, tx, tag, c]) => E.h("div", "", pr, `<span style="font:500 15px var(--mono);color:rgba(255,255,255,.35);width:52px;display:inline-block">${tm}</span><span style="flex:1">${tx}</span><span class="tg" style="font:500 13px var(--mono);padding:6px 10px;border-radius:99px;background:${c === "#28c840" ? "rgba(40,200,64,.16)" : "rgba(15,127,255,.14)"};color:${c}">${tag}</span>`));
    lg.forEach((d) => E.css(d, { display: "flex", alignItems: "center", gap: "10px", padding: "12px 4px", borderTop: "1px solid rgba(255,255,255,.07)", fontSize: "18px", color: "rgba(255,255,255,.85)" }));
    const zero = lg[3].querySelector(".tg");
    const S = T.privacy[0];
    E.cue(S, "dark", { g: 0.9 });
    E.cue(S + 0.2, "shimmer", { g: 0.5 });
    E.cue(S + 0.75, "slam", { g: 0.6 });
    E.cue(S + 1.875, "rise", { g: 0.5 });
    E.cue(S + 3.05, "check", { g: 0.8 });
    E.cue(S + 3.5, "riser2", { g: 0.6 });
    return (lt, t) => {
      const ex = E.k(lt, 3.5, 0.25, ez.inExpo);
      E.tf(cam, { s: 1 + ex * 0.4, o: 1 - ex, blur: ex * 16 });
      box.style.strokeDashoffset = (BL * (1 - E.k(lt, 0, 0.7, ez.inOutCubic))).toFixed(1);
      // headline
      const hp = E.k(lt, 0.7, 0.6, ez.out);
      E.tf(h1, { y: (1 - hp) * 60, o: hp, blur: (1 - hp) * 12 });
      const hq = E.k(lt, 0.88, 0.6, ez.out);
      E.tf(h2, { y: (1 - hq) * 60, o: hq, blur: (1 - hq) * 12 });
      // orb + face
      const op = E.spring(lt - 0.15);
      E.tf(orb, { s: 0.3 + 0.7 * op, o: E.k(lt, 0.15, 0.2) });
      face.render(Object.assign(C.moodAt([[0, "listen"], [1.2, "neutral"], [3.05, "happy"]], lt), { blink: C.blinkAt([1.6, 2.6], lt), draw: lt > 3.05 ? E.k(lt, 3.05, 0.4) : undefined }));
      // voice particles bounce inside the mac, never out
      ctx.clearRect(0, 0, 1920, 1080);
      const cx = 960, cy = Y + H / 2;
      for (const p of P) {
        const u = lt - p.t0;
        if (u < 0) continue;
        const life = E.clamp(1 - u / 2.2);
        if (life <= 0) continue;
        const d = p.v * u * (1 - 0.18 * u);
        const x = fold(cx + Math.cos(p.a) * d, X + 14, X + W - 14), y = fold(cy + Math.sin(p.a) * d, Y + 14, Y + H - 14);
        ctx.globalAlpha = life * 0.9;
        const sp = p.s > 4 ? spW : spB, r = p.s * 3.2;
        ctx.drawImage(sp, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      // panels
      const a1 = E.k(lt, 1.875, 0.55, ez.outExpo), a2 = E.k(lt, 2.05, 0.55, ez.outExpo);
      E.tf(pl, { x: (1 - a1) * -200, o: a1 });
      E.tf(pr, { x: (1 - a2) * 200, o: a2 });
      li.forEach((d, i) => { const p = E.k(lt, 2.1 + i * 0.117, 0.3, ez.out); E.tf(d, { x: (1 - p) * -24, o: p }); d.querySelector(".ok").style.opacity = E.k(lt, 2.2 + i * 0.117, 0.15); });
      lg.forEach((d, i) => { const p = E.k(lt, 2.25 + i * 0.117, 0.3, ez.out); E.tf(d, { x: (1 - p) * 24, o: p }); });
      const z = E.k(lt, 3.05, 0.4, ez.outBack);
      zero.style.transform = `scale(${(1 + 0.35 * Math.sin(E.clamp((lt - 3.05) / 0.4) * Math.PI)).toFixed(3)})`;
      zero.style.boxShadow = `0 0 ${(24 * z).toFixed(1)}px rgba(40,200,64,${(0.7 * z).toFixed(3)})`;
    };
  });
})();
