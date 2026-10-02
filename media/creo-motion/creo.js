'use strict';
/*
  CREO, motion notes. 1920 x 1080, 30 fps, 15 s.
  Every frame is a pure function of time: draw(ctx, t). Motion blur comes from averaging sub-frames inside a 180 degree
  shutter in linear light, so anything that is still stays exactly as crisp as a single render.
*/

const W = 1920, H = 1080, FPS = 30, DUR = 15, NF = DUR * FPS;
const SHUTTER = 0.5 / FPS;
const C = {
  cream: '#F3F2E9', ink: '#11140C', dark: '#10130B', lime: '#B5CF4F', limeHi: '#C8DF6B', olive: '#4B6A0E',
  coral: '#FF5F4A', coralSoft: '#FF8B78', red: '#C2361E',
};
// Hard cuts sit half-way between frames, so no frame's shutter ever straddles one.
const HF = (n) => (n + 0.5) / FPS;
const T = { s3: HF(111), w2: HF(125), w3: HF(139), w4: HF(153), s4: HF(168), exit: 8.2, s5: 8.4, fold: 10.8, s6: 11.1, rel: 12.88, s7: 13.18 };

/* ---------- maths ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOutCubic = (t) => 1 - (1 - t) ** 3;
const eInCubic = (t) => t * t * t;
const eInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const eOutQuart = (t) => 1 - (1 - t) ** 4;
const eInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const eOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
const eInQuad = (t) => t * t;
/** Unit step response of a damped spring: 0 -> 1, overshooting when z < 1. f in Hz. */
function spring(t, f = 3, z = 0.5) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}
/** CSS-style cubic-bezier easing. */
function bezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u, dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 10; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break; u -= e / d; }
    return sy(clamp(u));
  };
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (h1, h2, t, a = 1) => { const p = hex(h1), q = hex(h2); return `rgba(${Math.round(lerp(p[0], q[0], t))},${Math.round(lerp(p[1], q[1], t))},${Math.round(lerp(p[2], q[2], t))},${a})`; };

/* ---------- type ---------- */
const layouts = new Map();
function layout(ctx, text, px, fam = 'Anton', weight = 400) {
  const key = `${fam}|${weight}|${px}|${text}`;
  if (layouts.has(key)) return layouts.get(key);
  ctx.save();
  ctx.font = `${weight} ${px}px ${fam}`;
  const glyphs = [...text].map((ch, i) => ({ ch, x: ctx.measureText(text.slice(0, i)).width, w: ctx.measureText(ch).width }));
  const m = ctx.measureText(text);
  ctx.restore();
  const o = { glyphs, width: m.width, px, fam, weight };
  layouts.set(key, o);
  return o;
}
/** One glyph, drawn so that (0, 0) is its baseline centre. */
function glyph(ctx, g, px, color, fam = 'Anton') {
  ctx.font = `${px}px ${fam}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(g.ch, -g.w / 2, 0);
}

/* Handwriting, written on left to right like a pen, from a cached raster of the line. */
const noteCache = new Map();
function noteCanvas(text, px, color, weight) {
  const key = `${text}|${px}|${color}|${weight}`;
  if (noteCache.has(key)) return noteCache.get(key);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${weight} ${px}px Hand`;
  const tw = g.measureText(text).width;
  const pad = Math.ceil(px * 0.35);
  c.width = Math.ceil(tw + pad * 2);
  c.height = Math.ceil(px * 1.5);
  g.font = `${weight} ${px}px Hand`;
  g.fillStyle = color;
  g.fillText(text, pad, Math.round(px * 1.05));
  const o = { c, pad, base: Math.round(px * 1.05), tw };
  noteCache.set(key, o);
  return o;
}
function note(ctx, text, x, y, px, color, p, { weight = 500, rot = -0.035, align = 'left', alpha = 1 } = {}) {
  if (p <= 0 || alpha <= 0) return;
  const n = noteCanvas(text, px, color, weight);
  const ox = align === 'right' ? -n.tw : align === 'center' ? -n.tw / 2 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  const full = n.pad + n.tw * clamp(p);
  const feather = Math.min(18, full);
  const solid = p >= 1 ? n.c.width : full - feather;
  if (solid > 0) ctx.drawImage(n.c, 0, 0, solid, n.c.height, ox - n.pad, -n.base, solid, n.c.height);
  if (p < 1) for (let k = 0; k < 3; k++) {
    const a = solid + (feather / 3) * k, w = feather / 3;
    ctx.globalAlpha = alpha * (1 - (k + 1) / 4);
    ctx.drawImage(n.c, a, 0, w, n.c.height, ox - n.pad + a, -n.base, w, n.c.height);
  }
  ctx.restore();
}
const writeP = (t, a, dur) => eInOutSine(prog(t, a, a + dur));

/* Hand-drawn arrow along a cubic bezier; drawn on with p, head appears at the end. */
const bez = (P, u) => { const v = 1 - u; return [v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0], v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1]]; };
function arrow(ctx, P, p, color, { width = 3, seed = 1, alpha = 1 } = {}) {
  if (p <= 0 || alpha <= 0) return;
  const r = rng(seed);
  const ph = r() * 6.28;
  const N = 48;
  const end = clamp(p);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * end;
    const [x, y] = bez(P, u);
    const wob = Math.sin(u * 8 + ph) * 1.1;
    if (i) ctx.lineTo(x + wob, y - wob * 0.5); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  const hp = prog(p, 0.8, 1);
  if (hp > 0) {
    const e = bez(P, 1), b = bez(P, 0.93);
    const ang = Math.atan2(e[1] - b[1], e[0] - b[0]);
    const L = 17 * eOutCubic(hp);
    ctx.beginPath();
    ctx.moveTo(e[0] - L * Math.cos(ang - 0.48), e[1] - L * Math.sin(ang - 0.48));
    ctx.lineTo(e[0], e[1]);
    ctx.lineTo(e[0] - L * Math.cos(ang + 0.42), e[1] - L * Math.sin(ang + 0.42));
    ctx.stroke();
  }
  ctx.restore();
}

