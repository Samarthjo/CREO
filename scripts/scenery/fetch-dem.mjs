// node scripts/scenery/fetch-dem.mjs <name> <lat0> <lon0> <lat1> <lon1> <zoom>
// Downloads Terrarium elevation tiles (open data on AWS, built from USGS 3DEP and SRTM) covering the box
// and writes .cache/dem/<name>.f32 (+ .json) in metres. The scene uses: tetons 43.55 -110.95 44.15 -110.35 13
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { CACHE, sharp } from './lib.mjs';
const [name, la0, lo0, la1, lo1, zoom] = process.argv.slice(2); const z = +zoom;
const n = 2 ** z;
const tx = (lon) => ((lon + 180) / 360) * n;
const ty = (lat) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n; };
const x0 = Math.floor(tx(+lo0)), x1 = Math.floor(tx(+lo1)), y0 = Math.floor(ty(+la1)), y1 = Math.floor(ty(+la0));
const W = (x1 - x0 + 1) * 256, H = (y1 - y0 + 1) * 256;
console.log(`tiles x ${x0}..${x1} y ${y0}..${y1} -> ${W}x${H}`);
mkdirSync(`${CACHE}dem/tiles`, { recursive: true });
const out = new Float32Array(W * H);
const jobs = [];
for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) jobs.push([x, y]);
async function get(x, y) {
  const f = `${CACHE}dem/tiles/${z}-${x}-${y}.png`;
  if (!existsSync(f)) {
    const url = `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`;
    for (let k = 0; k < 4; k++) {
      try { const r = await fetch(url); if (!r.ok) throw new Error(r.status); writeFileSync(f, Buffer.from(await r.arrayBuffer())); break; } catch (e) { if (k === 3) throw e; await new Promise((r) => setTimeout(r, 500 * (k + 1))); }
    }
  }
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
    const o = (j * 256 + i) * ch;
    out[((y - y0) * 256 + j) * W + (x - x0) * 256 + i] = data[o] * 256 + data[o + 1] + data[o + 2] / 256 - 32768;
  }
}
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (next < jobs.length) { const [x, y] = jobs[next++]; await get(x, y); } }));
writeFileSync(`${CACHE}dem/${name}.f32`, Buffer.from(out.buffer));
// metres per pixel at the centre latitude
const latC = (+la0 + +la1) / 2;
const mpp = (156543.03392 * Math.cos((latC * Math.PI) / 180)) / n;
const meta = { name, W, H, z, x0, y0, mpp, tileLon0: (x0 / n) * 360 - 180, latC };
writeFileSync(`${CACHE}dem/${name}.json`, JSON.stringify(meta));
let mn = 1e9, mx = -1e9; for (const v of out) { if (v < mn) mn = v; if (v > mx) mx = v; }
console.log(`done ${W}x${H} mpp=${mpp.toFixed(2)} min=${mn.toFixed(0)} max=${mx.toFixed(0)}`);
