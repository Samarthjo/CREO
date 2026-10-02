import type { Tier, Variant } from "./bus";

/** Viewports narrower than this get the tall stage and never run the live scene. */
export const NARROW_PX = 900;

export interface TierEnv {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  cores: number | null;
  deviceMemory: number | null;
  coarsePointer: boolean;
  narrow: boolean;
  software: boolean;
  forced: Tier | null;
}

/** Pure. Forced wins, then anything that rules out a live scene (t1), then weak hardware (t2), else t3. */
export function detectTier(e: TierEnv): Tier {
  if (e.forced) return e.forced;
  if (e.reducedMotion || e.saveData || !e.webgl2 || e.software || e.coarsePointer || e.narrow) return "t1";
  if ((e.cores !== null && e.cores < 4) || (e.deviceMemory !== null && e.deviceMemory < 4)) return "t2";
  return "t3";
}

export function parseForcedTier(search: string): Tier | null {
  const v = new URLSearchParams(search).get("tier");
  return v === "t1" || v === "t2" || v === "t3" ? v : null;
}

export function isSoftwareRenderer(renderer: string): boolean {
  return /swiftshader|llvmpipe|software/i.test(renderer);
}

/** Wide needs a landscape viewport at least NARROW_PX across; a portrait tablet gets the tall stage rather than a cropped wide one. */
export function pickVariant(viewportWidth: number, viewportHeight: number): Variant {
  return viewportWidth >= NARROW_PX && viewportWidth > viewportHeight ? "wide" : "tall";
}

/** Device pixel ratio the canvas renders at. */
export function dprFor(tier: Tier, devicePixelRatio: number): number {
  return Math.min(devicePixelRatio || 1, tier === "t3" ? 1.5 : 1);
}

type ProbeState = Pick<TierEnv, "webgl2" | "software"> & { renderer: string };
export type BasicEnv = Omit<TierEnv, keyof ProbeState>;

/** Everything that needs no WebGL context. Browser only. */
export function readBasicEnv(): BasicEnv {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    cores: nav.hardwareConcurrency || null,
    deviceMemory: nav.deviceMemory ?? null,
    coarsePointer: matchMedia("(pointer: coarse)").matches,
    narrow: innerWidth < NARROW_PX,
    forced: parseForcedTier(location.search),
  };
}

/** Creates and immediately releases a throwaway WebGL2 context to learn whether it exists and what renders it. Browser only. */
export function probeGl(): ProbeState {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return { webgl2: false, software: false, renderer: "" };
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return { webgl2: true, software: isSoftwareRenderer(renderer), renderer };
}

export interface ProbeOptions {
  /** Frames ignored after a start or reset (shader warm-up, first paints). */
  skip: number;
  /** Frames kept for the median. */
  window: number;
  /** The median needs at least this many frames before it counts. */
  minFrames: number;
  limitMs: number;
  /** How long the median must stay above the limit before the tier steps down. */
  holdMs: number;
}

export interface Probe {
  /** Feed one frame time and the current time. True means: step down a tier now. */
  push(frameMs: number, nowMs: number): boolean;
  reset(): void;
}

const PROBE_DEFAULTS: ProbeOptions = { skip: 12, window: 60, minFrames: 30, limitMs: 22, holdMs: 2000 };

export function createProbe(options: Partial<ProbeOptions> = {}): Probe {
  const o = { ...PROBE_DEFAULTS, ...options };
  let seen = 0;
  let over: number | null = null;
  const frames: number[] = [];
  return {
    push(frameMs, nowMs) {
      if (seen < o.skip) {
        seen++;
        return false;
      }
      frames.push(frameMs);
      if (frames.length > o.window) frames.shift();
      if (frames.length < o.minFrames) return false;
      if (median(frames) <= o.limitMs) {
        over = null;
        return false;
      }
      over ??= nowMs;
      return nowMs - over >= o.holdMs;
    },
    reset() {
      seen = 0;
      over = null;
      frames.length = 0;
    },
  };
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** The tier below this one, or null at the bottom. */
export function stepDown(tier: Tier): Tier | null {
  return tier === "t3" ? "t2" : tier === "t2" ? "t1" : null;
}
