/* Module manifest: kit modules (shared building blocks) and shot files, loaded in order.
   Missing files are skipped with a console warning so work-in-progress never blocks a render. */
window.MANIFEST = {
  core: ["engine.js", "components.js", "kit.js", "timeline.js", "kit/mac-core.js"],
  kit: ["kit/fx-type.js", "kit/fx-surface.js", "kit/mac-web.js", "kit/mac-comms.js", "kit/mac-plan.js", "kit/mac-dev.js"],
  shots: ["shots/a-hook.js", "shots/b-lofi.js", "shots/b-tree.js", "shots/c-plan.js", "shots/c-pills.js", "shots/d-dev.js", "shots/d-type.js", "shots/e-trust.js", "shots/f-close.js"],
};
