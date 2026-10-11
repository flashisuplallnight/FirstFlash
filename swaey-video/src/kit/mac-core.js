/* macOS (Sonoma) foundation: icons, window chrome, sidebar, toolbar, menu bar, dock, desktop.
   Everything is plain DOM built once; animate it from shots with E.tf / E.css.
   Build windows at real macOS point sizes (13 px text) and enlarge with `zoom` (crisp text),
   e.g. M.window(root, { w: 980, h: 620, zoom: 1.6 }). */
(function () {
  const E = window.E;
  const M = (E.Mac = E.Mac || {});

  /* ---------- icons: SF Symbols-like, 24×24 grid, stroked ---------- */
  const P = {
    "sidebar": '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9.5 4.5v15M5.5 8h2M5.5 10.5h2M5.5 13h2"/>',
    "chev-l": '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    "chev-r": '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    "chev-d": '<path d="M5.5 9.5 12 16l6.5-6.5"/>',
    "chev-u": '<path d="M5.5 14.5 12 8l6.5 6.5"/>',
    "chev-ud": '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>',
    "search": '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "minus": '<path d="M5 12h14"/>',
    "compose": '<path d="M13 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V11"/><path d="M17.8 3.8a1.6 1.6 0 0 1 2.3 2.3l-8.3 8.3-3.1.8.8-3.1z"/>',
    "trash": '<path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7M6.5 6.5l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2M10 10v6.5M14 10v6.5"/>',
    "archive": '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5v9.5a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12h4"/>',
    "flag": '<path d="M6 21V4.5M6 5c3-1.5 5 1.5 8 0s4-.5 4-.5v8s-1.5-1-4 .5-5-1.5-8 0"/>',
    "reply": '<path d="M10 6 4 12l6 6M4.5 12H14a6 6 0 0 1 6 6v1"/>',
    "reply-all": '<path d="M9 7l-5 5 5 5M13 7l-5 5 5 5M8.5 12H15a5 5 0 0 1 5 5v1"/>',
    "forward": '<path d="M14 6l6 6-6 6M19.5 12H10a6 6 0 0 0-6 6v1"/>',
    "tray": '<path d="M3.5 13.5 6 5.5h12l2.5 8V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/><path d="M3.5 13.5h4.5a4 4 0 0 0 8 0h4.5"/>',
    "send": '<path d="M20.5 3.5 3.5 10.5l7 3 3 7z"/><path d="m10.5 13.5 10-10"/>',
    "doc": '<path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z"/><path d="M13.5 3.5v5h5"/>',
    "doc-text": '<path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z"/><path d="M13.5 3.5v5h5M8.5 12.5h7M8.5 15.5h7M8.5 9.5h3"/>',
    "folder": '<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4.3l2 2H19A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
    "star": '<path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z"/>',
    "person": '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    "person-2": '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5a6 6 0 0 1 12 0M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 13.5a6 6 0 0 1 3.5 6"/>',
    "gear": '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/>',
    "bell": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
    "share": '<path d="M12 3.5v11M8 7.5l4-4 4 4M7.5 10.5H6a1.5 1.5 0 0 0-1.5 1.5v6.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5h-1.5"/>',
    "ellipsis": '<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>',
    "ellipsis-c": '<circle cx="12" cy="12" r="8.5"/><circle cx="8" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16" cy="12" r=".9" fill="currentColor"/>',
    "grid": '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    "list": '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="5" cy="6.5" r=".9" fill="currentColor"/><circle cx="5" cy="12" r=".9" fill="currentColor"/><circle cx="5" cy="17.5" r=".9" fill="currentColor"/>',
    "play": '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>',
    "pause": '<path d="M8 5.5v13M16 5.5v13" stroke-width="3"/>',
    "next": '<path d="M5 6v12l7-6zM12 6v12l7-6z" fill="currentColor"/>',
    "prev": '<path d="M19 6v12l-7-6zM12 6v12l-7-6z" fill="currentColor"/>',
    "shuffle": '<path d="M4 7h3.5c3.5 0 5.5 10 9 10H20M4 17h3.5c1.4 0 2.5-1.5 3.5-3.3M13 9.3C14 7.6 15 7 16.5 7H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>',
    "repeat": '<path d="M5 11V9.5A2.5 2.5 0 0 1 7.5 7H19M16.5 4.5 19 7l-2.5 2.5M19 13v1.5a2.5 2.5 0 0 1-2.5 2.5H5M7.5 19.5 5 17l2.5-2.5"/>',
    "speaker": '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    "waveform": '<path d="M3.5 12v0M6.5 9.5v5M9.5 6v12M12.5 8.5v7M15.5 4.5v15M18.5 9v6M21 11.5v1"/>',
    "calendar": '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
    "pin": '<path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    "car": '<path d="M4.5 16.5v-4l2-5.5A1.5 1.5 0 0 1 7.9 6h8.2a1.5 1.5 0 0 1 1.4 1L19.5 12.5v4M3.5 12.5h17v4.5h-17zM6.5 17v2.5M17.5 17v2.5"/><circle cx="7.5" cy="14.8" r=".8" fill="currentColor"/><circle cx="16.5" cy="14.8" r=".8" fill="currentColor"/>',
    "walk": '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2.2-6.5L10 11l3-3 2.5 3.5 3 1M12.2 14.5l3 2.5 1 4M10 11l-3 2.5"/>',
    "tram": '<rect x="6" y="4" width="12" height="13" rx="3"/><path d="M6 11.5h12M9 20.5l1.5-3.5M15 20.5l-1.5-3.5M10 2.5h4"/>',
    "nav": '<path d="M20.5 3.5 3.5 11l7.5 2 2 7.5z" fill="currentColor"/>',
    "lock": '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    "shield": '<path d="M12 3.2 5 5.8v5.4c0 4.6 3 8.3 7 9.6 4-1.3 7-5 7-9.6V5.8z"/>',
    "shield-check": '<path d="M12 3.2 5 5.8v5.4c0 4.6 3 8.3 7 9.6 4-1.3 7-5 7-9.6V5.8z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "check-c": '<circle cx="12" cy="12" r="8.5"/><path d="m8 12.3 2.8 2.8L16.2 9.5"/>',
    "xmark": '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    "info": '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor"/>',
    "warn": '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>',
    "cloud-up": '<path d="M7 18.5h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.2 3.2 0 0 0 7 18.5z"/><path d="M12 16v-5.5M9.8 12.5 12 10.3l2.2 2.2"/>',
    "arrow-ur": '<path d="M7 17 17 7M9 7h8v8"/>',
    "terminal": '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5M12 15h5"/>',
    "code": '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
    "wifi": '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="18.5" r="1.1" fill="currentColor"/>',
    "battery": '<rect x="2.5" y="7.5" width="17" height="9" rx="2.5"/><rect x="4.5" y="9.5" width="11" height="5" rx="1" fill="currentColor"/><path d="M21.5 10.5v3"/>',
    "cc": '<rect x="3.5" y="5.5" width="17" height="5.5" rx="2.75"/><rect x="3.5" y="13" width="17" height="5.5" rx="2.75"/><circle cx="7.5" cy="8.25" r="1.7" fill="currentColor"/><circle cx="16.5" cy="15.75" r="1.7" fill="currentColor"/>',
    "moon": '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "photo": '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5"/>',
    "note": '<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    "globe": '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-3 3-3 14 0 17M12 3.5c3 3 3 14 0 17"/>',
    "house": '<path d="M4 11 12 4l8 7M6.5 9.5V20h11V9.5"/>',
    "compass": '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    "refresh": '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
    "tabs": '<rect x="4" y="7" width="13" height="12" rx="2"/><path d="M7.5 4.5H18a2 2 0 0 1 2 2V15"/>',
    "sparkle": '<path d="M12 3.5c.6 4.5 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-4 8.5-8.5z"/>',
    "bolt": '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    "hand": '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5A6.5 6.5 0 0 1 5 17l-1.5-3.2a1.4 1.4 0 0 1 2.4-1.4L8 15"/>',
    "dot": '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
    "keyboard": '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6 12.5h.01M18 12.5h.01M8.5 15h7"/>',
    "apple": '<path fill="currentColor" stroke="none" d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2.1-.9-3.4-.9c-1.8 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3 0 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.6-1-2.6-4.2zM13.9 5c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"/>',
  };
  M.ICONS = Object.keys(P);
  /* svg markup string; opts: { stroke, fill, cls } */
  M.icon = (name, size = 16, opts = {}) => {
    const sw = opts.stroke ?? 1.7;
    return `<svg class="ic ${opts.cls || ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${opts.fill || "none"}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block">${P[name] || P.dot}</svg>`;
  };

  /* ---------- window ---------- */
  /* opts: { w, h, x, y, title, sub, dark, sidebar (px, 0 = none), bar ('unified' 52 | 'title' 28 | 'none' 0),
             zoom, tlsOff, center (center title), cls }
     returns { el, side, main, bar, content, tls, title } — `content` sits below the bar. */
  M.window = (parent, o = {}) => {
    const w = o.w ?? 900, h = o.h ?? 600, sb = o.sidebar ?? 0;
    const barH = o.bar === "none" ? 0 : o.bar === "title" ? 28 : 52;
    const el = E.h("div", "mw" + (o.dark ? " dark" : "") + (o.cls ? " " + o.cls : ""), parent);
    // `zoom` scales left/top too, so divide them back out: x/y stay in stage pixels.
    const z = o.zoom || 1;
    E.css(el, { width: w + "px", height: h + "px", left: (o.x ?? 0) / z + "px", top: (o.y ?? 0) / z + "px" });
    if (o.zoom) el.style.zoom = o.zoom;
    let side = null;
    if (sb) {
      side = E.h("div", "mw-side", el);
      E.css(side, { width: sb + "px", paddingTop: (barH || 28) + 4 + "px" });
    }
    const main = E.h("div", "mw-main", el);
    E.css(main, { left: sb + "px" });
    let bar = null, title = null;
    if (barH) {
      bar = E.h("div", "mw-bar", main);
      E.css(bar, { height: barH + "px", paddingLeft: (sb ? 12 : 80) + "px" });
      if (o.title) {
        title = E.h("div", "", bar);
        title.innerHTML = `<div class="mw-title">${o.title}</div>${o.sub ? `<div class="mw-sub">${o.sub}</div>` : ""}`;
        if (o.center) E.css(title, { position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none" });
      }
    }
    const content = E.h("div", "mw-content", main);
    E.css(content, { top: barH + "px" });
    const tls = E.h("div", "tls" + (o.tlsOff ? " off" : ""), el);
    tls.innerHTML = "<i></i><i></i><i></i>";
    E.css(tls, { height: (barH || 28) + "px" });
    return { el, side, main, bar, content, tls, title, barH };
  };

  M.tbBtn = (parent, icon, { on = false, size = 17, label = "" } = {}) => {
    const b = E.h("span", "tb-btn" + (on ? " on" : ""), parent, M.icon(icon, size) + (label ? `<span style="font-size:13px">${label}</span>` : ""));
    return b;
  };
  M.tbSpacer = (parent) => { const s = E.h("span", "", parent); s.style.flex = "1"; return s; };
  M.seg = (parent, items, on = 0) => {
    const s = E.h("span", "tb-seg", parent);
    items.forEach((t, i) => E.h("span", i === on ? "on" : "", s, t));
    return s;
  };
  M.search = (parent, { w = 180, placeholder = "Search" } = {}) => {
    const s = E.h("span", "search", parent, M.icon("search", 14, { stroke: 2 }) + `<span>${placeholder}</span>`);
    s.style.width = w + "px";
    return s;
  };
  M.sideHead = (parent, text) => E.h("div", "side-h", parent, text);
  /* { icon, label, color, badge, sel } */
  M.sideItem = (parent, o) => {
    const it = E.h("div", "side-i" + (o.sel ? " sel" : ""), parent);
    it.innerHTML = (o.icon ? `<span style="color:${o.color || "var(--mac-accent)"}">${M.icon(o.icon, 16, { stroke: 1.8 })}</span>` : "") + `<span>${o.label}</span>` + (o.badge != null ? `<span class="badge">${o.badge}</span>` : "");
    return it;
  };

  /* macOS Contacts-style avatar: grey gradient with initials (or a colour pair) */
  const AV = [["#a1a8b8", "#848b9c"], ["#f8a0a8", "#e5727f"], ["#9fc5ff", "#5d97f0"], ["#b9a5f7", "#8a73e6"], ["#ffc48a", "#f59a4a"], ["#8fd9b0", "#4fb985"]];
  M.avatar = (parent, initials, size = 32, tone = 0) => {
    const [a, b] = AV[tone % AV.length];
    const d = E.h("div", "avatar", parent, initials);
    E.css(d, { width: size + "px", height: size + "px", fontSize: Math.round(size * 0.4) + "px", background: `linear-gradient(180deg, ${a}, ${b})` });
    return d;
  };

  /* ---------- menu bar ---------- */
  M.menubar = (parent, { app = "Finder", items = ["File", "Edit", "View", "Go", "Window", "Help"], clock = "Sun 11 Oct  9:41 AM", h = 24, light = false, notch = 0, swaey = true } = {}) => {
    const mb = E.h("div", "menubar" + (light ? " light" : ""), parent);
    E.css(mb, { height: h + "px", background: light ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.12)" });
    const l = E.h("div", "mb-l", mb);
    l.innerHTML = M.icon("apple", 15) + `<span class="mb-app">${app}</span>` + items.map((t) => `<span>${t}</span>`).join("");
    const r = E.h("div", "mb-r", mb);
    r.innerHTML = (swaey ? '<span class="mb-swaey" style="width:18px;height:18px;display:grid;place-items:center"></span>' : "") + M.icon("battery", 19, { stroke: 1.3 }) + M.icon("wifi", 15, { stroke: 1.8 }) + M.icon("search", 14, { stroke: 2 }) + M.icon("cc", 15, { stroke: 1.5 }) + `<span style="font-variant-numeric:tabular-nums">${clock}</span>`;
    let face = null;
    if (swaey && E.C && E.C.Face) face = new E.C.Face(r.querySelector(".mb-swaey"), { size: 16, stroke: 11, ink: light });
    return { el: mb, face };
  };

  /* ---------- dock ---------- */
  M.dock = (parent, { icons = ["finder", "safari", "messages", "mail", "maps", "photos", "calendar", "notes", "music", "settings", "|", "heyswaey", "terminal", "trash"], size = 50, bottom = 6, running = ["finder", "safari", "heyswaey"] } = {}) => {
    const d = E.h("div", "dock", parent);
    d.style.bottom = bottom + "px";
    d.style.borderRadius = Math.round(size * 0.36) + "px";
    for (const n of icons) {
      if (n === "|") { E.h("div", "dock-sep", d); continue; }
      const w = E.h("div", "", d);
      E.css(w, { position: "relative", width: size + "px", height: size + "px" });
      const im = E.h("img", "", w);
      im.src = `assets/icons/${n}.png`;
      E.css(im, { width: size + "px", height: size + "px" });
      if (running.includes(n)) E.h("i", "dock-dot", w);
    }
    return d;
  };

  /* ---------- desktop: wallpaper + menu bar (+ notch) ---------- */
  /* { w, h, wallpaper: 'sonoma' | 'imac-blue' | css-color, menubar: true, notch: false, app, dock: false } */
  M.desktop = (parent, o = {}) => {
    const w = o.w ?? 1920, h = o.h ?? 1080;
    const el = E.h("div", "desk", parent);
    E.css(el, { width: w + "px", height: h + "px", left: (o.x ?? 0) + "px", top: (o.y ?? 0) + "px", borderRadius: (o.radius ?? 0) + "px" });
    const wp = o.wallpaper ?? "sonoma";
    if (wp.startsWith("#") || wp.startsWith("linear") || wp.startsWith("radial")) el.style.background = wp;
    else el.style.backgroundImage = `url(assets/wp/${wp}.jpg)`;
    const s = o.scale ?? 1;
    let menubar = null, notch = null, dock = null;
    if (o.menubar !== false) {
      menubar = M.menubar(el, { app: o.app || "Finder", h: o.notch ? 37 : 24, light: o.lightBar, clock: o.clock });
      menubar.el.style.zoom = s;
    }
    if (o.notch) {
      notch = E.h("div", "notch", el);
      E.css(notch, { width: 200 * s + "px", height: 32 * s + "px", borderRadius: `0 0 ${11 * s}px ${11 * s}px` });
    }
    if (o.dock) { dock = M.dock(el, o.dock === true ? {} : o.dock); dock.style.zoom = s; }
    return { el, menubar, notch, dock };
  };
})();
