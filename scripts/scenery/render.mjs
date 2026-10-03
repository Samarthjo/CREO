// Renders a fragment shader to a PNG in headless Chromium (software WebGL2, so no GPU is needed), tile by tile,
// with an optional elevation texture.
// node scripts/scenery/render.mjs <shader.frag> <out.png> <width> <height> <mode: 0 dawn | 1 night> [dem=<name>] [crop=c0,r0,cw,ch] [k=v uniforms ...]
// uFullX/uFullY (whole picture) and uOx/uOy (origin of this render inside it) render a 1:1 crop. uCamX/uCamY are in DEM pixels of the full DEM.
import { readFileSync, writeFileSync } from 'node:fs';
import { CACHE, CHROMIUM_PATH, chromium as getChromium } from './lib.mjs';
const chromium = getChromium();
const [shaderPath, out, W, H, mode, ...extra] = process.argv.slice(2);
const w = +W, h = +H;
const src = readFileSync(shaderPath, 'utf8');
const opts = {}; const uniforms = {};
for (const e of extra) { const [k, v] = e.split('='); if (k === 'dem' || k === 'crop') opts[k] = v; else uniforms[k] = +v; }
let dem = null, demSize = [1, 1];
if (opts.dem) {
  const meta = JSON.parse(readFileSync(`${CACHE}dem/${opts.dem}.json`)); const buf = readFileSync(`${CACHE}dem/${opts.dem}.f32`);
  const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  let [c0, r0, cw, ch] = opts.crop ? opts.crop.split(',').map(Number) : [0, 0, meta.W, meta.H];
  const crop = new Float32Array(cw * ch);
  for (let j = 0; j < ch; j++) crop.set(all.subarray((r0 + j) * meta.W + c0, (r0 + j) * meta.W + c0 + cw), j * cw);
  dem = Buffer.from(crop.buffer); demSize = [cw, ch];
  uniforms.uMpp = meta.mpp; uniforms.uCropC = c0; uniforms.uCropR = r0;
}
const b = await chromium.launch({ executablePath: CHROMIUM_PATH, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] });
const p = await b.newPage();
p.on('console', (m) => console.log('[page]', m.text()));
await p.route('http://x.local/**', (route) => {
  if (route.request().url().endsWith('/dem.bin')) route.fulfill({ body: dem ?? Buffer.alloc(4), contentType: 'application/octet-stream' });
  else route.fulfill({ body: `<canvas id=c width=${w} height=${h}></canvas>`, contentType: 'text/html' });
});
await p.goto('http://x.local/');
const t0 = Date.now();
const png = await p.evaluate(async ({ src, w, h, mode, uniforms, demSize, hasDem }) => {
  const c = document.getElementById('c'); const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const vs = `#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, src)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const set1 = (k, v) => { const l = gl.getUniformLocation(pr, k); if (l) gl.uniform1f(l, v); };
  const set2 = (k, x, y) => { const l = gl.getUniformLocation(pr, k); if (l) gl.uniform2f(l, x, y); };
  if (hasDem) {
    const ab = await (await fetch('/dem.bin')).arrayBuffer();
    const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, demSize[0], demSize[1], 0, gl.RED, gl.FLOAT, new Float32Array(ab));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const l = gl.getUniformLocation(pr, 'uDem'); if (l) gl.uniform1i(l, 0);
    set2('uDemSize', demSize[0], demSize[1]);
  }
  set2('uRes', w, h);
  set2('uFull', uniforms.uFullX ?? w, uniforms.uFullY ?? h);
  set2('uOrigin', uniforms.uOx ?? 0, uniforms.uOy ?? 0);
  set1('uNight', +mode);
  const cropC = uniforms.uCropC ?? 0, cropR = uniforms.uCropR ?? 0;
  set2('uCamPix', (uniforms.uCamX ?? 0) - cropC, (uniforms.uCamY ?? 0) - cropR);
  for (const [k, v] of Object.entries(uniforms)) { if (!/^uFull[XY]$|^uO[xy]$|^uCam[XY]$|^uCrop[CR]$/.test(k)) set1(k, v); }
  gl.enable(gl.SCISSOR_TEST);
  const TW = 400, TH = 225;
  for (let y = 0; y < h; y += TH) for (let x = 0; x < w; x += TW) {
    gl.scissor(x, y, Math.min(TW, w - x), Math.min(TH, h - y)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
    await new Promise((r) => setTimeout(r, 0));
  }
  return c.toDataURL('image/png');
}, { src, w, h, mode, uniforms, demSize, hasDem: !!dem });
writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
console.log(`rendered ${w}x${h} in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);
await b.close();
