// node scripts/scenery/pack.mjs   Converts everything baked into .cache/out to the WebP files the page loads from public/scene.
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { CACHE, PUBLIC, sharp } from "./lib.mjs";

mkdirSync(PUBLIC, { recursive: true });
let total = 0;
async function save(img, name, opt) {
  const info = await img.webp(opt).toFile(PUBLIC + name);
  total += info.size;
  console.log(name.padEnd(30), `${(info.size / 1024).toFixed(0).padStart(5)} KB`, `${info.width}x${info.height}`);
}
const out = `${CACHE}out/`;

/**
 * The night picture sits right under the dusk strip, which ends in the page's night colour (--night-top in globals.css).
 * Ease the top edge of the picture to that colour so the two meet without a line; the moon's halo, where it reaches the top, is eased less so it stays a glow.
 */
function easeTop(img, width) {
  const rows = 260, a = Buffer.alloc(width * rows * 4);
  const step = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < rows; y++) for (let x = 0; x < width; x++) {
    const o = (y * width + x) * 4;
    a[o] = 12; a[o + 1] = 16; a[o + 2] = 48;
    a[o + 3] = Math.round(255 * 0.88 * (1 - step(0, rows, y)) * (1 - 0.25 * step(1400, 2100, x)));
  }
  return img.composite([{ input: a, raw: { width, height: rows, channels: 4 }, top: 0, left: 0 }]);
}
for (const time of ["dawn", "night"]) {
  // the back picture comes in three sizes; the page picks one with srcset
  const back = `${out}back-${time}.png`;
  if (existsSync(back)) {
    const base = time === "night" ? easeTop(sharp(back), 3200) : sharp(back);
    const full = await base.png().toBuffer();   // apply the edge once, then make the sizes from it
    for (const [w, quality] of [[3200, 78], [1600, 80], [800, 82]]) await save(sharp(full).resize({ width: w, kernel: "lanczos3" }), `back-${time}-${w}.webp`, { quality, effort: 6, smartSubsample: true });
  }
  for (const side of ["l", "r"]) {
    const f = `${out}banks/bank-${time}-${side}.png`;
    if (existsSync(f)) await save(sharp(f), `bank-${time}-${side}.webp`, { quality: 78, alphaQuality: 88, effort: 6, smartSubsample: true });
  }
  // trees are painted at 2.4 pixels per scene unit and shipped at 2
  for (const file of readdirSync(`${out}trees`).filter((n) => n.startsWith(`tree-${time}-`) && n.endsWith(".png"))) {
    const { width } = await sharp(`${out}trees/${file}`).metadata();
    await save(sharp(`${out}trees/${file}`).resize({ width: Math.round((width * 2) / 2.4), kernel: "lanczos3" }), file.replace(".png", ".webp"), { quality: 80, alphaQuality: 88, effort: 6 });
  }
}
for (const file of readdirSync(`${out}clouds`).filter((n) => /^cloud-.*\.png$/.test(n))) await save(sharp(`${out}clouds/${file}`).resize({ width: 800, kernel: "lanczos3" }), file.replace(".png", ".webp"), { quality: 78, alphaQuality: 84, effort: 6 });
console.log(`total ${(total / 1024).toFixed(0)} KB`);
