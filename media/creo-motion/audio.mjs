// Synthesises the soundtrack from events.json (written by the renderer, from the same numbers as the picture).
// Output: audio.wav, 48 kHz, stereo, 24-bit. No samples, no voice: oscillators, filtered noise and a small reverb.
import fs from 'node:fs';

const SR = 48000, DUR = 15, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const sendL = new Float32Array(N), sendR = new Float32Array(N); // reverb send
const events = JSON.parse(fs.readFileSync('events.json', 'utf8'));

let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Biquad band-pass / low-pass / high-pass with per-sample frequency. */
function biquad(type) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = 0.8) => {
    const w = (TAU * clamp(f, 20, SR * 0.45)) / SR, cs = Math.cos(w), sn = Math.sin(w), a = sn / (2 * q);
    let b0, b1, b2;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const a0 = 1 + a, a1 = -2 * cs, a2 = 1 - a;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
function add(t0, len, fn, { pan = 0, gain = 1, send = 0 } = {}) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR, i);
    L[k] += v * gl; R[k] += v * gr;
    if (send) { sendL[k] += v * gl * send; sendR[k] += v * gr * send; }
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

/* ---------- instruments ---------- */
function tap(t, v, pan = 0) {
  // a soft felt thump: falling sine with a tiny click on top
  const f0 = 150 + 80 * v;
  let ph = 0;
  const bp = biquad('bp');
  add(t - 0.002, 0.26, (s) => {
    const f = f0 * (0.55 + 0.45 * Math.exp(-s / 0.03));
    ph += (TAU * f) / SR;
    const body = Math.sin(ph) * env(s, 0.002, 0.07);
    const click = bp(noise(), 3800, 1.2) * Math.exp(-s / 0.004) * 0.6;
    return (body + click) * (0.25 + 0.75 * v);
  }, { pan, gain: 0.55, send: 0.18 });
}
function swish(t, v, up = true, len = 0.24, pan = 0) {
  const bp = biquad('bp');
  add(t - 0.04, len, (s) => {
    const u = s / len;
    const f = up ? 700 * Math.pow(6, u) : 4600 * Math.pow(1 / 5, u);
    const a = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.6;
    return bp(noise(), f, 1.6) * a;
  }, { pan, gain: 0.32 * v, send: 0.1 });
}
function pen(t, v, len = 0.32) {
  const bp = biquad('bp'), hp = biquad('hp');
  let ph = rnd() * 6;
  add(t, len, (s) => {
    ph += (TAU * (16 + 6 * Math.sin(s * 9))) / SR;
    const flutter = 0.55 + 0.45 * Math.sin(ph) ** 2;
    const a = Math.min(1, s / 0.03) * Math.min(1, (len - s) / 0.06);
    return hp(bp(noise(), 3600 + 900 * Math.sin(s * 23), 0.9), 1800) * flutter * a;
  }, { gain: 0.07 * v, pan: 0.15 });
}
function tick(t, v, f = 2400, pan = 0) {
  add(t, 0.05, (s) => Math.sin(TAU * f * s) * Math.exp(-s / 0.008) + noise() * Math.exp(-s / 0.002) * 0.3, { pan, gain: 0.22 * v, send: 0.12 });
}
function stretch(t, v) {
  let ph = 0;
  const lp = biquad('lp');
  add(t, 0.2, (s) => {
    const u = s / 0.2;
    const f = 170 + 260 * (1 - (1 - u) ** 3) + 6 * Math.sin(s * 70);
    ph += (TAU * f) / SR;
    return lp(Math.sin(ph) + 0.35 * Math.sin(2 * ph), 1400) * Math.min(1, s / 0.02) * (0.6 + 0.4 * u);
  }, { gain: 0.11 * v, send: 0.12 });
}
function boing(t, v) {
  let ph = 0;
  const lp = biquad('lp');
  add(t, 0.5, (s) => {
    const wob = Math.exp(-s / 0.12) * Math.sin(TAU * 17 * s);
    const f = 160 + 270 * Math.exp(-s / 0.05) + 60 * wob;
    ph += (TAU * f) / SR;
    return lp(Math.sin(ph) + 0.3 * Math.sin(2 * ph), 1800) * env(s, 0.004, 0.14);
  }, { gain: 0.11 * v, send: 0.16 });
}
function spin(t, v) {
  const bp = biquad('bp');
  add(t, 0.42, (s) => {
    const u = s / 0.42;
    const rate = 22 - 15 * u;
    const am = 0.5 + 0.5 * Math.sin(TAU * rate * s);
    return bp(noise(), 1200 + 1400 * Math.sin(Math.PI * u), 2.2) * am * Math.sin(Math.PI * Math.min(1, u * 1.1));
  }, { gain: 0.3 * v, send: 0.12, pan: -0.1 });
}
function snap(t, v) {
  // dry: no reverb send at all
  const hp = biquad('hp');
  let ph = 0;
  add(t - 0.001, 0.12, (s) => {
    ph += (TAU * (90 * Math.exp(-s / 0.03) + 48)) / SR;
    const thud = Math.sin(ph) * Math.exp(-s / 0.025);
    const crack = hp(noise(), 2500) * Math.exp(-s / 0.0035);
    return thud * 0.9 + crack * 1.1;
  }, { gain: 0.95 * v });
}
function draw(t, v, len = 0.36) {
  const bp = biquad('bp');
  add(t, len, (s) => bp(noise(), 2600, 0.7) * Math.sin(Math.PI * (s / len)) ** 2, { gain: 0.05 * v });
}
function scribble(t, v) {
  for (let k = 0; k < 3; k++) pen(t + k * 0.05, v * (1 - k * 0.2), 0.07);
}
function whoosh(t, v) {
  const lp = biquad('lp');
  const len = 0.36;
  add(t - 0.06, len, (s) => {
    const u = s / len;
    return lp(noise(), 300 + 5200 * Math.sin(Math.PI * Math.min(1, u * 1.2))) * Math.sin(Math.PI * u) ** 1.4;
  }, { gain: 0.42 * v, pan: -0.35, send: 0.1 });
}
function air(t, v, len) {
  // the particle field: breath of filtered noise that follows the sweep, with a faint high shimmer
  const bp = biquad('bp'), bp2 = biquad('bp');
  add(t, len, (s) => {
    const u = s / len;
    const sweep = 0.5 - 0.5 * Math.cos(Math.PI * 2 * Math.min(1, u * 1.05));
    const a = Math.min(1, s / 0.5) * Math.min(1, (len - s) / 0.4);
    const shimmer = (Math.sin(TAU * 2637 * s) + Math.sin(TAU * 3136 * s + 1) * 0.7) * 0.03 * (0.5 + 0.5 * Math.sin(TAU * 0.9 * s));
    return (bp(noise(), 500 + 1500 * sweep, 0.9) * 0.9 + bp2(noise(), 4200, 3) * 0.15 + shimmer) * a;
  }, { gain: 0.12 * v, send: 0.25 });
}
function fold(t, v) {
  const lp = biquad('lp');
  add(t, 0.38, (s) => { const u = s / 0.38; return lp(noise(), 3200 * (1 - u) + 200) * Math.sin(Math.PI * u); }, { gain: 0.22 * v, send: 0.15 });
}
const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98, 1760];
function blip(t, v, k) {
  const f = PENTA[k % PENTA.length] * (k >= PENTA.length ? 2 : 1) * (k >= 2 * PENTA.length ? 1 : 1);
  add(t, 0.22, (s) => (Math.sin(TAU * f * s) + 0.2 * Math.sin(TAU * 2 * f * s)) * env(s, 0.003, 0.05), { gain: 0.07 * v, send: 0.3, pan: Math.sin(k * 0.6) * 0.4 });
}
function inhale(t, v) {
  const bp = biquad('bp');
  add(t, 0.2, (s) => { const u = s / 0.2; return bp(noise(), 600 + 2400 * u * u, 1.5) * u * u; }, { gain: 0.3 * v, send: 0.1 });
}
function release(t, v) {
  let ph = 0;
  const lp = biquad('lp');
  add(t - 0.005, 0.6, (s) => {
    ph += (TAU * (70 + 140 * Math.exp(-s / 0.04))) / SR;
    const pop = Math.sin(ph) * Math.exp(-s / 0.06);
    const wash = lp(noise(), 6000 * Math.exp(-s / 0.18) + 300) * env(s, 0.01, 0.16) * 0.6;
    return pop + wash;
  }, { gain: 0.45 * v, send: 0.25 });
}
function chord(t, v) {
  // a soft, warm D major add9, struck once
  const notes = [146.83, 220, 293.66, 369.99, 440, 659.25];
  add(t, 3.0, (s) => {
    let x = 0;
    notes.forEach((f, i) => { x += (Math.sin(TAU * f * s + i) + 0.12 * Math.sin(TAU * 2 * f * s)) * (1 / (1 + i * 0.35)); });
    return (x / 3.2) * env(s, 0.012, 0.85);
  }, { gain: 0.16 * v, send: 0.35 });
  add(t, 1.6, (s) => Math.sin(TAU * 1760 * s) * env(s, 0.002, 0.35) * 0.4, { gain: 0.05 * v, send: 0.4, pan: 0.2 });
}

