/* mac-dev — Terminal, a VS Code-style editor, Swaey's Activity + Settings windows and the confirm card.
   Built at macOS point sizes; enlarge with `zoom`. All state comes in through render(). */
(function () {
  const E = window.E, M = E.Mac;

  E.h("style", "", document.head, `
  .dv-term { background:#1e1e1e; color:#d8d8d8; font:12.5px/1.5 var(--sf-mono); padding:10px 12px; white-space:pre; }
  .dv-term .p { color:#8ec07c; } .dv-term .d { color:#6e6e6e; } .dv-term .s { color:#5aa2ff; } .dv-term .ok { color:#30d158; }
  .dv-term .y { color:#ffd479; } .dv-term .c { color:#ff9a6b; }
  .dv-ed { position:absolute; inset:0; background:#1f1f1f; color:#cccccc; font:12px/1.5 var(--sf-mono); }
  .dv-ed .act { position:absolute; left:0; top:0; bottom:22px; width:46px; background:#181818; border-right:1px solid #2b2b2b; display:flex; flex-direction:column; align-items:center; gap:18px; padding-top:12px; color:#858585; }
  .dv-ed .act .on { color:#e7e7e7; box-shadow:-2px 0 0 #0078d4; }
  .dv-ed .exp { position:absolute; left:46px; top:0; bottom:22px; width:220px; background:#181818; border-right:1px solid #2b2b2b; font:12px/1 var(--sf); color:#cccccc; }
  .dv-ed .exp .h { font-size:11px; letter-spacing:.06em; color:#bbb; padding:12px 18px 10px; }
  .dv-ed .exp .r { height:22px; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .dv-ed .exp .r.sel { background:#04395e; box-shadow:inset 0 0 0 1px #0078d4; }
  .dv-ed .main { position:absolute; left:266px; right:0; top:0; bottom:22px; }
  .dv-ed .tabs { height:35px; background:#181818; display:flex; border-bottom:1px solid #2b2b2b; }
  .dv-ed .tab { display:flex; align-items:center; gap:7px; padding:0 14px; font:12.5px var(--sf); color:#9d9d9d; border-right:1px solid #2b2b2b; white-space:nowrap; }
  .dv-ed .tab.on { background:#1f1f1f; color:#ffffff; box-shadow:inset 0 1px 0 #0078d4; }
  .dv-ed .crumbs { height:22px; display:flex; align-items:center; gap:6px; padding-left:16px; font:12px var(--sf); color:#a9a9a9; white-space:nowrap; }
  .dv-ed .code { position:absolute; left:0; right:110px; top:58px; bottom:0; overflow:hidden; }
  .dv-ed .ln { display:flex; height:19px; white-space:pre; position:relative; }
  .dv-ed .gut { width:56px; text-align:right; padding-right:22px; color:#6e7681; flex:none; position:relative; }
  .dv-ed .gut i { position:absolute; left:8px; top:3px; width:13px; height:13px; }
  .dv-ed .ln.cur { background:rgba(255,255,255,.04); }
  .dv-ed .k { color:#c586c0; } .dv-ed .kw { color:#569cd6; } .dv-ed .ty { color:#4ec9b0; } .dv-ed .fn { color:#dcdcaa; }
  .dv-ed .st { color:#ce9178; } .dv-ed .nu { color:#b5cea8; } .dv-ed .cm { color:#6a9955; } .dv-ed .pr { color:#9cdcfe; }
  .dv-ed .mini { position:absolute; right:14px; top:58px; width:84px; bottom:0; }
  .dv-ed .status { position:absolute; left:0; right:0; bottom:0; height:22px; background:#0078d4; color:#fff; display:flex; align-items:center; gap:16px; padding:0 10px; font:12px var(--sf); white-space:nowrap; }
  .dv-ed .peek { position:absolute; left:56px; right:120px; height:120px; background:#252526; border-top:2px solid #0078d4; border-bottom:2px solid #0078d4; overflow:hidden; }
  .dv-ed .peek .pt { height:22px; background:#1e3a5a; color:#cfe3ff; font:12px var(--sf); display:flex; align-items:center; padding-left:12px; gap:8px; }
  .dv-ed .err { position:absolute; left:0; top:0; height:19px; display:flex; align-items:center; padding:0 8px; font:12px var(--sf); color:#f48771; background:rgba(244,135,113,.12); white-space:nowrap; }
  .dv-act table { border-collapse:collapse; width:100%; font-size:13px; }
  .dv-act th { text-align:left; font-weight:500; color:rgba(0,0,0,.5); font-size:12px; padding:7px 14px; border-bottom:.5px solid rgba(0,0,0,.1); white-space:nowrap; }
  .dv-act td { padding:9px 14px; white-space:nowrap; border-bottom:.5px solid rgba(0,0,0,.06); }
  .dv-act tr:nth-child(even) td { background:rgba(0,0,0,.022); }
  .dv-pill { display:inline-flex; align-items:center; gap:4px; height:20px; padding:0 8px; border-radius:10px; font-size:11.5px; font-weight:600; }
  .dv-card { position:absolute; width:400px; border-radius:12px; background:#fff; box-shadow:0 0 0 .5px rgba(0,0,0,.14), 0 1px 2px rgba(0,0,0,.06), 0 14px 34px -10px rgba(0,0,0,.25); font-family:var(--sf); color:#1d1d1f; padding:14px 16px 14px; }
  .dv-switch { width:32px; height:19px; border-radius:10px; background:#34c759; position:relative; flex:none; }
  .dv-switch::after { content:""; position:absolute; right:2px; top:2px; width:15px; height:15px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.25); }
  `);

  /* ================= Terminal ================= */
  const TERM = [
    ['<span class="d">Last login: Sun Oct 11 09:58:12 on ttys002</span>', 0],
    ['<span class="p">sudip@MacBook-Pro</span> <span class="d">~ %</span> swaey watch', 0],
    ['<span class="s">swaey</span> <span class="d">›</span> asking <span class="c">claude code</span> to fix the failing test…', 1],
    ['  <span class="s sp">⠋</span> running <span class="y">PricingTests</span>', 1],
    ['<span class="ok">✓</span> found it in <span class="y">PricingTests.swift</span>', 1],
    ['<span class="ok">✓</span> 1 test fixed, all passing', 1],
    ['<span class="s">swaey</span> <span class="d">›</span> done. want me to commit it?', 1],
  ];
  const plain = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
  /* terminal(parent, { x, y, w, h, zoom, title, lines }) → { el, win, render({ chars, t }) } — chars = characters revealed (all by default) */
  M.terminal = (parent, o = {}) => {
    const win = M.window(parent, { x: o.x, y: o.y, w: o.w ?? 640, h: o.h ?? 380, zoom: o.zoom, dark: true, bar: "title", title: o.title || "sudip — swaey — zsh — 80×24", center: true });
    const body = E.h("div", "dv-term", win.content);
    E.css(body, { position: "absolute", inset: 0 });
    const lines = (o.lines || TERM).map(([h, typed]) => ({ h, typed, txt: plain(h), el: E.h("div", "", body) }));
    const total = lines.reduce((a, l) => a + (l.typed ? l.txt.length : 0), 0);
    const api = {
      el: win.el, win, total,
      render(st = {}) {
        let left = st.chars ?? 1e9;
        for (const l of lines) {
          let show;
          if (!l.typed) show = l.h;
          else if (left <= 0) show = "";
          else if (left >= l.txt.length) { show = l.h; left -= l.txt.length; }
          else { show = E.Mac._cutHTML(l.h, left) + '<span style="background:#d8d8d8"> </span>'; left = 0; }
          if (l._s !== show) { l._s = show; l.el.innerHTML = show || "&nbsp;"; l.el.style.visibility = show ? "" : "hidden"; }
        }
        const sp = body.querySelector(".sp");
        if (sp) sp.textContent = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor((st.t || 0) * 14) % 10];
        return api;
      },
    };
    api.render({});
    return api;
  };
  /* cut an HTML string after n visible characters (tags kept balanced for simple spans) */
  M._cutHTML = (h, n) => {
    let out = "", c = 0, open = 0;
    for (let i = 0; i < h.length && c < n; i++) {
      if (h[i] === "<") { const j = h.indexOf(">", i); const tag = h.slice(i, j + 1); out += tag; open += tag[1] === "/" ? -1 : 1; i = j; continue; }
      if (h[i] === "&") { const j = h.indexOf(";", i); out += h.slice(i, j + 1); i = j; c++; continue; }
      out += h[i]; c++;
    }
    while (open-- > 0) out += "</span>";
    return out;
  };

  /* ================= Editor (VS Code, Dark Modern) ================= */
  const SW = (s) => s
    .replace(/(\/\/.*)$/g, '<span class="cm">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="st">"$1"</span>')
    .replace(/\b(import|final|class|func|let|var|return|switch|case|self|enum|nil)\b/g, '<span class="kw">$1</span>')
    .replace(/(@testable)/g, '<span class="k">$1</span>')
    .replace(/\b(XCTest|XCTestCase|HeySwaey|Plan|PricingTests|Int)\b/g, '<span class="ty">$1</span>')
    .replace(/\b(XCTAssertEqual|testFreeTries|testProMonthlyPrice|testMaxMonthlyPrice|testMaxIsSevenTimesPro)\b/g, '<span class="fn">$1</span>')
    .replace(/\.(free|pro|max|monthly|tries|allowance)\b/g, '.<span class="pr">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="nu">$1</span>');
  const CODE = [
    "import XCTest",
    "@testable import HeySwaey",
    "",
    "final class PricingTests: XCTestCase {",
    "    func testFreeTries() {",
    "        XCTAssertEqual(Plan.free.tries, 10)",
    "    }",
    "",
    "    func testProMonthlyPrice() {",
    "        XCTAssertEqual(Plan.pro.monthly, 15)",
    "    }",
    "",
    "    func testMaxMonthlyPrice() {",
    "        XCTAssertEqual(Plan.max.monthly, 100)",
    "    }",
    "",
    "    func testMaxIsSevenTimesPro() {",
    "        XCTAssertEqual(Plan.max.allowance, Plan.pro.allowance * 7)",
    "    }",
    "}",
  ];
  const TESTS = [4, 8, 12, 16]; // line indices with a gutter run icon; 8 is the failing one
  const FAIL = 9;
  const gutIcon = (state) => state === "fail"
    ? '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#f14c4c" stroke-width="1.6"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#f14c4c" stroke-width="1.6" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#73c991" stroke-width="1.6"/><path d="M5 8.3l2 2 4-4.3" fill="none" stroke="#73c991" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* editor(parent, { x, y, w, h, zoom }) → { el, win, render({ typed, fixed, peek, t }) }
     typed: characters of the file revealed (all by default) · peek 0..1 inline diff of Pricing.swift · fixed 0..1 red → green */
  M.editor = (parent, o = {}) => {
    const win = M.window(parent, { x: o.x, y: o.y, w: o.w ?? 1100, h: o.h ?? 680, zoom: o.zoom, dark: true, bar: "title" });
    win.el.style.background = "#1f1f1f";
    if (win.bar) { win.bar.style.background = "#181818"; win.bar.style.borderBottom = "1px solid #2b2b2b"; win.bar.innerHTML = `<div style="position:absolute;left:0;right:0;display:flex;justify-content:center"><div style="width:340px;height:20px;border-radius:5px;background:#2a2a2a;box-shadow:0 0 0 1px #3c3c3c;display:flex;align-items:center;justify-content:center;gap:6px;color:#9d9d9d;font:12px var(--sf)">${M.icon("search", 12)}heyswaey</div></div>`; }
    const ed = E.h("div", "dv-ed", win.content);
    const act = E.h("div", "act", ed);
    ["doc", "search", "share", "play", "grid"].forEach((n, i) => { const s = E.h("span", i === 0 ? "on" : "", act, M.icon(n, 22, { stroke: 1.5 })); s.style.padding = "0 12px"; });
    const exp = E.h("div", "exp", ed);
    exp.innerHTML = `<div class="h">EXPLORER</div><div class="r" style="padding-left:8px;font-weight:700;font-size:11px;letter-spacing:.04em">⌄ HEYSWAEY</div>` +
      [["⌄ Sources", 16, 0], ["⌄ HeySwaey", 26, 0], ["Plan.swift", 46, 1], ["Pricing.swift", 46, 1], ["Island.swift", 46, 1], ["WakeWord.swift", 46, 1], ["⌄ Tests", 16, 0], ["PricingTests.swift", 36, 1, 1], ["WakeWordTests.swift", 36, 1], ["Package.swift", 16, 1]]
        .map(([n, pad, file, sel]) => `<div class="r${sel ? " sel" : ""}" style="padding-left:${pad}px">${file ? '<span style="color:#e37933;font-weight:700;font-size:10px;width:14px">S</span>' : ""}<span>${n}</span></div>`).join("");
    const main = E.h("div", "main", ed);
    E.h("div", "tabs", main, `<div class="tab on"><span style="color:#e37933;font-weight:700;font-size:10px">S</span>PricingTests.swift<span style="opacity:.6">×</span></div><div class="tab"><span style="color:#e37933;font-weight:700;font-size:10px">S</span>Pricing.swift</div><div class="tab"><span style="color:#e37933;font-weight:700;font-size:10px">S</span>Plan.swift</div>`);
    E.h("div", "crumbs", main, `Tests <span>›</span> <span style="color:#e37933;font-weight:700;font-size:10px">S</span> PricingTests.swift <span>›</span> <span style="color:#4ec9b0">PricingTests</span> <span>›</span> <span style="color:#dcdcaa">testProMonthlyPrice()</span>`);
    const code = E.h("div", "code", main);
    const lines = CODE.map((src, i) => {
      const ln = E.h("div", "ln" + (i === FAIL ? " cur" : ""), code);
      const g = E.h("div", "gut", ln, String(i + 1));
      const c = E.h("div", "", ln);
      return { src, ln, g, c, ic: TESTS.includes(i) ? E.h("i", "", g) : null };
    });
    const sq = E.h("div", "", code);
    E.css(sq, { position: "absolute", height: "3px", top: 19 * FAIL + 16 + "px", left: "120px", width: "300px", background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 2.5L1.5 .5 3 2.5 4.5 .5 6 2.5' fill='none' stroke='%23f14c4c' stroke-width='.9'/%3E%3C/svg%3E\") repeat-x" });
    const err = E.h("div", "err", code, "✕ XCTAssertEqual failed: (\"12\") is not equal to (\"15\")");
    E.css(err, { top: 19 * FAIL + "px", left: "470px" });
    const peek = E.h("div", "peek", code);
    E.css(peek, { top: 19 * (FAIL + 1) + "px" });
    peek.innerHTML = `<div class="pt">${M.icon("sparkle", 12)} claude code · Pricing.swift — 1 change</div>` +
      [["", "    var monthly: Int {"], ["", "        switch self {"], ["-", "        case .pro:  return 12"], ["+", "        case .pro:  return 15"]]
        .map(([m, s]) => `<div class="ln" style="background:${m === "-" ? "rgba(255,80,80,.16)" : m === "+" ? "rgba(80,200,120,.16)" : "transparent"}"><div class="gut" style="color:${m === "-" ? "#f14c4c" : m === "+" ? "#73c991" : "#6e7681"}">${m || " "}</div><div>${SW(s)}</div></div>`).join("");
    const mini = E.h("canvas", "mini", main);
    mini.width = 84; mini.height = 420;
    const mx = mini.getContext("2d");
    CODE.forEach((s, i) => { const ind = s.length - s.trimStart().length; mx.fillStyle = i === FAIL ? "rgba(241,76,76,.7)" : ["#569cd6", "#dcdcaa", "#4ec9b0", "#9cdcfe"][i % 4] + "88"; mx.fillRect(4 + ind * 1.2, 4 + i * 5, Math.max(4, s.trim().length * 1.3), 2.4); });
    const status = E.h("div", "status", ed);
    const api = {
      el: win.el, win,
      render(st = {}) {
        const fixed = E.clamp(st.fixed ?? 0), pk = E.clamp(st.peek ?? 0);
        let left = st.typed ?? 1e9;
        for (const l of lines) {
          const n = Math.max(0, Math.min(l.src.length, left));
          left -= l.src.length + 1;
          const key = n + (n < l.src.length ? "|" : "");
          if (l._k !== key) {
            l._k = key;
            const vis = l.src.slice(0, n);
            l.c.innerHTML = SW(vis) + (n < l.src.length && n > 0 ? '<span style="display:inline-block;width:2px;height:15px;background:#aeafad;vertical-align:-3px"></span>' : "");
            l.ln.style.visibility = n > 0 || l.src === "" ? "" : "hidden";
          }
          if (l.ic) { const state = lines.indexOf(l) === 8 && fixed < 0.5 ? "fail" : "ok"; if (l._st !== state) { l._st = state; l.ic.innerHTML = gutIcon(state); } }
        }
        const allTyped = left >= 0;
        E.op(sq, allTyped ? 1 - fixed : 0);
        E.op(err, allTyped ? 1 - E.clamp(fixed * 2) : 0);
        peek.style.display = pk > 0.01 ? "" : "none";
        peek.style.height = 22 + 4 * 19 * pk + "px";
        lines.forEach((l, i) => { l.ln.style.transform = i > FAIL ? `translateY(${(26 + 4 * 19) * pk}px)` : ""; });
        lines[FAIL].ln.style.background = fixed > 0.5 ? "rgba(115,201,145,.10)" : "rgba(241,76,76,.08)";
        const sKey = fixed > 0.5 ? 1 : 0;
        if (status._k !== sKey) {
          status._k = sKey;
          status.style.background = sKey ? "#0078d4" : "#0078d4";
          status.innerHTML = `<span>⎇ main*</span><span>⟳</span><span>${sKey ? "⊗ 0  ⚠ 0" : '<span style="color:#ffd7d7">⊗ 1</span>  ⚠ 0'}</span><span style="flex:1"></span>` +
            (sKey ? '<span style="font-weight:600">✓ 1 test fixed, all passing</span>' : "<span>Testing PricingTests…</span>") + "<span>Ln 10, Col 45</span><span>Spaces: 4</span><span>UTF-8</span><span>Swift</span>";
        }
        return api;
      },
    };
    api.render({});
    return api;
  };

  /* ================= Activity ================= */
  const ACT = [
    ["9:02", "play some lofi", "played lofi girl on youtube", "done", "youtube"],
    ["9:14", "email sarah i’ll be 10 minutes late", "emailed sarah: running late", "done", "mail"],
    ["9:31", "find the acme invoice", "opened invoice-acme-sept.pdf", "done", "preview"],
    ["9:40", "volume to 30", "set volume to 30%", "done", "settings"],
    ["10:02", "ask claude code to fix the failing test", "claude code · 1 test fixed", "done", "terminal"],
    ["10:05", "empty the trash", "asked first · emptied 3 items", "asked first", "trash"],
  ];
  /* activity(parent, { x, y, w, h, zoom }) → { el, win, toolbarIcons: { terminal, wave, code, share, export }, rows } */
  M.activity = (parent, o = {}) => {
    const win = M.window(parent, { x: o.x, y: o.y, w: o.w ?? 900, h: o.h ?? 470, zoom: o.zoom });
    const bar = win.bar;
    const ttl = E.h("div", "", bar, `<div class="mw-title">Activity</div><div class="mw-sub">Today · 6 things</div>`);
    M.tbSpacer(bar);
    M.seg(bar, ["Today", "Week", "Month"], 0);
    M.tbSpacer(bar);
    const ti = {};
    ti.terminal = M.tbBtn(bar, "terminal", { size: 18 });
    ti.wave = M.tbBtn(bar, "waveform", { size: 18 });
    ti.code = M.tbBtn(bar, "code", { size: 18 });
    ti.share = E.h("span", "mac-btn", bar, "Share");
    E.css(ti.share, { height: "26px", padding: "0 12px" });
    ti.export = E.h("span", "mac-btn", bar, "Export");
    E.css(ti.export, { height: "26px", padding: "0 12px", background: "#111", color: "#fff", boxShadow: "none" });
    const wrap = E.h("div", "dv-act", win.content);
    E.css(wrap, { position: "absolute", inset: 0, overflow: "hidden" });
    const rows = [];
    wrap.innerHTML = `<table><tr><th style="width:62px">Time</th><th>You said</th><th>Swaey did</th><th style="width:110px">Status</th></tr>${ACT.map(([t, said, did, st, ic]) =>
      `<tr><td style="color:rgba(0,0,0,.45);font-variant-numeric:tabular-nums">${t}</td><td>“${said}”</td><td style="display:flex;align-items:center;gap:8px">${ic === "youtube" ? '<span style="width:18px;height:13px;border-radius:3px;background:#ff0033;display:inline-block"></span>' : `<img src="assets/icons/${ic}.png" style="width:18px;height:18px">`}${did}</td><td><span class="dv-pill" style="${st === "done" ? "background:rgba(52,199,89,.14);color:#1f8a3c" : "background:rgba(0,122,255,.12);color:#0a63d6"}">${st === "done" ? "✓ done" : "✋ asked first"}</span></td></tr>`).join("")}</table>`;
    wrap.querySelectorAll("tr").forEach((r, i) => i && rows.push(r));
    return { el: win.el, win, toolbarIcons: ti, rows, render() {} };
  };

  /* ================= Swaey Settings (Skills) ================= */
  M.swaeySettings = (parent, o = {}) => {
    const win = M.window(parent, { x: o.x, y: o.y, w: o.w ?? 780, h: o.h ?? 500, zoom: o.zoom, sidebar: 200, bar: "unified", title: "Skills" });
    const hd = E.h("div", "", win.side);
    E.css(hd, { display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px 14px" });
    if (E.K.appMark) { const mk = E.K.appMark(hd, 36); E.css(mk.el, { position: "relative" }); mk.face.render({ mood: "neutral" }); }
    E.h("div", "", hd, `<div style="font-weight:600">HeySwaey</div><div style="font-size:11px;color:rgba(0,0,0,.45)">Swaey Pro</div>`);
    [["gear", "General", "#8e8e93"], ["sparkle", "Brain", "#ff375f"], ["waveform", "Voice", "#0a84ff"], ["bolt", "Skills", "#ff9f0a", 1], ["lock", "Privacy", "#30d158"]].forEach(([ic, n, c, sel]) => {
      const it = E.h("div", "side-i" + (sel ? " sel" : ""), win.side, `<span style="width:20px;height:20px;border-radius:5px;background:${c};color:#fff;display:grid;place-items:center">${M.icon(ic, 13, { stroke: 2 })}</span><span>${n}</span>`);
    });
    const body = E.h("div", "", win.content);
    E.css(body, { padding: "14px 20px" });
    body.innerHTML = `<div style="font-size:12px;color:rgba(0,0,0,.45);margin-bottom:10px">Teach a skill by saying “when I say …”. Put it on a schedule and it’s a routine.</div>` +
      [["focus mode", "quit slack · do not disturb · lofi on spotify", "learned by voice"], ["good night", "close everything · set tomorrow’s reminders · sleep", "learned by voice"], ["ship it", "open editor · start the server · brief claude code", "learned by voice"], ["morning briefing", "weather · first three meetings · important email", "mon–fri · 9:00"]]
        .map(([n, d, b]) => `<div style="display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:9px;background:rgba(0,0,0,.035);margin-bottom:8px"><span style="width:28px;height:28px;border-radius:7px;background:linear-gradient(#ffb340,#ff9500);color:#fff;display:grid;place-items:center">${M.icon("bolt", 15, { stroke: 2 })}</span><div style="flex:1;min-width:0"><div style="font-weight:600">${n}</div><div style="font-size:11.5px;color:rgba(0,0,0,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}</div></div><span class="dv-pill" style="background:rgba(0,122,255,.1);color:#0a63d6">${b}</span><span class="dv-switch"></span></div>`).join("");
    return { el: win.el, win, render() {} };
  };

  /* ================= Confirm card (ref 'DamageReport' card) ================= */
  M.confirmCard = (parent, o = {}) => {
    const el = E.h("div", "dv-card", parent);
    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span style="font-size:15px;font-weight:600;letter-spacing:-.01em">${o.title || "Empty the Trash?"}</span><span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:rgba(0,0,0,.45)">${M.icon("trash", 11)}Trash</span></div>
      <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:12px;color:rgba(0,0,0,.45)"><span style="color:#ff453a">${M.icon("info", 12, { stroke: 2 })}</span>${o.info || "3 items will be gone for good"}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:6px 6px 6px 12px;border-radius:8px;background:rgba(0,0,0,.035)"><span style="font-size:13px">3 items · 48.2 MB</span><span style="display:flex;gap:6px"><span class="mac-btn" style="height:24px">${o.cancel || "Cancel"}</span><span class="mac-btn dv-ok" style="height:24px;background:#111;color:#fff;box-shadow:none">${o.ok || "Go ahead"}</span></span></div>`;
    const ok = el.querySelector(".dv-ok");
    return {
      el, ok,
      render(st = {}) {
        const p = E.clamp(st.press ?? 0);
        ok.style.background = p > 0.5 ? "#3d2a20" : "#111";
        ok.style.transform = `scale(${(1 - 0.05 * Math.sin(Math.min(1, p) * Math.PI)).toFixed(3)})`;
      },
    };
  };
})();
