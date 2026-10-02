import { BufferGeometry, Float32BufferAttribute, Shape, ShapeGeometry } from "three";

/**
 * The pane: a flat polished face (`cap`) and a smooth rounded bevel plus side wall (`rim`). Built by hand because
 * ExtrudeGeometry shades with flat normals, which would facet the bevel highlights. UVs map the cap to 0..1 so the
 * etch maps line up with it; the bevel clamps to the edge texels.
 */
export function paneGeometries(cw: number, ch: number, r: number, depth: number, bt: number, bs: number) {
  const seg = 10;
  const S = 6;
  const zf = depth / 2;
  const corners: [number, number, number][] = [
    [cw / 2 - r, ch / 2 - r, 0],
    [-cw / 2 + r, ch / 2 - r, Math.PI / 2],
    [-cw / 2 + r, -ch / 2 + r, Math.PI],
    [cw / 2 - r, -ch / 2 + r, Math.PI * 1.5],
  ];
  const pts: [number, number, number, number][] = [];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
  }
  const n = pts.length;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const ring = (k: number, back: boolean) => {
    const a = (k / S) * (Math.PI / 2);
    const s = Math.sin(a);
    const c = Math.cos(a);
    const z = (zf + bt * c) * (back ? -1 : 1);
    for (const [x, y, nx, ny] of pts) {
      const px = x + nx * bs * s;
      const py = y + ny * bs * s;
      pos.push(px, py, z);
      nor.push(nx * s, ny * s, c * (back ? -1 : 1));
      uv.push(px / cw + 0.5, py / ch + 0.5);
    }
  };
  for (let k = 0; k <= S; k++) ring(k, false);
  for (let k = S; k >= 0; k--) ring(k, true);
  const idx: number[] = [];
  for (let rI = 0; rI < 2 * S + 1; rI++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = rI * n + i;
      const a1 = rI * n + j;
      const b = (rI + 1) * n + i;
      const b1 = (rI + 1) * n + j;
      idx.push(a, b, a1, a1, b, b1);
    }
  }
  const rim = new BufferGeometry();
  rim.setAttribute("position", new Float32BufferAttribute(pos, 3));
  rim.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  rim.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  rim.setIndex(idx);

  const shape = new Shape();
  shape.moveTo(-cw / 2 + r, -ch / 2);
  shape.lineTo(cw / 2 - r, -ch / 2);
  shape.absarc(cw / 2 - r, -ch / 2 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(cw / 2, ch / 2 - r);
  shape.absarc(cw / 2 - r, ch / 2 - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-cw / 2 + r, ch / 2);
  shape.absarc(-cw / 2 + r, ch / 2 - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-cw / 2, -ch / 2 + r);
  shape.absarc(-cw / 2 + r, -ch / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  const cap = new ShapeGeometry(shape, 12);
  cap.translate(0, 0, zf + bt);
  const p = cap.getAttribute("position");
  const u = cap.getAttribute("uv");
  for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / cw + 0.5, p.getY(i) / ch + 0.5);
  return { cap, rim, faceZ: zf + bt };
}
