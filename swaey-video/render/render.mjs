// Render the film: parallel frame capture → sub-frame motion blur → H.264 + soundtrack.
//   node render/render.mjs                 full quality: 1080p60, 3 sub-frames, 4 workers
//   node render/render.mjs --draft         quick check: 30 fps, no motion blur
//   node render/render.mjs --from 10 --to 14 --out out/clip.mp4
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { serve } from "./serve.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const draft = args.includes("--draft");
const FPS = +opt("fps", draft ? 30 : 60);
const SUB = +opt("sub", draft ? 1 : 3);
const SHUTTER = 0.5; // 180° shutter
const WORKERS = +opt("workers", Math.max(1, Math.min(4, os.cpus().length)));
const outFile = path.resolve(root, opt("out", draft ? "out/heyswaey-draft.mp4" : "out/heyswaey-film.mp4"));
const tmp = path.join(root, "out", "segments");
fs.mkdirSync(tmp, { recursive: true });

const { srv, port } = await serve(root);
const url = `http://127.0.0.1:${port}/src/index.html?render`;
const launch = () => chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });

// 1) timeline metadata + soundtrack
const b0 = await launch();
const p0 = await b0.newPage({ viewport: { width: 1920, height: 1080 } });
await p0.goto(url);
await p0.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const meta = await p0.evaluate(() => window.__meta);
await b0.close();
fs.writeFileSync(path.join(root, "out/cues.json"), JSON.stringify(meta));
const from = +opt("from", 0), to = Math.min(+opt("to", meta.duration), meta.duration);
const wav = path.join(root, "out/soundtrack.wav");
if (!args.includes("--no-audio")) {
  console.log("synthesising soundtrack…");
  execFileSync("python3", [path.join(root, "render/audio.py"), path.join(root, "out/cues.json"), wav], { stdio: "inherit" });
}

// 2) frames
const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
const total = f1 - f0;
const per = Math.ceil(total / WORKERS);
const started = Date.now();
let done = 0;
const progress = () => { const el = (Date.now() - started) / 1000; process.stdout.write(`\rframes ${done}/${total}  ${(done / el).toFixed(1)} fps  eta ${((total - done) / Math.max(0.01, done / el)).toFixed(0)}s   `); };

async function worker(w) {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) return null;
  const seg = path.join(tmp, `seg_${String(w).padStart(2, "0")}.mp4`);
  const grain = "noise=c0s=7:c0f=t+u:c1s=2:c2s=2";
  const vf = (SUB > 1 ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)` : "setpts=N/(" + FPS + "*TB)") + "," + grain;
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-c:v", "mjpeg", "-i", "-", "-vf", vf, "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv444p", seg], { stdio: ["pipe", "inherit", "inherit"] });
  const br = await launch();
  const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on("pageerror", (e) => console.log(`\n[w${w}] pageerror: ${e.message}`));
  await pg.goto(url);
  await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await pg.context().newCDPSession(pg);
  for (let f = a; f < b; f++) {
    for (let j = 0; j < SUB; j++) {
      const off = SUB > 1 ? ((j + 0.5) / SUB - 0.5) * (SHUTTER / FPS) : 0;
      const t = Math.max(0, f / FPS + off);
      await pg.evaluate((t) => window.__seek(t), t);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 95, optimizeForSpeed: true });
      const buf = Buffer.from(data, "base64");
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    done++;
    if (done % 20 === 0) progress();
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await br.close();
  return seg;
}
const segs = (await Promise.all([...Array(WORKERS).keys()].map(worker))).filter(Boolean);
progress();
console.log(`\ncaptured in ${((Date.now() - started) / 1000).toFixed(0)}s`);
srv.close();

// 3) join + soundtrack
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
const hasWav = fs.existsSync(wav) && !args.includes("--no-audio");
const ffArgs = ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list];
if (hasWav) ffArgs.push("-ss", String(from), "-t", String(to - from), "-i", wav);
ffArgs.push("-map", "0:v");
if (hasWav) ffArgs.push("-map", "1:a", "-c:a", "aac", "-b:a", "320k");
ffArgs.push("-c:v", "libx264", "-preset", "slow", "-crf", draft ? "23" : "16", "-profile:v", "high", "-pix_fmt", "yuv420p", "-x264-params", "aq-mode=3", "-movflags", "+faststart", "-r", String(FPS), "-shortest", outFile);
execFileSync("ffmpeg", ffArgs, { stdio: "inherit" });
console.log("wrote", outFile);
