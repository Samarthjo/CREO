// Builds the web-sized brand files from the originals in docs/brand.
//   node scripts/brand-assets.mjs             site colours: the orange glow is turned to the site's lime, shadows to forest black
//   node scripts/brand-assets.mjs --original  the artwork exactly as supplied (orange)
// Needs Playwright with a Chromium (the canvas does the resizing, so no image library is added to the app).
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = (await readFile(path.join(root, "docs/brand/logo-source.webp"))).toString("base64");
const banner = (await readFile(path.join(root, "docs/brand/banner-source.png"))).toString("base64");

const original = process.argv.includes("--original");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setContent("<canvas></canvas>");

const out = await page.evaluate(async ({ logo, banner, original }) => {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const canvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
  const blob = (c, type, q) => new Promise((res) => c.toBlob(res, type, q));
  const b64 = async (b) => { const buf = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
  const result = {};

  // Colour grade: rotate the warm glow (orange, hue ~28) to the site's lime (hue ~72), keep the cream highlights,
  // and pull the black toward the site's forest black. Weighted by saturation, so neutrals are not tinted.
  const SHIFT = 50, SAT = 0.78, FOREST = [10, 14, 10];
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const grade = (cv) => {
    if (original) return cv;
    const g = cv.getContext("2d"); const im = g.getImageData(0, 0, cv.width, cv.height); const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, gr = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), l = (mx + mn) / 2, dl = mx - mn;
      let h = 0, s = 0;
      if (dl > 1e-6) {
        s = l > 0.5 ? dl / (2 - mx - mn) : dl / (mx + mn);
        h = mx === r ? ((gr - b) / dl) % 6 : mx === gr ? (b - r) / dl + 2 : (r - gr) / dl + 4; h *= 60; if (h < 0) h += 360;
      }
      const warm = h <= 75 || h >= 345 ? 1 : 0;
      const w = warm * smooth(0.04, 0.3, s);
      const h2 = (h + SHIFT * w) % 360, s2 = Math.min(1, s * (1 - (1 - SAT) * w));
      // hsl -> rgb
      const c = (1 - Math.abs(2 * l - 1)) * s2, x = c * (1 - Math.abs(((h2 / 60) % 2) - 1)), m = l - c / 2;
      const [rr, gg, bb] = h2 < 60 ? [c, x, 0] : h2 < 120 ? [x, c, 0] : h2 < 180 ? [0, c, x] : h2 < 240 ? [0, x, c] : h2 < 300 ? [x, 0, c] : [c, 0, x];
      let R = (rr + m) * 255, G = (gg + m) * 255, B = (bb + m) * 255;
      const dark = 1 - smooth(0.02, 0.2, l);
      R += (FOREST[0] - R) * dark * 0.7; G += (FOREST[1] - G) * dark * 0.7; B += (FOREST[2] - B) * dark * 0.7;
      d[i] = R; d[i + 1] = G; d[i + 2] = B;
    }
    g.putImageData(im, 0, 0);
    return cv;
  };

  // ---- logo: find the glowing tile, crop to it, cut the corners so it sits on any background ----
  const li = await load("data:image/webp;base64," + logo);
  const lc = canvas(li.width, li.height); const lg = lc.getContext("2d"); lg.drawImage(li, 0, 0);
  const d = lg.getImageData(0, 0, lc.width, lc.height).data; // measured on the original, before the grade
  const lum = (x, y) => { const k = (y * lc.width + x) * 4; return 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; };
  let x0 = lc.width, y0 = lc.height, x1 = 0, y1 = 0;
  for (let y = 0; y < lc.height; y++) for (let x = 0; x < lc.width; x++) if (lum(x, y) > 70) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const side = Math.max(x1 - x0, y1 - y0) + 1;
  grade(lc);
  const sx = Math.round((x0 + x1) / 2 - side / 2), sy = Math.round((y0 + y1) / 2 - side / 2);
  // corner radius: the first bright pixel along the diagonal sits at 0.2929 r from the bounding corner
  let t = 0; while (t < side / 2 && lum(sx + t, sy + t) <= 70) t++;
  const r = Math.min(side * 0.3, t / 0.2929);
  result.logoInfo = { bbox: [x0, y0, x1, y1], side, radius: Math.round(r) };
  const tile = (size, rounded) => {
    const c = canvas(size, size), g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    if (rounded) { g.beginPath(); g.roundRect(0, 0, size, size, r * (size / side)); g.clip(); }
    g.drawImage(lc, sx, sy, side, side, 0, 0, size, size);
    return c;
  };
  result["creo-mark.webp"] = await b64(await blob(tile(192, true), "image/webp", 0.92));
  result["icon.png"] = await b64(await blob(tile(128, true), "image/png"));
  // iOS rounds its own corners, so the home-screen icon is the full square on the tile's own black
  const ap = canvas(180, 180), ag = ap.getContext("2d"); ag.fillStyle = original ? "#050403" : "#0a0e0a"; ag.fillRect(0, 0, 180, 180); ag.imageSmoothingQuality = "high"; ag.drawImage(lc, sx - side * 0.03, sy - side * 0.03, side * 1.06, side * 1.06, 0, 0, 180, 180);
  result["apple-icon.png"] = await b64(await blob(ap, "image/png"));

  // ---- banner: web size, a phone crop around the wordmark, and the social card ----
  const bi = await load("data:image/png;base64," + banner);
  const full = canvas(bi.width, bi.height); full.getContext("2d").drawImage(bi, 0, 0); grade(full);
  result["creo-banner.webp"] = await b64(await blob(full, "image/webp", 0.86));
  const sm = canvas(640, bi.height); sm.getContext("2d").drawImage(full, 110, 0, 640, bi.height, 0, 0, 640, bi.height);
  result["creo-banner-sm.webp"] = await b64(await blob(sm, "image/webp", 0.88));
  const og = canvas(1200, 630), og2 = og.getContext("2d"); og2.imageSmoothingQuality = "high";
  const scale = 630 / bi.height; const win = 1200 / scale; const left = Math.max(0, Math.min(bi.width - win, 530 - win / 2));
  og2.drawImage(full, left, 0, win, bi.height, 0, 0, 1200, 630);
  result["opengraph-image.jpg"] = await b64(await blob(og, "image/jpeg", 0.88));
  result.bannerInfo = { w: bi.width, h: bi.height, smW: 640, ogLeft: Math.round(left) };
  return result;
}, { logo, banner, original });
await browser.close();

const files = { "creo-mark.webp": "public/brand", "creo-banner.webp": "public/brand", "creo-banner-sm.webp": "public/brand", "icon.png": "src/app", "apple-icon.png": "src/app", "opengraph-image.jpg": "src/app" };
for (const [name, dir] of Object.entries(files)) await writeFile(path.join(root, dir, name), Buffer.from(out[name], "base64"));
await writeFile(path.join(root, "src/app/twitter-image.jpg"), Buffer.from(out["opengraph-image.jpg"], "base64"));
console.log(JSON.stringify({ logo: out.logoInfo, banner: out.bannerInfo }));