/* A brush stroke with tapering width, drawn on along its length. */
function brush(ctx, pts, p, w0, w1, color, alpha = 1) {
  const n = Math.max(2, Math.ceil(pts.length * clamp(p)));
  if (p <= 0) return;
  const P = pts.slice(0, n);
  const L = [], R = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    const u = i / (pts.length - 1);
    const w = lerp(w0, w1, u) * (0.9 + 0.1 * Math.sin(u * 11));
    L.push([P[i][0] + (nx * w) / 2, P[i][1] + (ny * w) / 2]);
    R.push([P[i][0] - (nx * w) / 2, P[i][1] - (ny * w) / 2]);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (const q of L) ctx.lineTo(q[0], q[1]);
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.fill();
  const tip = P[P.length - 1];
  ctx.beginPath();
  ctx.arc(tip[0], tip[1], lerp(w0, w1, (P.length - 1) / (pts.length - 1)) / 2, 0, Math.PI * 2);
  ctx.arc(P[0][0], P[0][1], w0 / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- the dot ---------- */
const GROUND = 758, BR = 30, BY = GROUND - BR, FR = 40;
let BALL = null;
function buildBall(target) {
  const g = 4400, e = 0.58, t0 = 0.12, y0 = -70, x0 = 210;
  function sim(vx0) {
    const segs = [], hits = [];
    let t = t0, x = x0, vx = vx0;
    const fall = Math.sqrt((2 * (BY - y0)) / g);
    segs.push({ ta: t, tb: t + fall, x0: x, vx, y0, vy0: 0 });
    t += fall; x += vx * fall;
    let v = g * fall;
    for (let k = 0; k < 9; k++) {
      const dc = v > 600 ? 0.034 : v > 250 ? 0.024 : 0.016;
      const vxc = vx * 0.35;
      hits.push({ t, v, x, dc, vxc });
      t += dc; x += vxc * dc;
      v *= e; vx *= 0.76;
      if (v < 110) break;
      const T2 = (2 * v) / g;
      segs.push({ ta: t, tb: t + T2, x0: x, vx, y0: BY, vy0: -v });
      t += T2; x += vx * T2;
    }
    return { segs, hits, x, rest: t };
  }
  const unit = sim(1000);
  const vx0 = (1000 * (target - x0)) / (unit.x - x0);
  const b = sim(vx0);
  b.g = g;
  b.xRest = b.x;
  // the settle hop, after the type has landed: a small anticipation squash, one hop, one tiny rebound
  b.antic = { a: 3.0, b: 3.1 };
  let t = 3.1, v = 560;
  for (let k = 0; k < 2; k++) {
    const T2 = (2 * v) / g;
    b.segs.push({ ta: t, tb: t + T2, x0: b.xRest, vx: 0, y0: BY, vy0: -v });
    t += T2;
    const dc = k ? 0.016 : 0.024;
    b.hits.push({ t, v, x: b.xRest, dc, vxc: 0 });
    t += dc;
    v *= 0.42;
  }
  return b;
}
function ballState(t) {
  const B = BALL;
  if (t < B.segs[0].ta) return null;
  for (const h of B.hits) if (t >= h.t && t < h.t + h.dc) {
    const u = (t - h.t) / h.dc;
    const A = clamp(h.v / 2700) * 0.46 + 0.05;
    const env = Math.sin(Math.PI * u);
    const sy = 1 - A * env, sx = 1 + 0.9 * A * env;
    return { x: h.x + h.vxc * (t - h.t), y: GROUND - BR * sy, sx, sy, ang: 0 };
  }
  if (t >= B.antic.a && t < B.antic.b) {
    const u = prog(t, B.antic.a, B.antic.b);
    const s = 0.2 * Math.sin((Math.PI / 2) * u);
    return { x: B.xRest, y: GROUND - BR * (1 - s), sx: 1 + 0.75 * s, sy: 1 - s, ang: 0 };
  }
  for (const s of B.segs) if (t >= s.ta && t < s.tb) {
    const dt = t - s.ta;
    const vy = s.vy0 + B.g * dt;
    const sp = Math.hypot(s.vx, vy);
    const k = clamp(sp / 2700) * 0.32;
    return { x: s.x0 + s.vx * dt, y: s.y0 + s.vy0 * dt + 0.5 * B.g * dt * dt, sx: 1 + k, sy: 1 / (1 + 0.6 * k), ang: Math.atan2(vy, s.vx || 1e-9) };
  }
  return { x: B.xRest, y: BY, sx: 1, sy: 1, ang: 0 };
}
function dot(ctx, s, { r = BR, fill = C.lime, edge = 'rgba(75,106,14,0.55)', alpha = 1 } = {}) {
  if (!s) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r * s.sx, r * s.sy, s.ang, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) { ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke(); }
  ctx.restore();
}

/* ---------- layout, set once fonts are in ---------- */
const L = {};
const EVENTS = [];
function init(ctx) {
  // Opening headline: THE INTELLIGENCE LAYER FOR / CREATORS. The second line sits on the dot's ground line.
  const l2 = layout(ctx, 'CREATORS', 340);
  const l1u = layout(ctx, 'THE INTELLIGENCE LAYER FOR', 100);
  const l1px = (100 * l2.width) / l1u.width;
  const total = l2.width + 6 + 2 * BR;
  const left = (W - total) / 2;
  L.head = { left, l1px, l2px: 340, b2: GROUND, b1: GROUND - 0.87 * 340 - 38, dotX: left + l2.width + 6 + BR, l1: layout(ctx, 'THE INTELLIGENCE LAYER FOR', l1px), l2 };
  BALL = buildBall(L.head.dotX);

  // Final lockup: YOUR AI CREATOR MANAGER / CREO.
  const f2 = layout(ctx, 'CREO', 440);
  const f1u = layout(ctx, 'YOUR AI CREATOR MANAGER', 100);
  const f1px = (100 * f2.width) / f1u.width;
  const ftotal = f2.width + 8 + 2 * FR;
  const fleft = (W - ftotal) / 2;
  const cap1 = 0.87 * f1px, cap2 = 0.87 * 440;
  const top = (H - (cap1 + 36 + cap2)) / 2 - 26;
  L.fin = { left: fleft, f1px, b1: top + cap1, b2: top + cap1 + 36 + cap2, dotX: fleft + f2.width + 8 + FR, l1: layout(ctx, 'YOUR AI CREATOR MANAGER', f1px), l2: f2 };

  // Big words
  L.words = { px: 380, base: 540 + (0.87 * 380) / 2 };
  for (const w of ['REMEMBER', 'ANALYZE', 'CREATE', 'DECIDE']) L.words[w] = layout(ctx, w, 380);

  buildField();

  // Sound cues, from the same numbers the picture uses.
  for (const h of BALL.hits) EVENTS.push({ t: h.t, type: 'tap', v: clamp(h.v / 2700) });
  EVENTS.push({ t: 0.02, type: 'draw', v: 0.5 });
  EVENTS.push({ t: 2.05, type: 'swishUp', v: 0.8 }, { t: 2.32, type: 'swishDown', v: 0.5 });
  EVENTS.push({ t: 2.96, type: 'pen', v: 0.6 }, { t: 3.12, type: 'pen', v: 0.5 });
  // words
  for (let i = 0; i < 8; i += 2) { const st = T.s3 + 0.014 * i; const fall = Math.sqrt((2 * 340) / 16000); EVENTS.push({ t: st + fall, type: 'tick', v: 0.6 - i * 0.05 }); }
  EVENTS.push({ t: T.w2 + 0.04, type: 'stretch', v: 0.9 }, { t: T.w2 + 0.2, type: 'boing', v: 0.9 });
  EVENTS.push({ t: T.w3, type: 'spin', v: 0.8 });
  EVENTS.push({ t: T.w4 + 0.09, type: 'snap', v: 1 });
  // graph
  EVENTS.push({ t: T.s4 + 0.02, type: 'draw', v: 0.6 });
  for (let k = 0; k <= 10; k++) EVENTS.push({ t: 6.04 + 0.09 * k, type: 'tick', v: 0.28 });
  EVENTS.push({ t: 6.32, type: 'pen', v: 0.5 }, { t: 7.08, type: 'scribble', v: 0.6 }, { t: 7.2, type: 'pen', v: 0.5 });
  const E = bezierEase(0.65, 0, 0.35, 1);
  for (let k = 0; k <= 10; k++) { let u = 0; for (let j = 0; j < 60; j++) { if (E(j / 60) >= k / 10) { u = j / 60; break; } } }
  for (let k = 0; k <= 10; k++) EVENTS.push({ t: 7.3 + 0.09 * k, type: 'tick', v: 0.22 + 0.3 * Math.sin((Math.PI * k) / 10) });
  EVENTS.push({ t: 8.2, type: 'whoosh', v: 1 });
  // field
  EVENTS.push({ t: 8.42, type: 'air', v: 1, d: 2.6 });
  EVENTS.push({ t: T.fold, type: 'fold', v: 0.7 });
  // ring
  for (let k = 0; k < 24; k++) EVENTS.push({ t: ringActivation(k), type: 'blip', v: 0.35 + 0.4 * (k / 23), k });
  EVENTS.push({ t: 12.68, type: 'inhale', v: 0.8 }, { t: T.rel, type: 'release', v: 1 });
  // final
  const fd = finalDot();
  EVENTS.push({ t: 13.14, type: 'swishUp', v: 0.7 }, { t: 13.3, type: 'swishDown', v: 0.45 });
  EVENTS.push({ t: fd.t1, type: 'tap', v: 0.5 }, { t: fd.t2, type: 'tap', v: 0.16 });
  EVENTS.push({ t: fd.t1, type: 'chord', v: 1 });
  EVENTS.push({ t: 14.02, type: 'pen', v: 0.5 });
  EVENTS.sort((a, b) => a.t - b.t);
}

/* ---------- scene 1 + 2: the dot, then the headline (cream) ---------- */
function sceneOpen(ctx, t) {
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  const hd = L.head;

  // the ground line draws on, and later gives way to the underline
  const gl = eOutCubic(prog(t, 0.0, 0.42));
  const gfade = 1 - prog(t, 2.92, 3.2);
  if (gl > 0 && gfade > 0) {
    ctx.save();
    ctx.globalAlpha = 0.82 * gfade;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, GROUND + 1);
    ctx.lineTo(lerp(150, 1770, gl), GROUND + 1);
    ctx.stroke();
    // little end ticks, like a ruler
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, GROUND - 7); ctx.lineTo(150, GROUND + 9);
    if (gl > 0.98) { ctx.moveTo(1770, GROUND - 7); ctx.lineTo(1770, GROUND + 9); }
    ctx.stroke();
    ctx.restore();
  }

  // onion skins: earlier drawings of the dot at fixed 1/15 s steps, so they never shimmer
  const ghostFade = 1 - prog(t, 2.0, 2.4);
  if (ghostFade > 0) {
    const step = 1 / 15;
    for (let tg = Math.ceil(BALL.segs[0].ta / step) * step; tg < t - 0.02; tg += step) {
      const age = t - tg;
      if (age > 1.15 || tg > BALL.rest + 0.02) continue;
      const s = ballState(tg);
      if (!s || s.y < -BR) continue;
      const a = 0.42 * (1 - age / 1.15) * ghostFade;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, BR * s.sx, BR * s.sy, s.ang, 0, Math.PI * 2);
      ctx.strokeStyle = C.olive;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
  }

  // impact marks (red corrections) at the two hardest landings
  for (const [i, h] of BALL.hits.slice(0, 2).entries()) {
    const a = prog(t, h.t, h.t + 0.07) * (1 - prog(t, h.t + 0.3, h.t + 0.55));
    if (a <= 0) continue;
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.globalAlpha = a;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (const [dx, dy] of [[-1, -0.55], [-1.15, 0.05], [1, -0.55], [1.15, 0.05]]) {
      const L0 = BR * 1.55, L1 = BR * (1.55 + 0.75 * eOutCubic(prog(t, h.t, h.t + 0.12)));
      ctx.beginPath();
      ctx.moveTo(h.x + dx * L0, GROUND - 8 + dy * 22);
      ctx.lineTo(h.x + dx * L1, GROUND - 8 + dy * 30);
      ctx.stroke();
    }
    ctx.restore();
    void i;
  }

  // notes for the dot
  const n1 = writeP(t, 0.42, 0.32), n1a = eOutCubic(prog(t, 0.62, 0.86));
  const fadeNotes = 1 - prog(t, 2.12, 2.4);
  note(ctx, 'you post', 420, 300, 46, C.olive, n1, { alpha: fadeNotes });
  arrow(ctx, [[408, 310], [370, 330], [350, 370], [372, 420]], n1a, C.olive, { seed: 3, alpha: fadeNotes });
  const apex = BALL.segs[1];
  const ax = apex.x0 + apex.vx * (apex.tb - apex.ta) / 2;
  note(ctx, 'it remembers', ax - 40, 330, 46, C.olive, writeP(t, 1.12, 0.36), { alpha: fadeNotes });
  arrow(ctx, [[ax - 70, 342], [ax - 110, 380], [ax - 120, 420], [ax - 92, 452]], eOutCubic(prog(t, 1.38, 1.62)), C.olive, { seed: 5, alpha: fadeNotes });
  note(ctx, 'it learns', hd.dotX - 360, 560, 46, C.olive, writeP(t, 1.6, 0.3), { alpha: fadeNotes });
  arrow(ctx, [[hd.dotX - 190, 574], [hd.dotX - 120, 590], [hd.dotX - 70, 640], [hd.dotX - 42, 694]], eOutCubic(prog(t, 1.84, 2.02)), C.olive, { seed: 7, alpha: fadeNotes });

  // CREATORS rises out of the line, letter by letter
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, GROUND + 2);
  ctx.clip();
  hd.l2.glyphs.forEach((g, i) => {
    const tau = t - (2.05 + 0.045 * i);
    if (tau <= 0) return;
    const s = spring(tau, 2.4, 0.6);
    const dy = (1 - s) * 300;
    const rot = (1 - s) * (i % 2 ? 1 : -1) * 0.14;
    ctx.save();
    ctx.translate(hd.left + g.x + g.w / 2, hd.b2 + dy);
    ctx.rotate(rot);
    glyph(ctx, g, hd.l2px, C.ink);
    ctx.restore();
  });
  ctx.restore();

  // THE INTELLIGENCE LAYER FOR drops in above
  hd.l1.glyphs.forEach((g, i) => {
    if (g.ch === ' ') return;
    const tau = t - (2.3 + 0.019 * i);
    if (tau <= 0) return;
    const s = spring(tau, 2.9, 0.66);
    const dy = -(1 - s) * 110;
    const rot = (1 - s) * (i % 3 === 0 ? 0.1 : i % 3 === 1 ? -0.07 : 0.05);
    ctx.save();
    ctx.globalAlpha = clamp(tau / 0.07);
    ctx.translate(hd.left + g.x + g.w / 2, hd.b1 + dy);
    ctx.rotate(rot);
    glyph(ctx, g, hd.l1px, C.ink);
    ctx.restore();
  });

  // the underline sweeps in beneath CREATORS
  const ul = eOutCubic(prog(t, 2.96, 3.26));
  if (ul > 0) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([lerp(hd.left - 6, hd.left + hd.l2.width + 4, u), GROUND + 30 - 9 * Math.sin(u * Math.PI * 0.9) + 6 * u * u]); }
    brush(ctx, pts, ul, 7, 3.2, C.olive, 0.95);
  }

  // the dot: bounces in, rests as the period, settles once more after the type
  const s = ballState(t);
  dot(ctx, s);

  // banner line from CREO's own banner
  note(ctx, 'for creators who want more', hd.dotX - 290, 896, 48, C.olive, writeP(t, 3.14, 0.36), { align: 'right', rot: -0.025 });
  arrow(ctx, [[hd.dotX - 270, 880], [hd.dotX - 180, 878], [hd.dotX - 70, 860], [hd.dotX - 30, 790]], eOutCubic(prog(t, 3.42, 3.62)), C.olive, { seed: 9 });
}