/* ---------- a restrained bed ---------- */
function pad(t0, t1, freqs, gain, lpHz) {
  const lpL = biquad('lp'), lpR = biquad('lp');
  const s0 = Math.round(t0 * SR), s1 = Math.round(t1 * SR);
  const len = (s1 - s0) / SR;
  for (let k = s0; k < s1 && k < N; k++) {
    const s = (k - s0) / SR;
    const a = Math.min(1, s / 0.6) * Math.min(1, (len - s) / 0.5);
    let xl = 0, xr = 0;
    freqs.forEach((f, i) => {
      xl += Math.sin(TAU * f * 0.999 * (t0 + s) + i) / freqs.length;
      xr += Math.sin(TAU * f * 1.001 * (t0 + s) + i * 1.7) / freqs.length;
    });
    const breathe = 0.85 + 0.15 * Math.sin(TAU * 0.35 * (t0 + s));
    L[k] += lpL(xl, lpHz) * gain * a * breathe;
    R[k] += lpR(xr, lpHz) * gain * a * breathe;
  }
}
// light pages warm and open, dark pages lower and closer; ends on the same chord as the sign-off
const D = 3.7166666, S4 = 5.6166666;
pad(0, D + 0.05, [146.83, 220, 293.66, 329.63], 0.034, 2200);
pad(D - 0.05, S4 + 0.05, [123.47, 185, 246.94, 293.66], 0.034, 1500);
pad(S4 - 0.05, 8.4, [130.81, 196, 261.63, 329.63], 0.03, 2000);
pad(8.3, 13.25, [110, 164.81, 220, 277.18], 0.034, 1300);
pad(13.15, 15, [146.83, 220, 293.66, 369.99], 0.034, 2400);

