/**
 * The one shared, mutable value that connects the page (DOM) and the WebGL scene. It is written by scroll and pointer
 * handlers and read by the scene once per frame, so scrolling never triggers a React render.
 */
export type AnchorId = "content" | "audience" | "trends" | "deals" | "perf" | "mark";
export type Variant = "wide" | "tall";
export type Tier = "t1" | "t2" | "t3";

export const layerBus = {
  /** 0 at the top of the page, 1 at the end of the story. Written by the page's scroll handler. */
  progress: 0,
  /** -1 while the hero is in view, then 0 to 4 for the five beats. Written by the story. */
  beat: -1,
  /** Pointer position inside the stage, -1..1 on both axes, or null when there is no pointer (touch, idle). */
  pointer: null as { x: number; y: number } | null,
};
