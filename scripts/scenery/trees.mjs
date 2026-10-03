// node scripts/scenery/trees.mjs <dawn|night|both> [S=2.4] [only=0,2,5]
// Paints the near trees (placed by geometry.ts) into .cache/out/trees/tree-<time>-<i>.png; broadleaf trees come as -crown and -trunk.
import { writeFileSync } from 'node:fs';
import { CACHE, CHROMIUM_PATH, HERE, chromium as getChromium, loadGeometry } from './lib.mjs';
const chromium = getChromium();
const [which = 'both', ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.split('=')));
const S = +(opt.S ?? 2.4);
const only = opt.only ? opt.only.split(',').map(Number) : null;
const geo = await loadGeometry();
const b = await chromium.launch({ executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });
const page = await b.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ path: `${HERE}trees-lib.js` });
const times = which === 'both' ? ['dawn', 'night'] : [which];
for (const time of times) {
  for (let i = 0; i < geo.NEAR_TREES.length; i++) {
    if (only && !only.includes(i)) continue;
    const t = geo.NEAR_TREES[i];
    const parts = t.kind === 'c' ? ['tree'] : ['crown', 'trunk'];
    for (const part of parts) {
      const spec = { time, kind: t.kind, part, h: t.h, slim: t.slim, lean: t.lean, seed: i + 1, box: t.box, root: t.root, S };
      const t0 = Date.now();
      const url = await page.evaluate((s) => window.drawTree(s), spec);
      const name = `${CACHE}out/trees/tree-${time}-${i}${part === 'trunk' ? '-trunk' : part === 'crown' ? '-crown' : ''}.png`;
      writeFileSync(name, Buffer.from(url.split(',')[1], 'base64'));
      console.log(name, `${Date.now() - t0}ms`, t.box.join(','));
    }
  }
}
await b.close();
