/** Small seeded helpers so the painted scene is deterministic: identical on server and client, no hydration drift. */

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoothstep = (a: number, b: number, x: number) => smooth(Math.min(1, Math.max(0, (x - a) / (b - a))));

/** 1D value noise in 0..1. */
export function noise1(seed: number): (x: number) => number {
  const r = rng(seed);
  const lat = Array.from({ length: 256 }, () => r());
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    return lat[i & 255]! * (1 - smooth(f)) + lat[(i + 1) & 255]! * smooth(f);
  };
}

export function fbm(n: (x: number) => number, x: number, oct = 4): number {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += n(x * f + o * 17.3) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Points of a ridge line across the viewBox. `ridged` gives sharp mountain crests; otherwise soft hills. */
export function ridge(o: { seed: number; width?: number; step?: number; base: number; amp: number; freq: number; oct?: number; ridged?: boolean; envelope?: (x: number) => number }): [number, number][] {
  const { seed, width = 1600, step = 10, base, amp, freq, oct = 4, ridged, envelope } = o;
  const n = noise1(seed);
  const pts: [number, number][] = [];
  for (let x = 0; x <= width + step; x += step) {
    let v = fbm(n, x * freq, oct);
    if (ridged) v = Math.pow(1 - Math.abs(2 * v - 1), 1.35);
    const e = envelope ? envelope(x) : 1;
    pts.push([x, r1(base - amp * v * e)]);
  }
  return pts;
}

export const polyPath = (pts: [number, number][], bottom: number): string =>
  `M0 ${bottom}L${pts.map(([x, y]) => `${x} ${y}`).join("L")}L${pts[pts.length - 1]![0]} ${bottom}Z`;