/* ---------- play the score ---------- */
for (const e of events) {
  switch (e.type) {
    case 'tap': tap(e.t, e.v, e.t < 3.6 ? -0.4 + 0.8 * clamp(e.t / 2.5, 0, 1) : 0.35); break;
    case 'swishUp': swish(e.t, e.v, true); break;
    case 'swishDown': swish(e.t, e.v, false, 0.3, 0.1); break;
    case 'pen': pen(e.t, e.v); break;
    case 'tick': tick(e.t, e.v, e.t > 3.8 && e.t < 4.1 ? 1500 : 2400, e.t > 6 && e.t < 8.3 ? -0.5 + ((e.t % 0.9) / 0.9) : 0); break;
    case 'stretch': stretch(e.t, e.v); break;
    case 'boing': boing(e.t, e.v); break;
    case 'spin': spin(e.t, e.v); break;
    case 'snap': snap(e.t, e.v); break;
    case 'draw': draw(e.t, e.v); break;
    case 'scribble': scribble(e.t, e.v); break;
    case 'whoosh': whoosh(e.t, e.v); break;
    case 'air': air(e.t, e.v, e.d || 2.5); break;
    case 'fold': fold(e.t, e.v); break;
    case 'blip': blip(e.t, e.v, e.k || 0); break;
    case 'inhale': inhale(e.t, e.v); break;
    case 'release': release(e.t, e.v); break;
    case 'chord': chord(e.t, e.v); break;
  }
}

/* ---------- small stereo reverb on the send (Schroeder: 4 combs + 2 allpasses per side) ---------- */
function reverb(inp, out, delays, ap, fb = 0.78, damp = 0.35, wet = 0.9) {
  const combs = delays.map((d) => ({ buf: new Float32Array(d), i: 0, lp: 0 }));
  const aps = ap.map((d) => ({ buf: new Float32Array(d), i: 0 }));
  for (let k = 0; k < N; k++) {
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.lp = o * (1 - damp) + c.lp * damp;
      c.buf[c.i] = inp[k] + c.lp * fb;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    y /= combs.length;
    for (const a of aps) {
      const o = a.buf[a.i];
      const v = y + o * 0.5;
      a.buf[a.i] = v;
      a.i = (a.i + 1) % a.buf.length;
      y = o - v * 0.5;
    }
    out[k] += y * wet;
  }
}
reverb(sendL, L, [1557, 1617, 1491, 1422].map((d) => Math.round((d * SR) / 44100)), [225, 556].map((d) => Math.round((d * SR) / 44100)));
reverb(sendR, R, [1580, 1640, 1513, 1445].map((d) => Math.round((d * SR) / 44100)), [241, 579].map((d) => Math.round((d * SR) / 44100)));

/* ---------- master: gentle soft clip, fades, normalise to -1 dBFS ---------- */
let peak = 0;
for (let k = 0; k < N; k++) {
  const fadeIn = Math.min(1, k / (0.01 * SR)), fadeOut = Math.min(1, (N - k) / (0.35 * SR));
  L[k] = Math.tanh(L[k] * 1.1) * fadeIn * fadeOut;
  R[k] = Math.tanh(R[k] * 1.1) * fadeIn * fadeOut;
  peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 2 * 3);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
let o = 44;
for (let k = 0; k < N; k++) for (const ch of [L, R]) { const v = Math.round(clamp(ch[k] * norm, -1, 1) * 8388607); buf.writeIntLE(v, o, 3); o += 3; }
fs.writeFileSync('audio.wav', buf);
console.log(`audio.wav written, ${events.length} cues, peak before normalise ${peak.toFixed(3)}`);
