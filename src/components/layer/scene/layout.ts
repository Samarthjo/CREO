import type { AnchorId, Variant } from "../bus";

type Hero = Exclude<AnchorId, "mark">;
type V3 = [number, number, number];

export type TileKind = "reel" | "audience" | "trend" | "deal" | "perf" | "length" | "followers" | "quote" | "walk";

export interface TileSpec {
  kind: TileKind;
  id?: Hero;
  w: number;
  h: number;
  x: number;
  z: number;
  ry: number;
  rx: number;
  /** Height of the lowest edge above the floor. */
  lift?: number;
  /** Which reel picture (0..3). */
  seed?: number;
  /** Only in the story: the tile grows out of the floor as the camera rises, so the headline never has anything behind it. */
  story?: boolean;
}

export interface Layout {
  cam: { pos: V3; look: V3; fov: number };
  /** Camera at progress 0.15: the story's opening pose, raised so the floor, the tiles and the pane fill the frame behind the cards. */
  cam1: { pos: V3; look: V3; fov: number };
  /** Camera at the end of the story: it drifts here from cam1 as the beats go by. */
  cam2: { pos: V3; look: V3; fov: number };
  /** The pane in the story: it leans back to face the raised camera, and grows a little. */
  glass1: { rx: number; ry: number; scale: number };
  glass: { w: number; h: number; x: number; y: number; z: number; rx: number; ry: number; r: number };
  /** Height of the CREO mark above the glass centre, in world units. Moves it clear of the tiles behind the pane. */
  markY: number;
  /** Soft backdrop glow in screen space: centre x, centre y (both 0..1, y up) and radii. */
  glow: [number, number, number, number];
  tiles: TileSpec[];
  /** Screen rectangle (fractions, y from the top) that stays quiet and dark: the headline sits here. */
  quiet: [number, number, number, number];
}

const WIDE: Layout = {
  cam: { pos: [0.1, 1.3, 13], look: [0.1, -0.1, 0], fov: 26 },
  cam1: { pos: [-0.6, 5.5, 11], look: [-0.6, 0.3, 1.2], fov: 30 },
  cam2: { pos: [-1.8, 4.5, 10.2], look: [-0.1, 0.3, 1.0], fov: 30 },
  glass1: { rx: -0.45, ry: 0, scale: 1.02 },
  glass: { w: 5.3, h: 1.5, x: 0.1, y: 1.11, z: 2.3, rx: -0.09, ry: -0.05, r: 0.2 },
  markY: 0.36,
  glow: [0.5, 0.66, 0.5, 0.3],
  quiet: [0.04, 0.5, 0.56, 0.94],
  tiles: [
    // the five signals
    { kind: "reel", id: "content", w: 1.05, h: 1.87, x: -3.3, z: 0.1, ry: 0.34, rx: -0.07, seed: 0 },
    { kind: "audience", id: "audience", w: 1.95, h: 1.17, x: -1.5, z: -0.8, ry: 0.16, rx: -0.16 },
    { kind: "trend", id: "trends", w: 1.95, h: 1.17, x: 2.0, z: -1.7, ry: -0.18, rx: -0.14, lift: 0.3 },
    { kind: "deal", id: "deals", w: 1.95, h: 1.17, x: 3.25, z: 0.4, ry: -0.34, rx: -0.14 },
    { kind: "perf", id: "perf", w: 1.95, h: 1.17, x: 0.85, z: 0.9, ry: -0.05, rx: -0.2 },
    // the scatter: dimmer reels and stats
    { kind: "reel", w: 0.9, h: 1.6, x: -4.9, z: -1.5, ry: 0.45, rx: -0.1, seed: 1 },
    { kind: "reel", w: 0.9, h: 1.6, x: -2.9, z: -3.0, ry: 0.2, rx: -0.12, seed: 2 },
    { kind: "reel", w: 0.9, h: 1.6, x: 5.0, z: -1.9, ry: -0.4, rx: -0.1, seed: 3 },
    { kind: "reel", w: 0.9, h: 1.6, x: 6.2, z: -0.2, ry: -0.6, rx: -0.14, seed: 1 },
    { kind: "reel", w: 0.9, h: 1.6, x: 0.2, z: -3.8, ry: 0.05, rx: -0.12, seed: 3 },
    { kind: "reel", w: 0.9, h: 1.6, x: 3.9, z: -3.4, ry: -0.15, rx: -0.12, seed: 0 },
    { kind: "reel", w: 0.9, h: 1.6, x: -6.3, z: -0.4, ry: 0.6, rx: -0.12, seed: 2 },
    { kind: "reel", w: 0.9, h: 1.6, x: 7.6, z: -2.6, ry: -0.5, rx: -0.1, seed: 2 },
    { kind: "reel", w: 0.9, h: 1.6, x: -4.6, z: -4.8, ry: 0.25, rx: -0.12, seed: 3 },
    { kind: "reel", w: 0.9, h: 1.6, x: 1.9, z: -5.2, ry: -0.1, rx: -0.12, seed: 1 },
    { kind: "quote", w: 1.45, h: 0.87, x: -0.8, z: -2.5, ry: 0.1, rx: -0.16 },
    { kind: "followers", w: 1.45, h: 0.87, x: -5.8, z: -2.9, ry: 0.4, rx: -0.14 },
    { kind: "walk", w: 1.45, h: 0.87, x: 2.6, z: 2.9, ry: -0.35, rx: -1.4 },
    { kind: "length", w: 1.45, h: 0.87, x: 4.7, z: 1.4, ry: -0.5, rx: -1.4 },
    // near the camera and flat on the floor, so the lower right of the frame holds something instead of black
    { kind: "quote", w: 1.1, h: 0.66, x: 1.45, z: 5.2, ry: -0.3, rx: -1.4 },
    { kind: "followers", w: 1.1, h: 0.66, x: 2.25, z: 7.0, ry: 0.25, rx: -1.4 },
    { kind: "reel", w: 0.72, h: 1.28, x: 3.1, z: 5.0, ry: -0.55, rx: -1.4, seed: 1 },
    // the story's lower left, where the headline stood
    { kind: "length", w: 1.2, h: 0.72, x: -2.7, z: 4.3, ry: 0.35, rx: -1.4, story: true },
    { kind: "reel", w: 0.72, h: 1.28, x: -1.3, z: 4.1, ry: 0.5, rx: -1.4, seed: 2, story: true },
  ],
};

