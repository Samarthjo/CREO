// Renders the scene in headless Chromium (software WebGL) and prints anchors and frame times.
// node scripts/layer-lab/shoot.mjs [--out=<dir>] [--only=wide-t3] [--q="sweep=0.58&progress=0.2"] [--bench=<frames>]
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (name, d) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? d;
const out = arg("out", "/tmp/claude-0/-home-user/0814ecf9-8d03-5305-aebf-5baf5702bb6a/scratchpad/scene-core");
const only = arg("only", "");
const extra = arg("q", "sweep=0.58");
const bench = parseInt(arg("bench", "0"), 10);
await mkdir(out, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const data = await readFile(join(root, path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/scripts/layer-lab/lab.html`;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const results = {};
for (const variant of ["wide", "tall"]) {
  for (const tier of ["t3", "t2"]) {
    const name = `${variant}-${tier}`;
    if (only && only !== name) continue;
    const page = await browser.newPage({ viewport: variant === "wide" ? { width: 1600, height: 1000 } : { width: 900, height: 1200 } });
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.log(`[${name}] ${m.text().slice(0, 400)}`));
    page.on("pageerror", (e) => console.log(`[${name}] pageerror ${e.message}`));
    const t = Date.now();
    await page.goto(`${base}?variant=${variant}&tier=${tier}&${extra}`);
    await page.waitForFunction("window.__ready === true", null, { timeout: 240000 });
    const meta = await page.evaluate(() => ({ anchors: window.__anchors, firstFrameMs: Math.round(window.__firstFrameMs) }));
    await page.locator("#c").screenshot({ path: join(out, `${name}.png`) });
    results[name] = { anchors: roundAnchors(meta.anchors), firstFrameMs: meta.firstFrameMs, totalMs: Date.now() - t };
    if (bench) {
      // frame times need the live loop (a still draws once): reload without the still options
      await page.goto(`${base}?variant=${variant}&tier=${tier}&live=1`);
      await page.waitForFunction("window.__ready === true", null, { timeout: 240000 });
      results[name].msPerFrame = await page.evaluate(async (n) => {
        const bus = window.__lab.layerBus;
        const s = window.__scene;
        const gl = document.getElementById("c").getContext("webgl2");
        const px = new Uint8Array(4);
        const t0 = performance.now();
        for (let i = 0; i < n; i++) {
          bus.progress = i / n;
          s.frame(1000 + i * 16);
        }
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // forces the queued frames to finish
        return Math.round((performance.now() - t0) / n);
      }, bench);
    }
    await page.close();
    console.log(`${name} done in ${Date.now() - t} ms`);
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(results, null, 1));

function roundAnchors(a) {
  if (!a) return a;
  return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, `${v.x.toFixed(1)}, ${v.y.toFixed(1)}`]));
}
