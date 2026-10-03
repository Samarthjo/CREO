import { fbm, noise1, r1, smoothstep } from "./noise";

/*
  Where things stand in the calm scene, in scene units (a 1600 x 900 picture, bottom-centre anchored).
  The painted pictures in public/scene are baked from these numbers (scripts/scenery), and the page positions the near
  trees and banks from them, so the two always agree. Pure functions, no JSX: Node can import this file directly.
*/
export const W = 1600;
export const H = 900;

/** A bounding box in scene units: x, y, width, height. */
export type Box = [number, number, number, number];

const n = noise1(97);
/** The crest of the left bank, where its grass meets the sky and the lake. */
export const leftTop = (x: number) => 505 + 365 * Math.pow(smoothstep(0, 780, x), 1.25) + (fbm(n, x * 0.012, 3) - 0.5) * 38;
/** The crest of the right bank. */
export const rightTop = (x: number) => 890 - 250 * Math.pow(smoothstep(1020, 1600, x), 1.1) + (fbm(n, x * 0.012 + 40, 3) - 0.5) * 38;

/**
 * The two banks. `box` is where each bank's picture sits, a little bigger than the bank so the grass can stand against the sky.
 * Past `x1` (or before `x0`) the bank keeps falling away, so it runs out of the picture instead of ending in a cut.
 */
export const BANKS = {
  l: { x0: 0, x1: 790, top: leftTop, box: [0, 452, 800, 478] as Box },
  r: { x0: 1010, x1: 1610, top: rightTop, box: [1000, 600, 600, 330] as Box },
} as const;

/** The stones sitting on the banks: centre and half-size. */
export const ROCKS: readonly { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 430, cy: leftTop(430) + 40, rx: 74, ry: 34 },
  { cx: 230, cy: leftTop(230) + 90, rx: 54, ry: 26 },
  { cx: 610, cy: leftTop(610) + 52, rx: 46, ry: 20 },
  { cx: 1210, cy: rightTop(1210) + 34, rx: 62, ry: 26 },
  { cx: 1460, cy: rightTop(1460) + 70, rx: 82, ry: 34 },
  { cx: 1330, cy: 876, rx: 90, ry: 28 },
];

export type TreeSpec = { side: "l" | "r"; x: number; s: number; kind: "c" | "b"; tiers?: number; slim?: number; lean?: number };

// Varied by hand: heights, species, slenderness and spacing differ.
export const TREES: readonly TreeSpec[] = [
  { side: "l", x: 22, s: 1.0, kind: "c", tiers: 6, slim: 0.17, lean: 0.02 },
  { side: "l", x: 104, s: 0.62, kind: "b" },
  { side: "l", x: 166, s: 0.84, kind: "c", tiers: 5, slim: 0.21, lean: -0.015 },
  { side: "l", x: 246, s: 0.46, kind: "c", tiers: 4, slim: 0.19 },
  { side: "l", x: 306, s: 0.56, kind: "b" },
  { side: "l", x: 378, s: 0.3, kind: "c", tiers: 4, slim: 0.2, lean: 0.03 },
  { side: "r", x: 1496, s: 0.68, kind: "c", tiers: 6, slim: 0.16, lean: -0.02 },
  { side: "r", x: 1420, s: 0.4, kind: "b" },
  { side: "r", x: 1558, s: 0.48, kind: "c", tiers: 5, slim: 0.2, lean: 0.02 },
  { side: "r", x: 1352, s: 0.26, kind: "c", tiers: 4, slim: 0.18 },
];

export interface TreePlacement extends TreeSpec {
  /** Height of the whole tree, and the y of its foot. */
  h: number;
  base: number;
  /** The picture's box. Its top-left is where the picture sits. */
  box: Box;
  /** Where the trunk meets the ground; the whole tree leans around this point in a gust. */
  root: [number, number];
  /** Where the crown flutters around. For a conifer it is the root. For a broadleaf it is where the trunk enters the crown. */
  pivot: [number, number];
}

/** Everything the page and the baker both need to know about one near tree. */
export function placeTree(t: TreeSpec): TreePlacement {
  const top = t.side === "l" ? leftTop : rightTop;
  const base = r1(top(t.x) + 20);
  const h = 330 * t.s;
  if (t.kind === "c") {
    const slim = t.slim ?? 0.2;
    const ax = t.x + (t.lean ?? 0) * h;
    const reach = h * slim * 1.15;
    const x0 = Math.min(t.x, ax) - reach - 2;
    const box: Box = [r1(x0), r1(base - h - 3), r1(Math.max(t.x, ax) + reach + 2 - x0), r1(h + 5)];
    return { ...t, h, base, box, root: [t.x, base], pivot: [t.x, base] };
  }
  const hb = h * 0.8;
  const cy = base - hb * 0.62;
  const box: Box = [r1(t.x - hb * 0.58), r1(base - hb * 1.12), r1(hb * 1.16), r1(hb * 1.12 + 3)];
  return { ...t, h, base, box, root: [t.x, base], pivot: [t.x, r1(cy + hb * 0.16)] };
}

export const NEAR_TREES: readonly TreePlacement[] = TREES.map(placeTree);