/* ---------- scene 3: four verbs, each moving the way it means (dark) ---------- */
const glyphCache = new Map();
function glyphCanvas(ch, px, color) {
  const key = `${ch}|${px}|${color}`;
  if (glyphCache.has(key)) return glyphCache.get(key);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${px}px Anton`;
  const w = Math.ceil(g.measureText(ch).width) + 8;
  c.width = w;
  c.height = Math.ceil(px * 1.05);
  g.font = `${px}px Anton`;
  g.fillStyle = color;
  g.fillText(ch, 4, Math.round(px * 0.95));
  const o = { c, w, h: c.height, base: Math.round(px * 0.95) };
  glyphCache.set(key, o);
  return o;
}
/** A glyph turned about its vertical axis with real perspective, drawn in thin vertical slices. */
function yRot(ctx, gc, cx, base, theta, alpha = 1) {
  const N = 36, D = 1500;
  const cos = Math.cos(theta), sin = Math.sin(theta);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const x0 = (u0 - 0.5) * gc.w, x1 = (u1 - 0.5) * gc.w;
    const f0 = D / (D + x0 * sin), f1 = D / (D + x1 * sin);
    const sx0 = cx + x0 * cos * f0, sx1 = cx + x1 * cos * f1;
    const f = (f0 + f1) / 2;
    const left = Math.min(sx0, sx1), wpx = Math.abs(sx1 - sx0);
    if (wpx < 0.05) continue;
    ctx.drawImage(gc.c, u0 * gc.w, 0, gc.w / N, gc.h, left, base - gc.base * f, wpx + 0.35, gc.h * f);
  }
  ctx.restore();
}
function sceneWords(ctx, t) {
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, W, H);
  const LW = L.words, px = LW.px, base = LW.base;
  const word = t < T.w2 ? 'REMEMBER' : t < T.w3 ? 'ANALYZE' : t < T.w4 ? 'CREATE' : 'DECIDE';
  const lay = LW[word];
  const x0 = (W - lay.width) / 2;
  const noteX = W / 2 + lay.width / 2 - 40;

  if (word === 'REMEMBER') {
    const tau = t - T.s3;
    const g = 16000, h0 = 340, e = 0.28;
    lay.glyphs.forEach((gl, i) => {
      const lt = tau - 0.014 * i;
      if (lt <= 0) return;
      // fall, one bounce, settle, with a brief squash on each landing
      const fall = Math.sqrt((2 * h0) / g), v1 = g * fall, v2 = v1 * e, T2 = (2 * v2) / g, v3 = v2 * e, T3 = (2 * v3) / g;
      let y = 0, sq = 0;
      if (lt < fall) y = -h0 + 0.5 * g * lt * lt;
      else if (lt < fall + T2) { const d = lt - fall; y = -(v2 * d - 0.5 * g * d * d); sq = Math.max(0, 1 - d / 0.03) * 0.12; }
      else if (lt < fall + T2 + T3) { const d = lt - fall - T2; y = -(v3 * d - 0.5 * g * d * d); sq = Math.max(0, 1 - d / 0.025) * 0.06; }
      ctx.save();
      ctx.translate(x0 + gl.x + gl.w / 2, base + y);
      ctx.scale(1 + sq * 0.6, 1 - sq);
      glyph(ctx, gl, px, C.cream);
      ctx.restore();
    });
    note(ctx, 'every post, every deal', noteX, 880, 46, C.limeHi, writeP(t, T.s3 + 0.17, 0.26), { align: 'right' });
  } else if (word === 'ANALYZE') {
    const tau = t - T.w2;
    let sx;
    if (tau < 0.05) sx = lerp(0.9, 1, eOutCubic(tau / 0.05));
    else if (tau < 0.2) sx = 1 + 0.55 * eOutQuart((tau - 0.05) / 0.15); // pulled, against resistance
    else sx = 1 + 0.55 * (1 - spring(tau - 0.2, 3.3, 0.3)); // let go: overshoots short, settles
    const sy = 1 / Math.sqrt(sx);
    ctx.save();
    ctx.translate(W / 2, base);
    ctx.scale(sx, sy);
    ctx.font = `${px}px Anton`;
    ctx.fillStyle = C.lime;
    ctx.fillText(word, -lay.width / 2, 0);
    ctx.restore();
    note(ctx, 'elastic: what worked, and why', noteX, 880, 46, C.limeHi, writeP(t, T.w2 + 0.16, 0.26), { align: 'right' });
  } else if (word === 'CREATE') {
    const tau = t - T.w3;
    lay.glyphs.forEach((gl, i) => {
      const lt = tau - 0.034 * i;
      if (lt <= 0) return;
      const s = spring(lt, 2.6, 0.5);
      const theta = (-Math.PI / 2) * (1 - s);
      const m = clamp((Math.abs(theta) / (Math.PI / 2)) * 1.6);
      const cx = x0 + gl.x + gl.w / 2;
      yRot(ctx, glyphCanvas(gl.ch, px, C.cream), cx, base, theta, 1 - m);
      if (m > 0) yRot(ctx, glyphCanvas(gl.ch, px, C.lime), cx, base, theta, m);
    });
    note(ctx, 'rotate: hooks, scripts, shots', noteX, 880, 46, C.limeHi, writeP(t, T.w3 + 0.2, 0.24), { align: 'right' });
  } else {
    const tau = t - T.w4;
    const land = 0.085;
    const u = clamp(tau / land);
    const sc = lerp(1.55, 1, u), dy = lerp(-120, 0, u);
    ctx.save();
    ctx.translate(W / 2, base + dy);
    ctx.scale(sc, sc);
    ctx.font = `${px}px Anton`;
    ctx.fillStyle = C.coral;
    ctx.fillText(word, -lay.width / 2, 0);
    ctx.restore();
    // alignment guides flash once it lands
    const ga = prog(tau, land, land + 0.03) * (1 - prog(tau, land + 0.24, land + 0.38));
    if (ga > 0) {
      ctx.save();
      ctx.strokeStyle = C.coral;
      ctx.globalAlpha = 0.75 * ga;
      ctx.lineWidth = 1.2;
      const cap = base - 0.87 * px;
      ctx.beginPath();
      ctx.moveTo(60, base + 0.5); ctx.lineTo(W - 60, base + 0.5);
      ctx.moveTo(60, cap + 0.5); ctx.lineTo(W - 60, cap + 0.5);
      ctx.moveTo(x0 + 0.5, cap - 60); ctx.lineTo(x0 + 0.5, base + 60);
      ctx.moveTo(x0 + lay.width + 0.5, cap - 60); ctx.lineTo(x0 + lay.width + 0.5, base + 60);
      ctx.moveTo(W / 2 + 0.5, cap - 90); ctx.lineTo(W / 2 + 0.5, base + 90);
      ctx.stroke();
      ctx.restore();
    }
    note(ctx, 'no guessing. on purpose.', noteX, 880, 46, C.coralSoft, prog(tau, land, land + 0.2) > 0 ? writeP(t, T.w4 + land + 0.03, 0.22) : 0, { align: 'right' });
  }
}

/* ---------- scene 4: guessing vs a learning curve (cream) ---------- */
const GX0 = 470, GX1 = 1110, GY0 = 560, GY1 = 210, DEMO_Y = 806, SQ = 44;
const EASE = bezierEase(0.65, 0, 0.35, 1);
function graphCard(ctx, t) {
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  const ink = C.ink;
  // axes
  const ax = eOutCubic(prog(t, T.s4, T.s4 + 0.32));
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(GX0, GY0); ctx.lineTo(lerp(GX0, GX1 + 30, ax), GY0);
  ctx.moveTo(GX0, GY0); ctx.lineTo(GX0, lerp(GY0, GY1 - 30, ax));
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = ax;
  for (let k = 1; k <= 10; k++) {
    const x = GX0 + ((GX1 - GX0) * k) / 10;
    ctx.beginPath(); ctx.moveTo(x, GY0); ctx.lineTo(x, GY0 + 7); ctx.stroke();
    const y = GY0 - ((GY0 - GY1) * k) / 10;
    ctx.beginPath(); ctx.moveTo(GX0, y); ctx.lineTo(GX0 - 7, y); ctx.stroke();
  }
  ctx.font = '17px Mono';
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.fillText('RESULT', GX0 - 4, GY1 - 44);
  ctx.textAlign = 'right';
  ctx.fillText('POSTS →', GX1 + 30, GY0 + 34);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 0.55 * ax;
  ctx.font = '14px Mono';
  ctx.fillText('ILLUSTRATIVE', GX1 + 60, GY0 + 4);
  ctx.restore();

  // the curve: a straight line first, then the learning curve
  const morph = eInOutCubic(prog(t, 7.0, 7.32));
  const draw = eOutCubic(prog(t, T.s4 + 0.22, T.s4 + 0.5));
  if (draw > 0) {
    ctx.save();
    ctx.strokeStyle = C.olive;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N * draw; i++) {
      const u = i / N;
      const y = lerp(u, EASE(u), morph);
      const X = lerp(GX0, GX1, u), Y = lerp(GY0, GY1, y);
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // demo baseline
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.globalAlpha = ax;
  ctx.beginPath();
  ctx.moveTo(GX0 - 20, DEMO_Y + SQ / 2 + 1);
  ctx.lineTo(lerp(GX0 - 20, GX1 + 44, ax), DEMO_Y + SQ / 2 + 1);
  ctx.stroke();
  ctx.restore();

  // two runs of the square: linear, then the learning curve. The graph and the square share one timing function.
  const run = (a, b, ease, label) => {
    const u = prog(t, a, b);
    const ghosts = label === 'lin' ? 1 - prog(t, 7.0, 7.18) : 1;
    // outline drawings at equal time steps
    for (let k = 0; k <= 10; k++) {
      const uk = k / 10;
      if (uk > u + 1e-6) break;
      const p = ease(uk);
      ctx.save();
      ctx.globalAlpha = 0.5 * ghosts;
      ctx.strokeStyle = label === 'lin' ? C.red : C.olive;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(lerp(GX0, GX1, p) - SQ / 2, DEMO_Y - SQ / 2, SQ, SQ);
      ctx.restore();
    }
    if (u <= 0 || (label === 'lin' && t > 6.98)) return null;
    const p = ease(u);
    return { u, p };
  };
  const a1 = run(6.04, 6.94, (x) => x, 'lin');
  const a2 = run(7.32, 8.18, EASE, 'ease');
  const cur = a2 || a1;
  let sqX = GX0, show = t > T.s4 + 0.4;
  if (cur) sqX = lerp(GX0, GX1, cur.p);
  else if (t > 6.94 && t < 7.32) sqX = lerp(GX1, GX0, eInOutCubic(prog(t, 6.98, 7.3))); // back to the start
  else if (t >= 8.18) sqX = GX1;
  if (show) {
    ctx.save();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.roundRect(sqX - SQ / 2, DEMO_Y - SQ / 2, SQ, SQ, 5);
    ctx.fill();
    ctx.restore();
    // the tracer on the graph, and its guides to the axes
    if (cur) {
      const X = lerp(GX0, GX1, cur.u), Y = lerp(GY0, GY1, cur.p);
      ctx.save();
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(X, Y); ctx.lineTo(X, GY0);
      ctx.moveTo(X, Y); ctx.lineTo(GX0, Y);
      ctx.moveTo(sqX, DEMO_Y - SQ / 2 - 6); ctx.lineTo(sqX, GY0 + 8);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(X, Y, 8, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
    }
  }

  // notes: guessing is linear (crossed out), memory is a curve
  const nx = 1250, ny = 300;
  note(ctx, 'guessing = linear', nx, ny, 52, C.red, writeP(t, 6.3, 0.34));
  arrow(ctx, [[nx - 14, ny - 14], [nx - 70, ny - 26], [nx - 120, ny - 30], [nx - 168, ny - 44]], eOutCubic(prog(t, 6.6, 6.8)), C.red, { seed: 11 });
  const sc = eOutCubic(prog(t, 7.08, 7.22));
  if (sc > 0) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([lerp(nx - 8, nx + 340, u), ny - 16 + 6 * Math.sin(u * 9) - 4 * u]); }
    brush(ctx, pts, sc, 4, 3, C.red);
  }
  note(ctx, 'with memory ✓', nx + 10, ny + 74, 58, C.olive, writeP(t, 7.2, 0.34), { weight: 700 });
  note(ctx, 'every post, sharper', GX1 + 110, DEMO_Y + 12, 50, C.olive, writeP(t, 7.6, 0.32));
  arrow(ctx, [[GX1 + 100, DEMO_Y - 2], [GX1 + 76, DEMO_Y - 28], [GX1 + 52, DEMO_Y - 40], [GX1 + 30, DEMO_Y - 30]], eOutCubic(prog(t, 7.86, 8.04)), C.olive, { seed: 13 });
}

/* ---------- scene 5: a pattern moving through memory (dark) ---------- */
const FIELD = { cols: 46, rows: 21, gap: 46 };
let CHAIN = null;
function leader(tt) {
  // a fluid sweep across the plane that changes direction, then curls back to the centre as the field folds
  const u = clamp((tt - 8.3) / 2.6);
  const out = eInOutSine(clamp(u / 0.78)), back = eInOutSine(prog(u, 0.74, 1));
  const x = -1000 + 1760 * out - 760 * back + 120 * Math.sin(u * Math.PI * 3) * (1 - back);
  const z = (330 * Math.sin(u * Math.PI * 2.2 + 0.4) + 90 * Math.sin(u * Math.PI * 6.1)) * (1 - back);
  return [x, z];
}
function buildField() {
  // follow-through: each point is a damped spring chasing the one ahead of it
  const N = 22, dt = 1 / 480, t0 = 8.2, t1 = 11.25;
  const steps = Math.ceil((t1 - t0) / dt);
  const pos = Array.from({ length: N }, () => leader(t0).slice());
  const vel = Array.from({ length: N }, () => [0, 0]);
  // the coral echo: a short, softer chain hanging off the main one, so it answers later and swings wider
  const coral = Array.from({ length: 9 }, () => ({ p: leader(t0).slice(), v: [0, 0] }));
  const off = [26, 34];
  const frames = [];
  for (let s = 0; s <= steps; s++) {
    const tt = t0 + s * dt;
    pos[0] = leader(tt);
    for (let i = 1; i < N; i++) {
      const k = 520 - i * 12, c = 30;
      for (const d of [0, 1]) {
        const a = k * (pos[i - 1][d] - pos[i][d]) - c * vel[i][d];
        vel[i][d] += a * dt;
        pos[i][d] += vel[i][d] * dt;
      }
    }
    coral.forEach((q, j) => {
      const target = j === 0 ? pos[9] : coral[j - 1].p;
      const k = j === 0 ? 150 : 300, c = j === 0 ? 12 : 22;
      for (const d of [0, 1]) {
        const a = k * (target[d] + (j === 0 ? off[d] : 0) - q.p[d]) - c * q.v[d];
        q.v[d] += a * dt;
        q.p[d] += q.v[d] * dt;
      }
    });
    if (s % 4 === 0) frames.push({ tt, chain: pos.map((p) => p.slice()), coral: coral.map((q) => q.p.slice()) });
  }
  CHAIN = { frames, t0, dt: dt * 4 };
}
function chainAt(t) {
  const f = (t - CHAIN.t0) / CHAIN.dt;
  const i = clamp(Math.floor(f), 0, CHAIN.frames.length - 2), u = clamp(f - i);
  const A = CHAIN.frames[i], B = CHAIN.frames[i + 1];
  const li = (a, b) => a.map((p, k) => [lerp(p[0], b[k][0], u), lerp(p[1], b[k][1], u)]);
  return { chain: li(A.chain, B.chain), coral: li(A.coral, B.coral) };
}
function project(x, z, tilt, yaw, cx = W / 2, cy = 486) {
  const X1 = x * Math.cos(yaw) + z * Math.sin(yaw), Z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const Y = -Z1 * Math.sin(tilt), Z = Z1 * Math.cos(tilt) + 1700;
  const f = 1500 / Z;
  return [cx + X1 * f, cy + Y * f, f];
}
function sceneField(ctx, t) {
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, W, H);
  if (t < 8.2) return;
  const yaw = lerp(-0.16, 0.13, eInOutSine(prog(t, 8.3, 11.0)));
  const fold = eInCubic(prog(t, T.fold, 11.04));
  const tilt = lerp(lerp(1.08, 1.18, eInOutSine(prog(t, 8.3, 10.6))), 0.0, fold);
  const appear = eOutCubic(prog(t, 8.3, 8.75));
  const { chain, coral } = chainAt(t);
  const shrink = eInCubic(prog(t, 10.98, 11.14));
  const sx = (x) => lerp(x, W / 2, shrink);
  // the field: dim posts, brighter where the pattern passes
  for (let r = 0; r < FIELD.rows; r++) for (let c = 0; c < FIELD.cols; c++) {
    const x = (c - (FIELD.cols - 1) / 2) * FIELD.gap, z = (r - (FIELD.rows - 1) / 2) * FIELD.gap;
    let near = 0;
    for (let i = 0; i < chain.length; i += 2) { const d = Math.hypot(chain[i][0] - x, chain[i][1] - z); near = Math.max(near, 1 - d / 150); }
    const [px, py, f] = project(x, z, tilt, yaw);
    const delay = clamp(((c / FIELD.cols) * 0.6 + (r / FIELD.rows) * 0.4) * 0.35);
    const a = (0.19 + 0.5 * Math.max(0, near)) * clamp((appear - delay) / 0.4);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = near > 0.25 ? C.limeHi : C.cream;
    ctx.beginPath();
    ctx.arc(sx(px), py, Math.max(0.9, 2.3 * f), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const show = eOutCubic(prog(t, 8.45, 8.7));
  // the chain
  const pts = chain.map(([x, z]) => project(x, z, tilt, yaw));
  ctx.save();
  ctx.globalAlpha = 0.55 * show;
  ctx.strokeStyle = C.lime;
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), y) : ctx.moveTo(sx(x), y)));
  ctx.stroke();
  ctx.restore();
  // coral: the delayed second response
  const cps = coral.map(([x, z]) => project(x, z, tilt, yaw));
  const cshow = show * clamp((t - 8.7) / 0.35);
  ctx.save();
  ctx.globalAlpha = 0.5 * cshow;
  ctx.strokeStyle = C.coral;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  cps.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), y) : ctx.moveTo(sx(x), y)));
  ctx.stroke();
  ctx.restore();
  cps.forEach(([x, y, f], i) => {
    ctx.globalAlpha = cshow * lerp(0.95, 0.5, i / cps.length);
    ctx.fillStyle = C.coral;
    ctx.beginPath();
    ctx.arc(sx(x), y, lerp(5.5, 2.8, i / cps.length) * f, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, y, f] = pts[i];
    const r = (i === 0 ? 11 : lerp(8, 3.5, i / pts.length)) * f;
    ctx.globalAlpha = show * (i === 0 ? 1 : lerp(1, 0.55, i / pts.length));
    if (i === 0) {
      const gr = ctx.createRadialGradient(sx(x), y, 0, sx(x), y, r * 4);
      gr.addColorStop(0, rgba(C.lime, 0.35));
      gr.addColorStop(1, rgba(C.lime, 0));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(sx(x), y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.arc(sx(x), y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // notes, pinned to where the pattern is when they are written
  const fadeN = 1 - prog(t, 10.6, 10.84);
  const at = (tt) => { const c = chainAt(tt); const p = project(c.chain[0][0], c.chain[0][1], lerp(1.08, 1.18, eInOutSine(prog(tt, 8.3, 10.6))), lerp(-0.16, 0.13, eInOutSine(prog(tt, 8.3, 11.0)))); return p; };
  const pA = at(9.55);
  note(ctx, 'a pattern, matched', pA[0] - 170, pA[1] - 140, 50, C.limeHi, writeP(t, 9.3, 0.34), { align: 'right', alpha: fadeN });
  arrow(ctx, [[pA[0] - 160, pA[1] - 128], [pA[0] - 100, pA[1] - 128], [pA[0] - 50, pA[1] - 90], [pA[0] - 22, pA[1] - 34]], eOutCubic(prog(t, 9.6, 9.8)), C.limeHi, { seed: 17, alpha: fadeN });
  const cB = chainAt(10.15).coral[0];
  const pB = project(cB[0], cB[1], lerp(1.08, 1.18, eInOutSine(prog(10.15, 8.3, 10.6))), lerp(-0.16, 0.13, eInOutSine(prog(10.15, 8.3, 11.0))));
  note(ctx, 'risky offer, flagged', pB[0] + 70, pB[1] + 110, 46, C.coralSoft, writeP(t, 10.0, 0.3), { alpha: fadeN });
  arrow(ctx, [[pB[0] + 62, pB[1] + 92], [pB[0] + 40, pB[1] + 70], [pB[0] + 22, pB[1] + 46], [pB[0] + 10, pB[1] + 18]], eOutCubic(prog(t, 10.28, 10.44)), C.coralSoft, { seed: 29, alpha: fadeN });
  // the folded field becomes a line, and the line becomes a point
  if (fold > 0.85) {
    ctx.save();
    ctx.globalAlpha = prog(fold, 0.85, 1) * (1 - shrink * 0.2);
    ctx.strokeStyle = C.limeHi;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx(140), 486);
    ctx.lineTo(sx(W - 140), 486);
    ctx.stroke();
    ctx.restore();
  }
}

/* ---------- scene 6: the fit ring, anticipation, release (dark) ---------- */
const RC = [W / 2, 486];
const RING_R = 210;
function ringProgress(t) { return 0.96 * eInOutCubic(prog(t, 11.32, 12.64)); }
function ringActivation(k) {
  // the time the progress arc passes dot k
  const target = k / 24;
  if (target > 0.96) return 99;
  let lo = 11.32, hi = 12.64;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ringProgress(m) < target) lo = m; else hi = m; }
  return hi;
}
function sceneRing(ctx, t) {
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, W, H);
  const [cx, cy] = RC;
  const p = ringProgress(t);
  const ant = eOutCubic(prog(t, 12.6, T.rel)); // drawing back
  const rel = prog(t, T.rel, T.s7); // release
  const push = 1 + 0.9 * eInQuad(rel); // everything blown outwards on release
  const fadeOut = 1 - prog(rel, 0.15, 0.7);
  const intro = (d) => spring(t - 11.06 - d, 2.4, 0.62);
  const rot = (t - 11.1) * 0.12;
  ctx.save();
  ctx.translate(cx, cy);
  const inward = 1 - 0.035 * ant;
  ctx.globalAlpha = fadeOut;
  // concentric guides
  const circ = (r, a, dash, rr = 0) => {
    ctx.save();
    ctx.rotate(rr);
    ctx.strokeStyle = rgba(C.cream, a);
    ctx.lineWidth = 1.2;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  circ(108 * intro(0.02) * inward * push, 0.2, [3, 7], rot);
  circ(160 * intro(0.06) * inward * push, 0.12);
  circ(262 * intro(0.1) * inward * push, 0.1);
  // radial ticks, turning slowly the other way
  const tr = 300 * intro(0.12) * inward * push;
  ctx.save();
  ctx.rotate(-rot * 0.6);
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    const long = k % 6 === 0;
    ctx.strokeStyle = rgba(C.cream, long ? 0.42 : 0.2);
    ctx.lineWidth = long ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * tr, Math.sin(a) * tr);
    ctx.lineTo(Math.cos(a) * (tr + (long ? 16 : 8)), Math.sin(a) * (tr + (long ? 16 : 8)));
    ctx.stroke();
  }
  ctx.restore();
  // ring of dots: each lights when the arc reaches it
  for (let k = 0; k < 24; k++) {
    const a = -Math.PI / 2 + (k / 24) * Math.PI * 2;
    const r = RING_R * intro(0.08 + k * 0.004) * inward * push;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    const on = spring(t - ringActivation(k), 3.4, 0.5);
    if (on > 0.01) {
      ctx.fillStyle = C.lime;
      ctx.beginPath();
      ctx.arc(x, y, 7.5 * on, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(C.cream, 0.35 * (1 - clamp(on)));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // progress arc with a bright head
  const R = 334 * intro(0.14) * inward * push;
  ctx.strokeStyle = rgba(C.cream, 0.1);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  if (p > 0) {
    ctx.strokeStyle = C.lime;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    const ha = -Math.PI / 2 + p * Math.PI * 2;
    const gr = ctx.createRadialGradient(Math.cos(ha) * R, Math.sin(ha) * R, 0, Math.cos(ha) * R, Math.sin(ha) * R, 30);
    gr.addColorStop(0, rgba(C.limeHi, 0.7));
    gr.addColorStop(1, rgba(C.limeHi, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(Math.cos(ha) * R, Math.sin(ha) * R, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // the number, synced to the arc
  const numA = clamp((t - 11.2) / 0.2) * fadeOut;
  if (numA > 0) {
    ctx.save();
    ctx.globalAlpha = numA;
    ctx.fillStyle = C.cream;
    ctx.font = '84px Anton';
    ctx.textAlign = 'center';
    const n = Math.round(p * 100);
    ctx.fillText(String(n), cx - 22, cy + 334 + 120);
    ctx.font = '20px Mono';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(C.cream, 0.7);
    ctx.fillText('FIT', cx + (n >= 10 ? 26 : 8), cy + 334 + 118);
    ctx.font = '14px Mono';
    ctx.fillStyle = rgba(C.cream, 0.45);
    ctx.fillText('SAMPLE', cx + (n >= 10 ? 26 : 8), cy + 334 + 94);
    ctx.restore();
  }
  note(ctx, 'creator fit', cx + 120, cy + 334 + 92, 46, C.limeHi, writeP(t, 12.0, 0.3), { alpha: fadeOut });
  note(ctx, 'ready', cx - 210, cy - 90, 46, C.limeHi, writeP(t, 12.56, 0.2), { align: 'right', alpha: fadeOut });
  arrow(ctx, [[cx - 200, cy - 82], [cx - 150, cy - 70], [cx - 90, cy - 54], [cx - 50, cy - 28]], eOutCubic(prog(t, 12.66, 12.82)), C.limeHi, { seed: 19, alpha: fadeOut });

  // the last of the field's line, contracting into the centre
  const lineLeft = 1 - eInCubic(prog(t, 10.98, 11.14));
  if (lineLeft > 0) {
    ctx.save();
    ctx.strokeStyle = C.limeHi;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lerp(cx, 140, lineLeft), cy);
    ctx.lineTo(lerp(cx, W - 140, lineLeft), cy);
    ctx.stroke();
    ctx.restore();
  }
  // the centre dot: draws back (anticipation), then lets go and opens into the final page
  const cdIn = intro(0);
  if (rel <= 0) {
    const s = 1 - 0.38 * ant;
    ctx.save();
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30 * cdIn * (s + 0.2 * ant), 30 * cdIn * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    const r = lerp(30 * 0.62, 1250, eInQuad(rel) * 0.15 + eInCubic(rel) * 0.85);
    ctx.save();
    ctx.fillStyle = mix(C.lime, C.cream, clamp(rel / 0.25));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- scene 7: the signature (cream) ---------- */
function finalDot() {
  const F = L.fin, g = 5200, y0 = -60, by = F.b2 - FR, t0 = 13.38;
  const fall = Math.sqrt((2 * (by - y0)) / g), v1 = g * fall;
  const t1 = t0 + fall, dc1 = 0.03, v2 = v1 * 0.32, T2 = (2 * v2) / g, t2 = t1 + dc1 + T2, dc2 = 0.018;
  return { g, y0, by, t0, v1, t1, dc1, v2, t2, dc2 };
}
function sceneFinal(ctx, t) {
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  const F = L.fin;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, F.b2 + 2);
  ctx.clip();
  F.l2.glyphs.forEach((g, i) => {
    const tau = t - (13.14 + 0.045 * i);
    if (tau <= 0) return;
    const s = spring(tau, 2.4, 0.6);
    ctx.save();
    ctx.translate(F.left + g.x + g.w / 2, F.b2 + (1 - s) * 420);
    ctx.rotate((1 - s) * (i % 2 ? 1 : -1) * 0.14);
    glyph(ctx, g, 440, C.ink);
    ctx.restore();
  });
  ctx.restore();
  F.l1.glyphs.forEach((g, i) => {
    if (g.ch === ' ') return;
    const tau = t - (13.3 + 0.016 * i);
    if (tau <= 0) return;
    const s = spring(tau, 2.9, 0.66);
    ctx.save();
    ctx.globalAlpha = clamp(tau / 0.07);
    ctx.translate(F.left + g.x + g.w / 2, F.b1 - (1 - s) * 90);
    ctx.rotate((1 - s) * (i % 3 === 0 ? 0.1 : i % 3 === 1 ? -0.07 : 0.05));
    glyph(ctx, g, F.f1px, C.ink);
    ctx.restore();
  });
  // the dot drops in after the type and settles as the period
  const { g, y0, by, t0, v1, t1, dc1, v2, t2, dc2 } = finalDot();
  let s = null;
  if (t >= t0 && t < t1) { const d = t - t0, vy = g * d, k = clamp(vy / 2700) * 0.32; s = { x: F.dotX, y: y0 + 0.5 * g * d * d, sx: 1 / (1 + 0.6 * k), sy: 1 + k, ang: 0 }; }
  else if (t >= t1 && t < t1 + dc1) { const u = (t - t1) / dc1, A = 0.4 * Math.sin(Math.PI * u); s = { x: F.dotX, y: F.b2 - FR * (1 - A), sx: 1 + 0.9 * A, sy: 1 - A, ang: 0 }; }
  else if (t >= t1 + dc1 && t < t2) { const d = t - t1 - dc1; s = { x: F.dotX, y: by - (v2 * d - 0.5 * g * d * d), sx: 1, sy: 1, ang: 0 }; }
  else if (t >= t2 && t < t2 + dc2) { const u = (t - t2) / dc2, A = 0.14 * Math.sin(Math.PI * u); s = { x: F.dotX, y: F.b2 - FR * (1 - A), sx: 1 + 0.9 * A, sy: 1 - A, ang: 0 }; }
  else if (t >= t2 + dc2) s = { x: F.dotX, y: by, sx: 1, sy: 1, ang: 0 };
  dot(ctx, s, { r: FR });
  note(ctx, 'trycreosi.com', F.dotX - 120, F.b2 + 132, 58, C.olive, writeP(t, 14.02, 0.4), { weight: 700, align: 'right', rot: -0.03 });
  arrow(ctx, [[F.dotX - 100, F.b2 + 112], [F.dotX - 40, F.b2 + 112], [F.dotX + 10, F.b2 + 90], [F.dotX + 4, F.b2 + 36]], eOutCubic(prog(t, 14.36, 14.56)), C.olive, { seed: 23 });
}

/* ---------- one frame of the film ---------- */
function draw(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (t < T.s3) return sceneOpen(ctx, t);
  if (t < T.s4) return sceneWords(ctx, t);
  if (t < T.exit) return graphCard(ctx, t);
  if (t < T.s6) {
    // the graph leaves fast to the left and uncovers the field
    sceneField(ctx, t);
    const dx = -2300 * eInCubic(prog(t, T.exit, T.s5));
    if (dx > -2290) { ctx.save(); ctx.translate(dx, 0); graphCard(ctx, Math.min(t, 8.199)); ctx.restore(); }
    return;
  }
  if (t < T.s7) return sceneRing(ctx, t);
  return sceneFinal(ctx, t);
}

/* ---------- chrome: timecode, timeline, registration marks (drawn once per frame, never blurred) ---------- */
const KEYS = [0.12, 2.05, T.s3, T.w2, T.w3, T.w4, T.s4, 7.0, T.s5, 9.3, T.fold, T.s6, T.rel, T.s7, 14.02];
const LABELS = [[0, 'POST'], [2.0, 'LAYER'], [T.s3, 'VERBS'], [T.s4, 'CURVE'], [T.s5, 'MEMORY'], [T.s6, 'FIT'], [T.s7, 'CREO']];
function theme(tf) {
  if (tf < T.s3) return 'light';
  if (tf < T.s4) return 'dark';
  if (tf < 8.3) return 'light';
  if (tf < 13.16) return 'dark';
  return 'light';
}
function chrome(ctx, tf) {
  const light = theme(tf) === 'light';
  const fg = (a) => (light ? rgba(C.ink, a) : rgba(C.cream, a));
  const accent = light ? C.olive : C.lime;
  const fr = Math.round(tf * FPS);
  const tc = `00:00:${String(Math.floor(fr / FPS)).padStart(2, '0')}:${String(fr % FPS).padStart(2, '0')}`;
  ctx.save();
  ctx.font = '19px Mono';
  ctx.textAlign = 'right';
  ctx.fillStyle = fg(0.6);
  ctx.fillText(tc, W - 112, 70);
  ctx.textAlign = 'left';
  ctx.fillStyle = fg(0.45);
  ctx.fillText('CREO / MOTION NOTES', 112, 70);
  // registration marks
  for (const [x, y] of [[56, 56], [W - 56, 56]]) {
    ctx.strokeStyle = fg(0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16);
    ctx.stroke();
  }
  // timeline
  const x0 = 112, x1 = W - 112, y = 1010;
  const X = (s) => lerp(x0, x1, s / DUR);
  ctx.strokeStyle = fg(0.28);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y + 0.5);
  ctx.lineTo(x1, y + 0.5);
  for (let s = 0; s <= DUR * 2; s++) {
    const xx = Math.round(X(s / 2)) + 0.5;
    const h = s % 2 === 0 ? 8 : 4;
    ctx.moveTo(xx, y - h); ctx.lineTo(xx, y);
  }
  ctx.stroke();
  ctx.strokeStyle = fg(0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y + 0.5);
  ctx.lineTo(X(tf), y + 0.5);
  ctx.stroke();
  ctx.font = '12px Mono';
  ctx.fillStyle = fg(0.4);
  for (const [s, lab] of LABELS) ctx.fillText(lab, X(s) + 4, y + 22);
  for (const k of KEYS) {
    const kx = X(k), passed = k <= tf;
    ctx.save();
    ctx.translate(kx, y - 14);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = passed ? accent : 'transparent';
    ctx.strokeStyle = passed ? accent : fg(0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(-3.5, -3.5, 7, 7);
    if (passed) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const px = X(tf);
  ctx.fillStyle = fg(0.85);
  ctx.fillRect(Math.round(px) - 0.5, y - 26, 1.5, 32);
  ctx.beginPath();
  ctx.moveTo(px - 6, y - 32);
  ctx.lineTo(px + 6, y - 32);
  ctx.lineTo(px, y - 25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ---------- paper: grain and a soft vignette, after the blur ---------- */
const grains = [];
function makeGrain() {
  const r = rng(77);
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    const img = g.createImageData(512, 512);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() + r() + r() - 1.5) * 70;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grains.push(c);
  }
}
function post(ctx, tf) {
  const light = theme(tf) === 'light';
  const fr = Math.round(tf * FPS);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = light ? 0.06 : 0.085;
  const gc = grains[fr % grains.length];
  const ox = (fr * 97) % 512, oy = (fr * 61) % 512;
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(gc, x, y);
  ctx.restore();
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, light ? 'rgba(60,50,20,0.14)' : 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  chrome(ctx, tf);
}

/* ---------- render ---------- */
const out = document.getElementById('out');
const octx = out.getContext('2d');
const scratch = document.createElement('canvas');
scratch.width = W; scratch.height = H;
const sctx = scratch.getContext('2d', { willReadFrequently: true });
const LIN = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const LUTN = 65535;
const ENC = new Uint8ClampedArray(LUTN + 1).map((_, i) => { const l = i / LUTN; const c = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055; return Math.round(c * 255); });
const acc = new Float32Array(W * H * 3);

/** Sub-frames per frame: more where things move fastest, so blur is a smear and never a row of copies. */
function samplesFor(tf) {
  if (tf >= T.exit - 0.02 && tf <= T.s5 + 0.02) return 40;
  if (tf >= T.rel - 0.02 && tf <= T.s7 + 0.04) return 32;
  if (tf >= T.w4 - 0.02 && tf <= T.w4 + 0.12) return 32;
  if (tf >= 10.95 && tf <= 11.2) return 24;
  return 16;
}
function renderFrame(i, S) {
  const tf = i / FPS;
  S = S || samplesFor(tf);
  acc.fill(0);
  for (let k = 0; k < S; k++) {
    const t = Math.max(0, tf + ((k + 0.5) / S - 0.5) * SHUTTER);
    draw(sctx, t);
    const d = sctx.getImageData(0, 0, W, H).data;
    for (let p = 0, q = 0; p < d.length; p += 4, q += 3) { acc[q] += LIN[d[p]]; acc[q + 1] += LIN[d[p + 1]]; acc[q + 2] += LIN[d[p + 2]]; }
  }
  const img = octx.createImageData(W, H);
  const o = img.data;
  const k = LUTN / S;
  for (let p = 0, q = 0; p < o.length; p += 4, q += 3) { o[p] = ENC[Math.round(acc[q] * k)]; o[p + 1] = ENC[Math.round(acc[q + 1] * k)]; o[p + 2] = ENC[Math.round(acc[q + 2] * k)]; o[p + 3] = 255; }
  octx.putImageData(img, 0, 0);
  post(octx, tf);
}
function renderStill(t) {
  draw(octx, t);
  post(octx, t);
}

window.CREO = {
  ready: (async () => {
    await Promise.all(['100px Anton', '500 40px Hand', '700 40px Hand', '20px Mono'].map((f) => document.fonts.load(f)));
    init(sctx);
    makeGrain();
    return true;
  })(),
  renderFrame,
  renderStill,
  png: () => out.toDataURL('image/png'),
  jpeg: (q = 0.92) => out.toDataURL('image/jpeg', q),
  events: () => EVENTS,
  meta: { W, H, FPS, DUR, NF, T },
};
