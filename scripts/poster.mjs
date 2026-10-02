// Renders the committed poster stills of the Layer scene: npm run poster
// Writes public/layer/poster-{wide,tall}.webp and src/components/layer/anchors.generated.ts, and prints a luminance
// and contrast report for the quiet text regions. Needs the Playwright install and Chromium of this dev machine.
// node scripts/poster.mjs [--png=<dir>] to also keep the PNG stills for review.
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pngDir = process.argv.find((a) => a.startsWith("--png="))?.slice(6);

// The five signals lit, the light bar part-way across the glass, scroll at the top.
const STILL = "sweep=0.58&progress=0&t=0";
const TARGETS = {
  wide: { w: 1600, h: 1000, maxKB: 70 },
  tall: { w: 900, h: 1200, maxKB: 45 },
};
const TEXT = [0xf3, 0xf0, 0xe8];
const IDS = ["content", "audience", "trends", "deals", "perf", "mark"];

execFileSync(process.execPath, [join(root, "scripts/layer-lab/build.mjs")], { stdio: "inherit" });

// The quiet rectangles live in the scene layout; bundle it so the report measures the same regions the scene protects.
const layoutJs = (
  await build({ entryPoints: [join(root, "src/components/layer/scene/layout.ts")], bundle: true, format: "esm", write: false, logLevel: "warning" })
).outputFiles[0].text;
const { LAYOUTS } = await import(`data:text/javascript;base64,${Buffer.from(layoutJs).toString("base64")}`);

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

const anchors = {};
const report = [];
await mkdir(join(root, "public/layer"), { recursive: true });
if (pngDir) await mkdir(pngDir, { recursive: true });

for (const [variant, { w, h, maxKB }] of Object.entries(TARGETS)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => console.log(`[${variant}] pageerror ${e.message}`));
  await page.goto(`${base}?variant=${variant}&tier=t3&${STILL}`);
  await page.waitForFunction("window.__ready === true", null, { timeout: 240000 });

  anchors[variant] = await page.evaluate(() => window.__anchors);
  if (pngDir) await page.locator("#c").screenshot({ path: join(pngDir, `poster-${variant}.png`) });

  // Largest quality whose WebP fits the budget, found by bisection on the page's own encoder.
  const best = await page.evaluate(
    async ({ budget }) => {
      const canvas = document.getElementById("c");
      const encode = (q) => new Promise((res) => canvas.toBlob(res, "image/webp", q));
      let lo = 0.3;
      let hi = 0.95;
      let pick = null;
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2;
        const blob = await encode(q);
        if (blob.size <= budget) {
          pick = { q, blob };
          lo = q;
        } else hi = q;
      }
      pick ??= { q: 0.3, blob: await encode(0.3) };
      const buf = new Uint8Array(await pick.blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return { q: pick.q, b64: btoa(bin) };
    },
    { budget: maxKB * 1024 },
  );
  const bytes = Buffer.from(best.b64, "base64");
  await writeFile(join(root, `public/layer/poster-${variant}.webp`), bytes);

  // Measure the file that ships: decode it and take the luminance of the quiet rectangle.
  const [x0, y0, x1, y1] = LAYOUTS[variant].quiet;
  const stats = await page.evaluate(
    async ({ b64, rect, w, h }) => {
      const img = new Image();
      img.src = `data:image/webp;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, w, h);
      const [a, b, d, e] = [rect[0] * w, rect[1] * h, rect[2] * w, rect[3] * h].map(Math.round);
      const px = g.getImageData(a, b, d - a, e - b).data;
      const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const ys = new Float32Array(px.length / 4);
      for (let i = 0; i < ys.length; i++) ys[i] = 0.2126 * lin(px[i * 4]) + 0.7152 * lin(px[i * 4 + 1]) + 0.0722 * lin(px[i * 4 + 2]);
      ys.sort();
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
      return { mean, p95: ys[Math.floor(ys.length * 0.95)], max: ys[ys.length - 1] };
    },
    { b64: best.b64, rect: [x0, y0, x1, y1], w, h },
  );
  const lum = (rgb) => rgb.map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (lum(TEXT) + 0.05) / (stats.p95 + 0.05);
  report.push({ variant, kb: +(bytes.length / 1024).toFixed(1), quality: +best.q.toFixed(3), region: [x0, y0, x1, y1], ...stats, contrastP95: +contrast.toFixed(2) });
  await page.close();
}
await browser.close();
server.close();

const fmt = (n) => +n.toFixed(1);
const entry = (a) => `    ${IDS.map((id) => `${id}: { x: ${fmt(a[id].x)}, y: ${fmt(a[id].y)} }`).join(",\n    ")},`;
await writeFile(
  join(root, "src/components/layer/anchors.generated.ts"),
  `// Generated by \`npm run poster\` from the real camera and scene. Do not edit.
import type { AnchorId, Variant } from "./bus";

export const ANCHORS: Record<Variant, Record<AnchorId, { x: number; y: number }>> = {
  wide: {
${entry(anchors.wide)}
  },
  tall: {
${entry(anchors.tall)}
  },
};
`,
);

for (const r of report) {
  console.log(
    `${r.variant}: ${r.kb} KB (q ${r.quality}); quiet region ${r.region.join(",")} luminance mean ${r.mean.toFixed(4)} p95 ${r.p95.toFixed(4)} max ${r.max.toFixed(4)}; #F3F0E8 contrast at p95 ${r.contrastP95}:1`,
  );
}