const TALL: Layout = {
  cam: { pos: [0, 1.5, 14.5], look: [0, 0.2, 0], fov: 34 },
  // the tall stage has no pinned story (the beats stack), so it keeps the low, close pose and the slow dolly
  cam1: { pos: [0, 1.3, 13.5], look: [0, 0.25, 0], fov: 33 },
  cam2: { pos: [0, 1.3, 12.4], look: [0, 0.25, 0], fov: 33 },
  glass1: { rx: -0.01, ry: 0, scale: 1.05 },
  glass: { w: 3.2, h: 2.4, x: 0, y: 1.7, z: 2.3, rx: -0.09, ry: 0, r: 0.2 },
  markY: 0.5,
  glow: [0.5, 0.68, 0.6, 0.26],
  quiet: [0.0, 0.6, 1.0, 1.0],
  tiles: [
    { kind: "reel", id: "content", w: 1.0, h: 1.78, x: -1.45, z: 0.3, ry: 0.4, rx: -0.07, seed: 0 },
    { kind: "audience", id: "audience", w: 1.5, h: 0.9, x: -0.4, z: -0.9, ry: 0.14, rx: -0.16, lift: 0.5 },
    { kind: "trend", id: "trends", w: 1.5, h: 0.9, x: 1.05, z: -1.7, ry: -0.16, rx: -0.14, lift: 0.75 },
    { kind: "deal", id: "deals", w: 1.5, h: 0.9, x: 1.12, z: 0.2, ry: -0.35, rx: -0.14 },
    { kind: "perf", id: "perf", w: 1.5, h: 0.9, x: 0.4, z: 1.1, ry: -0.05, rx: -0.2 },
    { kind: "reel", w: 0.7, h: 1.25, x: -2.9, z: -1.5, ry: 0.45, rx: -0.1, seed: 1 },
    { kind: "reel", w: 0.7, h: 1.25, x: -1.0, z: -3.2, ry: 0.15, rx: -0.12, seed: 2 },
    { kind: "reel", w: 0.7, h: 1.25, x: 3.1, z: -1.6, ry: -0.45, rx: -0.1, seed: 3 },
    { kind: "reel", w: 0.7, h: 1.25, x: 1.1, z: -4.2, ry: -0.05, rx: -0.12, seed: 1 },
    { kind: "reel", w: 0.7, h: 1.25, x: -3.7, z: 0.2, ry: 0.55, rx: -0.12, seed: 3 },
    { kind: "reel", w: 0.7, h: 1.25, x: 3.8, z: -0.2, ry: -0.6, rx: -0.12, seed: 2 },
    { kind: "length", w: 1.1, h: 0.66, x: -1.7, z: -2.2, ry: 0.2, rx: -0.16 },
  ],
};

export const LAYOUTS: Record<Variant, Layout> = { wide: WIDE, tall: TALL };
