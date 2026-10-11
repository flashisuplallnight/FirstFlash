/* Loads the manifest in order. index.html → kit + shots; lab.html?mod=x → kit + lab/x.js. */
(function () {
  const q = new URLSearchParams(location.search);
  const M = window.MANIFEST;
  const lab = q.get("mod");
  const list = [...M.core, ...M.kit, ...(lab ? [`lab/${lab}.js`] : M.shots), "main.js"];
  const next = (i) => {
    if (i >= list.length) return;
    const s = document.createElement("script");
    s.src = list[i] + "?v=" + (q.get("v") || "");
    s.onload = () => { if (i === 0) E.world = document.getElementById("world"); next(i + 1); };
    s.onerror = () => { console.warn("boot: missing " + list[i]); next(i + 1); };
    document.body.appendChild(s);
  };
  next(0);
})();
