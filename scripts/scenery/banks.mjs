// node scripts/scenery/banks.mjs <dawn|night|both> [S=2]
// Paints the two grassy banks with their stones into .cache/out/banks/bank-<time>-<l|r>.png
import { writeFileSync } from 'node:fs';
import { CACHE, CHROMIUM_PATH, HERE, chromium as getChromium, loadGeometry } from './lib.mjs';
const chromium = getChromium();
const [which = 'both', ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.split('=')));
const S = +(opt.S ?? 2);
const geo = await loadGeometry();
const b = await chromium.launch({ executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });
const page = await b.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ path: `${HERE}banks-lib.js` });
// `sun` is how much direct light the visible slope gets: at dawn the sun is on the left, so the left bank is in shade and the right one glows.
const SIDES = {
  l: { box: geo.BANKS.l.box, top: geo.BANKS.l.top, sun: { dawn: 0.12, night: 0.8 } },
  r: { box: geo.BANKS.r.box, top: geo.BANKS.r.top, sun: { dawn: 0.85, night: 0.15 } },
};
for (const time of which === 'both' ? ['dawn', 'night'] : [which]) {
  for (const [side, d] of Object.entries(SIDES)) {
    const [bx0, , bw] = d.box; const { x0: c0, x1: c1 } = geo.BANKS[side];
    // Past the bank's old end the crest keeps falling, so the bank runs out of the picture instead of ending in a cut.
    const crest = []; for (let x = bx0; x <= bx0 + bw; x++) { const y0 = d.top(Math.min(Math.max(x, c0), c1)); const extra = side === 'l' ? 0.02 * Math.max(0, x - (c1 - 90)) ** 2 : 0.02 * Math.max(0, c0 + 50 - x) ** 2; crest.push([x, y0 + extra]); }
    const rocks = geo.ROCKS.filter((r) => (side === 'l') === (r.cx < 800));
    const trees = geo.NEAR_TREES.filter((t) => t.side === side).map((t) => ({ x: t.x, base: t.base, h: t.h }));
    const spec = { time, side, box: d.box, S, seed: side === 'l' ? 11 : 23, crest, rocks, trees, sunOnBank: d.sun[time], shadowDir: time === 'dawn' ? 1 : -1 };
    const t0 = Date.now();
    const url = await page.evaluate((s) => window.drawBank(s), spec);
    const name = `${CACHE}out/banks/bank-${time}-${side}.png`;
    writeFileSync(name, Buffer.from(url.split(',')[1], 'base64'));
    console.log(name, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}
await b.close();
