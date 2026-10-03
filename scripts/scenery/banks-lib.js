// Page-side bank painter: ground, grass blades, stones and tree shadows for one bank, lit from one side. Returns a PNG data URL.
(() => {
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const mulc = (a, k) => [a[0] * k[0], a[1] * k[1], a[2] * k[2]];
  const css = (c, a = 1) => `rgba(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0},${a})`;
  function rngOf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  // ---- noise
  function h2(x, y, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vn(x, y, s = 0) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); const a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
  function fb(x, y, o = 4, s = 0) { let a = 0.5, v = 0, n = 0; for (let i = 0; i < o; i++) { v += a * vn(x, y, s + i * 13); n += a; x = x * 2.03 + 11.7; y = y * 2.03 + 3.1; a *= 0.5; } return v / n; }
  function h3(x, y, z, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1103515245) ^ Math.imul(s | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vn3(x, y, z, s = 0) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    const l = (dx, dy, dz) => h3(ix + dx, iy + dy, iz + dz, s);
    const x00 = mix(l(0, 0, 0), l(1, 0, 0), ux), x10 = mix(l(0, 1, 0), l(1, 1, 0), ux), x01 = mix(l(0, 0, 1), l(1, 0, 1), ux), x11 = mix(l(0, 1, 1), l(1, 1, 1), ux);
    return mix(mix(x00, x10, uy), mix(x01, x11, uy), uz);
  }
  const fb3 = (x, y, z, o = 3, s = 0) => { let a = 0.5, v = 0, n = 0; for (let i = 0; i < o; i++) { v += a * vn3(x, y, z, s + i * 7); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; } return v / n; };

  const PAL = {
    dawn: {
      time: "dawn",
      L: norm3([-0.95, 0.30, 0.12]),
      ground: [24, 34, 28], groundLit: [60, 74, 40],
      bladeDark: [28, 46, 32], bladeMid: [70, 88, 46], bladeTip: [146, 160, 92], dry: [150, 132, 82],
      sun: [1.22, 1.06, 0.78], shade: [0.62, 0.78, 1.05], rim: [255, 214, 140], flower: [244, 240, 226],
      rock: [150, 145, 136], rockDark: [84, 82, 84], lichen: [168, 176, 112], moss: [66, 94, 44], sky: [150, 168, 192], ao: [28, 28, 34],
    },
    night: {
      time: "night",
      L: norm3([0.90, 0.36, 0.10]),
      ground: [4, 10, 12], groundLit: [14, 30, 34],
      bladeDark: [6, 16, 18], bladeMid: [20, 44, 46], bladeTip: [70, 106, 130], dry: [60, 72, 80],
      sun: [0.74, 0.92, 1.35], shade: [0.46, 0.62, 1.0], rim: [150, 186, 236], flower: [168, 184, 230],
      rock: [96, 108, 138], rockDark: [34, 40, 62], lichen: [84, 104, 116], moss: [26, 48, 52], sky: [30, 44, 92], ao: [6, 8, 18],
    },
  };

  // ---------------------------------------------------------------- stones: a faceted, noise-roughened body, found by marching along the view
  function paintRock(ctx, rk, P, S, bank, X, Y) {
    // rk: {cx, cy, rx, ry} in scene units; X/Y map scene units to canvas px
    const rnd = rngOf(Math.floor(rk.cx * 7 + rk.cy));
    const R = [rk.rx, rk.ry * 1.35, rk.rx * 0.85];
    const planes = [];
    for (let i = 0; i < 6; i++) {
      const a = rnd() * TAU, e = (rnd() - 0.2) * 1.1;
      planes.push({ n: norm3([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]), d: 0.62 + rnd() * 0.28 });
    }
    const seed = Math.floor(rnd() * 1000);
    const f = (x, y, z) => {
      let d = Math.hypot(x / R[0], y / R[1], z / R[2]) - 1;
      for (const p of planes) d = Math.max(d, (x * p.n[0] / R[0] + y * p.n[1] / R[1] + z * p.n[2] / R[2] - p.d) * 0.8);
      d += (fb3(x / 13 + seed, y / 13, z / 13) - 0.5) * 0.28 + (fb3(x / 4 + seed, y / 4, z / 4, 3, 5) - 0.5) * 0.07;
      return d;
    };
    const step = 1 / S;                                                       // sample every canvas pixel
    const x0 = Math.floor(X(rk.cx - R[0] * 1.15)), x1 = Math.ceil(X(rk.cx + R[0] * 1.15));
    const y0 = Math.floor(Y(rk.cy - R[1] * 1.15)), y1 = Math.ceil(Y(rk.cy + R[1] * 0.45));
    const W = x1 - x0, Hh = y1 - y0;
    const img = ctx.createImageData(W, Hh);
    const L = P.L;
    const minR = Math.min(...R);
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const ux = (x0 + px + 0.5) / S - (X(rk.cx) / S), uy = (rk.cy - (y0 + py + 0.5) / S + Y(0) / S * 0) ;
      // scene coords relative to the stone centre: x right, y up; the view direction runs along -z
      const sx = (x0 + px + 0.5) - X(rk.cx), sy = -((y0 + py + 0.5) - Y(rk.cy));
      const wx = sx / S, wy = sy / S;
      let z = R[2] * 1.2, hit = false;
      for (let k = 0; k < 40; k++) {
        const d = f(wx, wy, z);
        if (d < 0.004) { hit = true; break; }
        z -= Math.max(0.5, d * minR * 0.55);
        if (z < -R[2] * 1.3) break;
      }
      if (!hit) continue;
      const e = 0.6;
      const nrm = norm3([f(wx + e, wy, z) - f(wx - e, wy, z), f(wx, wy + e, z) - f(wx, wy - e, z), f(wx, wy, z + e) - f(wx, wy, z - e)]);
      // cut off the part sunk in the ground
      if (wy < -R[1] * 0.42) continue;
      // light: sun, sky from above, and a dark hollow where it meets the ground
      const dif = Math.max(0, dot3(nrm, L));
      const sky = 0.5 + 0.5 * nrm[1];
      let ao = 1;
      for (let a = 1; a <= 3; a++) ao -= Math.max(0, a * 3.2 * 0.05 - f(wx + nrm[0] * a * 3.2, wy + nrm[1] * a * 3.2, z + nrm[2] * a * 3.2)) * 0.5;
      ao = clamp(ao, 0.4, 1);
      const lowShade = 1 - 0.4 * smooth(-0.1, -0.45, wy / R[1]);               // darker where it meets the ground
      // albedo: grey stone with veins, lichen on top faces, moss low and on the shade side
      const n1 = fb(wx / 9 + seed, wy / 9, 4, seed);
      const vein = Math.abs(vn(wx / 7 + wy / 19 + seed, wy / 5, 3) - 0.5) * 2;
      let alb = mixc(P.rockDark, P.rock, smooth(0.2, 0.8, n1) * (0.75 + 0.25 * smooth(0.04, 0.3, vein)));
      const lich = smooth(0.62, 0.72, fb(wx / 6 + 40, wy / 6, 3, seed + 3)) * smooth(0.0, 0.5, nrm[1]);
      alb = mixc(alb, P.lichen, 0.55 * lich);
      const moss = smooth(0.55, 0.85, fb(wx / 14, wy / 14 + 9, 3, seed + 8)) * (0.35 + 0.65 * smooth(0.1, -0.35, wy / R[1]));
      alb = mixc(alb, P.moss, 0.7 * moss);
      const lightCol = mulc([1, 1, 1], P.sun);
      const direct = dif * ao * bank.rockSun;
      const amb = (0.5 + 0.55 * sky) * (0.4 + 0.6 * ao);
      const c = [alb[0] * (lightCol[0] * direct + amb * P.shade[0]), alb[1] * (lightCol[1] * direct + amb * P.shade[1]), alb[2] * (lightCol[2] * direct + amb * P.shade[2])];
      const o = (py * W + px) * 4;
      // a one pixel soft edge
      const edge = clamp(1 - Math.max(0, f(wx, wy, z) * 40), 0.6, 1);
      img.data[o] = clamp(c[0] * lowShade, 0, 255); img.data[o + 1] = clamp(c[1] * lowShade, 0, 255); img.data[o + 2] = clamp(c[2] * lowShade, 0, 255); img.data[o + 3] = 255 * edge;
    }
    const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = Hh; tmp.getContext("2d").putImageData(img, 0, 0);
    // contact shadow under the stone, drawn before it
    ctx.save();
    const g = ctx.createRadialGradient(X(rk.cx) + 0.12 * R[0] * S * (bank.shadowDir), Y(rk.cy + R[1] * 0.38), 1, X(rk.cx) + 0.12 * R[0] * S * (bank.shadowDir), Y(rk.cy + R[1] * 0.38), R[0] * S * 1.25);
    g.addColorStop(0, css(P.ao, 0.7)); g.addColorStop(1, css(P.ao, 0));
    ctx.translate(0, 0); ctx.scale(1, 0.28); ctx.fillStyle = g;
    ctx.fillRect(X(rk.cx) - R[0] * S * 1.6, (Y(rk.cy + R[1] * 0.38) - R[0] * S * 1.4) / 0.28, R[0] * S * 3.2, R[0] * S * 2.8 / 0.28 * 0.28 * 3.5);
    ctx.restore();
    ctx.drawImage(tmp, x0, y0);
  }

  // ---------------------------------------------------------------- the bank
  window.drawBank = (spec) => {
    // spec: { time, side, box:[x0,y0,w,h], S, seed, crest:[[x,y]...], rocks:[{cx,cy,rx,ry}], trees:[{x, base, h}], sunOnBank (0..1), shadowDir (+1 right / -1 left) }
    const P = PAL[spec.time];
    const S = spec.S;
    const [bx, by, bw, bh] = spec.box;
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(bw * S); cv.height = Math.ceil(bh * S);
    const ctx = cv.getContext("2d");
    const X = (x) => (x - bx) * S, Y = (y) => (y - by) * S;
    const rnd = rngOf(spec.seed);
    const bank = { sun: spec.sunOnBank, rockSun: 0.7 + 0.3 * spec.sunOnBank, shadowDir: spec.shadowDir };
    const crestAt = (x) => { const i = clamp(Math.round(x - spec.crest[0][0]), 0, spec.crest.length - 1); return spec.crest[i][1]; };
    const yBottom = by + bh;
    const yTop = Math.min(...spec.crest.map((c) => c[1]));

    // --- 1. the ground colour, per pixel, then cut to the bank's outline
    const W = cv.width, Hc = cv.height;
    const img = ctx.createImageData(W, Hc);
    const sunK = bank.sun;
    for (let py = 0; py < Hc; py++) {
      const y = by + py / S;
      for (let px = 0; px < W; px++) {
        const x = bx + px / S;
        const cy = crestAt(x);
        if (y < cy - 1) continue;
        const dd = clamp((y - cy) / Math.max(40, yBottom - cy), 0, 1);
        const n1 = fb(x / 38, y / 30, 4, 1), n2 = fb(x / 9, y / 8, 3, 5), n3 = fb(x / 160, y / 120, 3, 9);
        let c = mixc(P.ground, P.groundLit, smooth(0.25, 0.8, n1) * (0.3 + 0.7 * sunK) + 0.15 * n2);
        c = mixc(c, P.dry, 0.25 * smooth(0.55, 0.85, n3) * (0.5 + 0.5 * n2));
        const lightK = 0.55 + 0.45 * sunK;
        c = [c[0] * (0.6 + 0.8 * lightK * (1 - 0.35 * dd)) , c[1] * (0.6 + 0.8 * lightK * (1 - 0.35 * dd)), c[2] * (0.6 + 0.8 * lightK * (1 - 0.35 * dd))];
        const o = (py * W + px) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // --- 2. blades and stones, far to near
    const ops = [];
    const area = (y) => (y - yTop) / (yBottom - yTop);
    const scaleAt = (y) => mix(0.34, 1.7, Math.pow(clamp(area(y), 0, 1), 1.1));
    // tufts: clumps of blades
    const nTufts = Math.round(bw * bh * 0.07);
    for (let i = 0; i < nTufts; i++) {
      const x = bx + rnd() * bw;
      const cy = crestAt(x);
      const y = cy + Math.pow(rnd(), 0.9) * (yBottom - cy);
      ops.push({ y, kind: "tuft", x });
    }
    // an edge fringe along the crest: blades standing against the sky
    for (let x = bx; x < bx + bw; x += 0.55) ops.push({ y: crestAt(x) + rnd() * 3, kind: "fringe", x: x + rnd() * 0.5 });
    for (const rk of spec.rocks) {
      ops.push({ y: rk.cy + rk.ry * 0.35, kind: "rock", rk });
      for (let i = 0; i < 7; i++) {
        const a = rnd() * TAU, d = rk.rx * (0.9 + rnd() * 0.9);
        const r = rk.rx * (0.06 + rnd() * 0.12);
        const cx = rk.cx + Math.cos(a) * d, cy = rk.cy + rk.ry * 0.3 + Math.sin(a) * d * 0.28;
        if (cy < crestAt(cx) + 10) continue;
        ops.push({ y: cy + r * 0.3, kind: "rock", rk: { cx, cy, rx: r, ry: r * 0.62 } });
      }
    }
    ops.sort((a, b) => a.y - b.y);

    const sunBlade = (c, k) => mulc(c, mixc([P.shade[0], P.shade[1], P.shade[2]].map((v) => v), [P.sun[0], P.sun[1], P.sun[2]], k));
    const patchLight = (px, py) => fb(px / (90 * S), py / (60 * S), 3, 31);   // sun patches and shaded folds, 0..1
    const patchHue = (px, py) => fb(px / (140 * S), py / (110 * S), 3, 47);   // yellow-green to blue-green
    function blade(x, y, h, lean, curve, width, tone, rim) {
      // x, y in px of the base; h in px
      const tipx = x + lean * h, tipy = y - h * (1 - 0.12 * Math.abs(lean));
      const mx = x + lean * h * 0.35 + curve * h * 0.25, my = y - h * 0.55;
      const pl = patchLight(x, y), ph = patchHue(x, y);
      const base = mixc(mixc(P.bladeDark, P.bladeMid, tone), spec.time === "dawn" ? [40, 78, 62] : [14, 40, 52], smooth(0.55, 0.9, ph) * 0.45);
      const lightK = clamp(bank.sun * 0.85 * (0.55 + 0.9 * pl) + 0.25 * (lean < 0 ? 1 : 0) * (spec.time === "dawn" ? 1 : 0) + (rnd() - 0.5) * 0.15, 0, 1);
      let lower = sunBlade(base, lightK * 0.5);
      let upper = sunBlade(mixc(P.bladeMid, P.bladeTip, 0.35 + 0.5 * tone), lightK);
      if (rnd() < 0.07) { upper = sunBlade(P.dry, lightK); lower = sunBlade(mixc(P.dry, P.bladeDark, 0.5), lightK * 0.6); }
      const w = width;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(mx - w * 0.7, my, tipx, tipy); ctx.quadraticCurveTo(mx + w * 0.7, my, x + w, y); ctx.closePath();
      ctx.fillStyle = css(lower, 1); ctx.fill();
      // the upper half catches more light
      ctx.beginPath(); ctx.moveTo(mx - w * 0.5 + (x - mx) * 0.0, my + h * 0.1); ctx.quadraticCurveTo(mx - w * 0.3, my - h * 0.12, tipx, tipy); ctx.quadraticCurveTo(mx + w * 0.4, my - h * 0.1, mx + w * 0.5, my + h * 0.1); ctx.closePath();
      ctx.fillStyle = css(upper, 0.92); ctx.fill();
      if (rim > 0) { ctx.strokeStyle = css(P.rim, rim); ctx.lineWidth = Math.max(0.6, w * 0.5); ctx.beginPath(); ctx.moveTo(mx - w * 0.2, my); ctx.quadraticCurveTo(mx, my - h * 0.1, tipx, tipy); ctx.stroke(); }
    }
    const windLean = spec.time === "dawn" ? 0.10 : -0.08;
    for (const op of ops) {
      if (op.kind === "rock") { paintRock(ctx, op.rk, P, S, bank, X, Y); continue; }
      const sc = scaleAt(op.y);
      if (op.kind === "tuft") {
        const n = 5 + Math.floor(rnd() * 9);
        const spread = 5.5 * sc * S * 0.5;
        const grove = fb(op.x / 55, op.y / 40, 3, 2);
        for (let k = 0; k < n; k++) {
          const bx0 = X(op.x) + (rnd() - 0.5) * spread, by0 = Y(op.y) + (rnd() - 0.5) * spread * 0.35;
          const h = (7 + rnd() * 15) * sc * S * (0.7 + 0.6 * grove);
          const lean = windLean + (bx0 - X(op.x)) / Math.max(1, spread) * 0.5 + (rnd() - 0.5) * 0.35;
          blade(bx0, by0, h, lean, (rnd() - 0.5) * 0.5, (0.45 + rnd() * 0.5) * sc * S * 0.5, clamp(grove * 1.3 - 0.1 + (rnd() - 0.5) * 0.3, 0, 1), 0);
        }
        // now and then a small flower or a seed head
        if (grove > 0.52 && rnd() < 0.10) {
          const fx = X(op.x), fy = Y(op.y) - (9 + rnd() * 14) * sc * S;
          ctx.strokeStyle = css(P.bladeMid, 0.9); ctx.lineWidth = 0.5 * sc * S * 0.6; ctx.beginPath(); ctx.moveTo(fx, Y(op.y)); ctx.lineTo(fx + windLean * 8, fy); ctx.stroke();
          const pick = rnd();
          const fc = pick < 0.6 ? P.flower : pick < 0.85 ? (spec.time === "dawn" ? [236, 206, 84] : [150, 160, 120]) : (spec.time === "dawn" ? [186, 160, 214] : [110, 120, 190]);
          ctx.fillStyle = css(fc, 0.92); ctx.beginPath(); ctx.arc(fx + windLean * 8, fy, (0.7 + rnd() * 0.6) * sc * S * 0.55, 0, TAU); ctx.fill();
        }
        // a taller, coarser tussock now and then
        if (rnd() < 0.05) {
          for (let k = 0; k < 7; k++) blade(X(op.x) + (rnd() - 0.5) * 4 * sc * S * 0.5, Y(op.y), (16 + rnd() * 14) * sc * S, windLean + (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.7, (0.7 + rnd() * 0.5) * sc * S * 0.5, 0.6 + rnd() * 0.4, 0);
        }
      } else {
        // fringe: taller, thinner blades against the sky, lit from behind on the sun side
        const h = (11 + rnd() * 26) * S * 0.9 * (0.8 + 0.4 * rnd());
        const rim = spec.time === "dawn" ? 0.55 * (spec.side === "l" ? 1 : 0.5) : 0.3;
        blade(X(op.x), Y(op.y) + 2, h, windLean + (rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7, (0.5 + rnd() * 0.5) * S * 0.5, rnd() * 0.8, rnd() < 0.5 ? rim : 0);
        if (rnd() < 0.025) {   // a seed stalk
          const fx = X(op.x), fy = Y(op.y) - (22 + rnd() * 24) * S;
          ctx.strokeStyle = css(mixc(P.dry, P.bladeMid, 0.4), 0.95); ctx.lineWidth = 0.6 * S * 0.5; ctx.beginPath(); ctx.moveTo(fx, Y(op.y) + 2); ctx.quadraticCurveTo(fx + windLean * 14, (Y(op.y) + fy) / 2, fx + windLean * 22, fy); ctx.stroke();
          ctx.fillStyle = css(mixc(P.dry, [255, 240, 200], 0.4), 0.95); ctx.beginPath(); ctx.ellipse(fx + windLean * 22, fy - 2.5 * S * 0.5, 0.9 * S * 0.5, 3 * S * 0.5, windLean * 1.2, 0, TAU); ctx.fill();
        }
      }
    }

    // --- 3. shadows of the trees, falling away from the light, soft
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, Hc);
    for (let x = bx; x <= bx + bw; x += 2) ctx.lineTo(X(x), Y(crestAt(Math.min(x, bx + bw - 1))) + 2);
    ctx.lineTo(W, Hc); ctx.closePath(); ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    ctx.filter = `blur(${Math.round(7 * S)}px)`;
    for (const t of spec.trees) {
      const len = t.h * 0.42 * S, wd = Math.max(6, t.h * 0.05) * S;
      const x0 = X(t.x), y0 = Y(t.base + 4);
      const dir = spec.shadowDir;
      const k = 0.18 + 0.5 * bank.sun;
      ctx.fillStyle = `rgba(${P.time === "dawn" ? "58,70,92" : "10,14,32"},${k})`;
      ctx.beginPath(); ctx.ellipse(x0 + dir * len * 0.5, y0 + wd * 0.1, len * 0.5, wd, dir * 0.04, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // --- 4. cut to the bank: clear what lies above the crest, keeping the blades that stand against the sky
    return cv.toDataURL("image/png");
  };
})();
