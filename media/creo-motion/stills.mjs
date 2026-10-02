import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const times = (process.argv[2] || '0.5,1.1,1.6,2.2,2.6,3.0,3.5,3.9,4.4,4.9,5.3,5.8,6.6,7.2,7.8,8.3,9.0,9.7,10.4,11.0,11.4,12.4,12.85,13.1,13.6,14.9').split(',').map(Number);
const tag = process.argv[3] || 'sheet';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:3800/index.html');
await p.evaluate(() => window.CREO.ready);
const imgs = [];
for (const t of times) {
  const data = await p.evaluate((t) => { window.CREO.renderStill(t); return window.CREO.jpeg(0.85); }, t);
  imgs.push(data);
  if (process.argv[4] === 'full') fs.writeFileSync(`still-${t.toFixed(2)}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
}
// contact sheet
const cols = 5, cw = 384, ch = 216, rows = Math.ceil(imgs.length / cols);
const s = await b.newPage({ viewport: { width: cols * cw, height: rows * (ch + 22) } });
await s.setContent('<body style="margin:0;background:#222"><canvas id=c></canvas></body>');
await s.evaluate(async ({ imgs, times, cols, cw, ch }) => {
  const c = document.getElementById('c'); c.width = cols * cw; c.height = Math.ceil(imgs.length / cols) * (ch + 22);
  const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < imgs.length; i++) { const im = new Image(); im.src = imgs[i]; await im.decode(); const x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 22); g.drawImage(im, x + 2, y + 2, cw - 4, ch - 4); g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(`t=${times[i]}`, x + 6, y + ch + 15); }
}, { imgs, times, cols, cw, ch });
await s.screenshot({ path: `${tag}.png` });
await b.close();
console.log('errors', errs.length, errs.slice(0, 5));
