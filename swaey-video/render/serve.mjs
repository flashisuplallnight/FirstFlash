// Tiny static server for the film source (fonts and WebGL want http, not file://).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".wav": "audio/wav", ".json": "application/json" };
export function serve(root, port = 0) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (!p.startsWith(root)) { res.writeHead(403).end(); return; }
      fs.readFile(p, (err, buf) => {
        if (err) { res.writeHead(404).end(); return; }
        res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
        res.end(buf);
      });
    });
    srv.listen(port, "127.0.0.1", () => resolve({ srv, port: srv.address().port }));
  });
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  serve(root, +process.argv[2] || 8080).then(({ port }) => console.log(`preview: http://localhost:${port}/src/index.html`));
}
