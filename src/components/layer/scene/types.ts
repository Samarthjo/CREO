import type { AnchorId, Variant } from "../bus";

/** Strings the scene paints onto its tiles. Computed on the server from the real engine (see ../sample.ts), so the scene
 * never invents numbers. Every value here is sample data for the made-up creator. */
export interface SceneSample {
  creator: string; // "Arjun Kulkarni"
  followers: string; // "27.4K"
  audienceLine: string; // "22 to 34 · Pune"
  patternTitle: string; // "I replaced X with AI for 7 days"
  proofLift: string; // "1.8x"
  proofBasis: string; // "2 posts"
  durationSec: string; // "21s"
  brand: string; // "Tessera"
  offer: string; // "₹12,000"
  quoteShort: string; // "₹17.5K–24K"
  quoteLong: string; // "₹17,500 to ₹24,000"
  walkAway: string; // "₹15,500"
}

export type AnchorMap = Record<AnchorId, { x: number; y: number }>;

export interface LayerSceneOptions {
  canvas: HTMLCanvasElement;
  variant: Variant;
  /** t3: transmission glass, reflector floor, bloom. t2: faux glass, cheap floor, no bloom. */
  tier: "t2" | "t3";
  sample: SceneSample;
  /** Called after a frame in which an anchor moved, with percentages of the stage (0..100). */
  onAnchors: (a: AnchorMap) => void;
  /** Poster and test renders: deterministic time, preserved drawing buffer, no pointer. */
  still?: { timeSec: number; progress?: number; sweep?: number };
}

export interface LayerScene {
  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void;
  /** Draw one frame. Reads layerBus. Returns true if it drew. The caller owns the rAF loop. */
  frame(timeMs: number): boolean;
  setTier(tier: "t2" | "t3"): void;
  /** Resolves when shaders are compiled, so the first visible frame does not hitch. */
  warm(): Promise<void>;
  dispose(): void;
}
