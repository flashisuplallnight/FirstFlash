/* lab: macOS foundation check */
(function () {
  const E = window.E, M = E.Mac;
  E.K.LAB_DURATION = 2;
  E.scene("lab-core", 0, 2, (root) => {
    const d = M.desktop(root, { w: 1920, h: 1080, wallpaper: "sonoma", app: "Mail", dock: true, scale: 1.25 });
    const w = M.window(d.el, { x: 160, y: 120, w: 980, h: 600, sidebar: 220, title: "Inbox", sub: "1,204 messages", zoom: 1.2 });
    M.tbBtn(w.bar, "tray"); M.tbBtn(w.bar, "compose"); M.tbSpacer(w.bar); M.tbBtn(w.bar, "archive"); M.tbBtn(w.bar, "trash"); M.tbBtn(w.bar, "reply"); M.tbBtn(w.bar, "reply-all"); M.tbBtn(w.bar, "forward"); M.tbBtn(w.bar, "flag"); M.search(w.bar, { w: 160 });
    M.sideHead(w.side, "Favourites");
    M.sideItem(w.side, { icon: "tray", label: "Inbox", badge: 3, sel: true });
    M.sideItem(w.side, { icon: "send", label: "Sent" });
    M.sideItem(w.side, { icon: "doc", label: "Drafts", badge: 1 });
    M.sideItem(w.side, { icon: "flag", label: "Flagged", color: "#ff9500" });
    M.sideHead(w.side, "iCloud");
    M.sideItem(w.side, { icon: "archive", label: "Archive" });
    M.sideItem(w.side, { icon: "trash", label: "Trash" });
    const list = E.h("div", "", w.content);
    E.css(list, { padding: "6px 14px" });
    [["SC", "Sarah Chen", "Acme invoice — September", "here's the invoice from last week…", 1], ["JM", "Jake Miller", "Shipping the update", "are we still shipping this week?", 2], ["M", "Mom", "Dinner Sunday?", "call me when you're free ❤️", 0]].forEach(([i, n, s, p, tone], k) => {
      const r = E.h("div", "", list);
      E.css(r, { display: "flex", gap: "10px", padding: "10px 8px", borderRadius: "8px", background: k === 0 ? "var(--mac-accent)" : "", color: k === 0 ? "#fff" : "" });
      M.avatar(r, i, 34, tone);
      E.h("div", "", r, `<div style="display:flex;justify-content:space-between;font-weight:600"><span>${n}</span><span style="font-weight:400;opacity:.6;font-size:12px">9:4${k} AM</span></div><div style="font-size:12.5px">${s}</div><div style="font-size:12.5px;opacity:.6">${p}</div>`).style.flex = "1";
    });
    const icons = E.h("div", "", d.el);
    E.css(icons, { position: "absolute", right: "60px", top: "120px", width: "520px", display: "flex", flexWrap: "wrap", gap: "14px", color: "#fff" });
    M.ICONS.forEach((n) => E.h("span", "", icons, M.icon(n, 30)));
    const dw = M.window(d.el, { x: 1180, y: 560, w: 520, h: 300, dark: true, title: "zsh — heyswaey", bar: "title", center: true, zoom: 1.2 });
    E.h("div", "", dw.content, '<pre style="margin:12px;font:13px/1.6 var(--sf-mono);color:#ddd">swaey › asking claude code…\n✓ 1 test fixed</pre>');
    return () => {};
  });
})();
