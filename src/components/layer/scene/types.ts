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
  /**
   * Poster and test renders: deterministic, preserved drawing buffer, no pointer, drawn once. `progress` is the bus value
   * (default 0). `sweep` (0..1) puts the light bar at that fraction of the glass's width; leave it out for no bar. A still
   * has none of the live scene's time-dependent motion (the idle camera drift and light breathing of t3, the payoff after
   * the first scan), so `timeSec` does not change the picture; it is kept for the contract. With a story beat on the bus
   * (layerBus.beat 0 to 4) the bar sits on that beat's signal, as it does live.
   */
  still?: { timeSec: number; progress?: number; sweep?: number };
}

export interface LayerScene {
  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void;
  /** Draw one frame. Reads layerBus. Returns true if it drew. The caller owns the rAF loop. */
  frame(timeMs: number): boolean;
  setTier(tier: "t2" | "t3"): void;
  /** Resolves when shaders are compiled, so the first visible frame does not hitch. */
  warm(): Promise<void>;
  /**
   * True when the picture on the canvas is final for the current bus values: nothing is easing, no idle motion runs and
   * the last frame was drawn from the present progress and beat. A loop may stop only once this is true.
   */
  settled(): boolean;
  /**
   * Free everything the scene made. Pass `loseContext` only on the final teardown of a canvas: it releases the WebGL
   * context, which a canvas that will host the next scene must keep.
   */
  dispose(opts?: { loseContext?: boolean }): void;
}
