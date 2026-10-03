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
for (const time of ["dawn", "night"]) {
  // the back picture comes in three sizes; the page picks one with srcset
  const back = `${out}back-${time}.png`;
  if (existsSync(back)) for (const [w, quality] of [[3200, 78], [1600, 80], [800, 82]]) await save(sharp(back).resize({ width: w, kernel: "lanczos3" }), `back-${time}-${w}.webp`, { quality, effort: 6, smartSubsample: true });
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
