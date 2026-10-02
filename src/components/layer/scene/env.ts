import { DataTexture, DataUtils, EquirectangularReflectionMapping, HalfFloatType, LinearFilter, LinearSRGBColorSpace, RGBAFormat } from "three";

type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A rectangular soft box in direction space: centre direction, half extents (tangent units), tilt, feather, colour. */
interface Box {
  c: V3;
  hw: number;
  hh: number;
  tilt: number;
  feather: number;
  rgb: V3;
  k: number;
}

function prepare(b: Box) {
  const c = norm(b.c);
  let u = norm(cross([0, 1, 0], c));
  let v = cross(c, u);
  const s = Math.sin(b.tilt);
  const co = Math.cos(b.tilt);
  const ur: V3 = [u[0] * co + v[0] * s, u[1] * co + v[1] * s, u[2] * co + v[2] * s];
  const vr: V3 = [v[0] * co - u[0] * s, v[1] * co - u[1] * s, v[2] * co - u[2] * s];
  u = ur;
  v = vr;
  return { ...b, c, u, v };
}

/**
 * A studio environment made of strip lights instead of a flat room: a tall diagonal strip behind the camera (the streak
 * on the glass), an overhead soft box (top bevel), a lime strip on the right and a cool strip on the left (side bevels).
 * Equirectangular, half-float, HDR: three converts it to its prefiltered cube when it is assigned to scene.environment.
 */
export function makeStudioEnv(): DataTexture {
  const W = 768;
  const H = 384;
  const boxes = [
    { c: [0.2, 0.1, 1] as V3, hw: 0.06, hh: 0.62, tilt: 0.5, feather: 0.16, rgb: [0.86, 0.94, 1] as V3, k: 6 },
    { c: [0.1, 1, 0.1] as V3, hw: 0.5, hh: 0.3, tilt: 0.2, feather: 0.2, rgb: [0.8, 0.9, 1] as V3, k: 3 },
    { c: [1, 0.08, 0.15] as V3, hw: 0.05, hh: 0.9, tilt: 0.1, feather: 0.05, rgb: [0.62, 1, 0.12] as V3, k: 10 },
    { c: [-1, 0.12, 0.25] as V3, hw: 0.07, hh: 0.8, tilt: -0.1, feather: 0.06, rgb: [0.8, 0.9, 1] as V3, k: 5 },
    { c: [0, 0.25, -1] as V3, hw: 1.1, hh: 0.22, tilt: 0, feather: 0.25, rgb: [0.75, 0.85, 1] as V3, k: 2 },
  ].map(prepare);
  const data = new Uint16Array(W * H * 4);
  const one = DataUtils.toHalfFloat(1);
  for (let j = 0; j < H; j++) {
    const lat = ((j + 0.5) / H - 0.5) * Math.PI; // v = asin(y) / PI + 0.5
    const y = Math.sin(lat);
    const rc = Math.cos(lat);
    for (let i = 0; i < W; i++) {
      const lon = ((i + 0.5) / W - 0.5) * Math.PI * 2; // u = atan(z, x) / 2PI + 0.5
      const d: V3 = [rc * Math.cos(lon), y, rc * Math.sin(lon)];
      const base = 0.006 + 0.012 * Math.max(0, y);
      let r = base * 0.7;
      let g = base * 0.85;
      let b = base;
      for (const bx of boxes) {
        const dc = dot(d, bx.c);
        if (dc < 0.08) continue;
        const px = d[0] / dc - bx.c[0];
        const py = d[1] / dc - bx.c[1];
        const pz = d[2] / dc - bx.c[2];
        const x = px * bx.u[0] + py * bx.u[1] + pz * bx.u[2];
        const yy = px * bx.v[0] + py * bx.v[1] + pz * bx.v[2];
        const dx = Math.abs(x) - bx.hw;
        const dy = Math.abs(yy) - bx.hh;
        const sd = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
        if (sd > bx.feather) continue;
        const t = Math.max(0, 1 - sd / bx.feather);
        const a = (t * t * (3 - 2 * t)) * bx.k;
        r += bx.rgb[0] * a;
        g += bx.rgb[1] * a;
        b += bx.rgb[2] * a;
      }
      const o = (j * W + i) * 4;
      data[o] = DataUtils.toHalfFloat(r);
      data[o + 1] = DataUtils.toHalfFloat(g);
      data[o + 2] = DataUtils.toHalfFloat(b);
      data[o + 3] = one;
    }
  }
  const tex = new DataTexture(data, W, H, RGBAFormat, HalfFloatType);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = LinearSRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
