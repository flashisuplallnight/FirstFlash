// Grab stills at given times: node render/frames.mjs out/stills 0.5 1.2 3.9 ...
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { serve } from "./serve.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const argv = process.argv.slice(2);
const pi = argv.indexOf("--page");
const pagePath = pi >= 0 ? argv.splice(pi, 2)[1] : "src/index.html";
const [outDir, ...times] = argv;
fs.mkdirSync(outDir, { recursive: true });
const { srv, port } = await serve(root);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text()); });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(`http://127.0.0.1:${port}/${pagePath}${pagePath.includes("?") ? "&" : "?"}render`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
for (const t of times) {
  await page.evaluate((t) => window.__seek(t), +t);
  await page.screenshot({ path: path.join(outDir, `t_${(+t).toFixed(2).padStart(6, "0")}.jpg`), type: "jpeg", quality: 85 });
}
console.log(JSON.stringify(await page.evaluate(() => ({ dur: window.__meta.duration, cues: window.__meta.cues.length }))));
await browser.close();
srv.close();
