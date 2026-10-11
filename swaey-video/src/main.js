/* Boot: wait for fonts and images, expose the seek API for the renderer,
   and, when opened directly in a browser, play the film with a scrubber. */
(async function () {
  const E = window.E, K = E.K;
  const grain = document.getElementById("grain");
  const flash = document.getElementById("flash");
  E.post.push((t) => {
    const f = Math.floor(t * 60);
    grain.style.backgroundPosition = `${(E.hash(f) * 200).toFixed(0)}px ${(E.hash(f + 0.5) * 200).toFixed(0)}px`;
    let fl = 0;
    for (const c of E.flashes || []) { const u = (t - c.t) / c.d; if (u >= 0 && u < 1) fl = Math.max(fl, c.a * (1 - u) * (1 - u)); }
    flash.style.opacity = fl.toFixed(3);
  });

  // In render mode the film grain is added by ffmpeg (cheaper than a blend layer).
  if (/render/.test(location.search)) grain.style.display = "none";
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
  for (const f of E.ready || []) await f();
  E.cues.sort((a, b) => a.t - b.t);
  window.__meta = { duration: K.DURATION, bpm: E.BPM, cues: E.cues };
  window.__seek = (t) => E.seek(t);
  E.seek(0);
  window.__ready = true;

  if (/render/.test(location.search)) return;
  // ---------- browser preview ----------
  const stage = document.getElementById("stage");
  const fit = () => { const s = Math.min(innerWidth / 1920, (innerHeight - 48) / 1080); stage.style.transform = `scale(${s})`; E.scale = s; };
  addEventListener("resize", fit); fit();
  const bar = E.h("input", "", document.body);
  Object.assign(bar, { type: "range", min: 0, max: K.DURATION, step: 0.001, value: 0 });
  E.css(bar, { position: "fixed", left: "12px", right: "12px", bottom: "12px", width: "calc(100% - 24px)" });
  const audio = new Audio("../out/soundtrack.wav");
  let playing = true, t0 = performance.now(), base = 0;
  const now = () => (playing ? base + (performance.now() - t0) / 1000 : base);
  const play = () => { playing = true; t0 = performance.now(); audio.currentTime = base; audio.play().catch(() => {}); };
  const pause = () => { base = now(); playing = false; audio.pause(); };
  bar.oninput = () => { base = +bar.value; t0 = performance.now(); audio.currentTime = base; };
  addEventListener("keydown", (e) => { if (e.code === "Space") { playing ? pause() : play(); e.preventDefault(); } });
  play();
  const loop = () => { let t = now(); if (t >= K.DURATION) { base = 0; t0 = performance.now(); t = 0; audio.currentTime = 0; } E.seek(t); bar.value = t; requestAnimationFrame(loop); };
  loop();
})();
