// Renders frames [from, to) with motion blur to frames/fNNNN.png using N parallel pages.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [from = 0, to = 450, workers = 4, S = 0] = process.argv.slice(2).map(Number);
fs.mkdirSync('frames', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const queue = []; for (let i = from; i < to; i++) queue.push(i);
const t0 = Date.now(); let done = 0;
async function worker(w) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('http://localhost:3800/index.html');
  await p.evaluate(() => window.CREO.ready);
  if (w === 0) fs.writeFileSync('events.json', JSON.stringify(await p.evaluate(() => window.CREO.events()), null, 1));
  while (queue.length) {
    const i = queue.shift();
    const data = await p.evaluate(({ i, S }) => { window.CREO.renderFrame(i, S || undefined); return window.CREO.png(); }, { i, S });
    fs.writeFileSync(`frames/f${String(i).padStart(4, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
    done++;
    if (done % 25 === 0) console.log(`${done}/${to - from} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
await Promise.all(Array.from({ length: workers }, (_, w) => worker(w)));
await b.close();
console.log(`done ${done} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
