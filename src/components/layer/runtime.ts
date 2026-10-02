import { ANCHORS } from "./anchors";
import { layerBus, type AnchorId, type Tier, type Variant } from "./bus";
import type { Debug } from "./debug";
import { createLoop, type Loop } from "./loop";
import type { AnchorMap, LayerScene, LayerSceneOptions, SceneSample } from "./scene/types";
import { createProbe, detectTier, dprFor, pickVariant, probeGl, readBasicEnv, stepDown } from "./tier";

const IDLE_TIMEOUT_MS = 2000;
const POINTER_IDLE_MS = 2500;
const RESIZE_DEBOUNCE_MS = 120;

type LiveTier = "t2" | "t3";
type SceneModule = { createLayerScene: (options: LayerSceneOptions) => LayerScene | Promise<LayerScene> };

export interface RuntimeOptions {
  canvas: HTMLCanvasElement;
  variant: Variant;
  sample: SceneSample;
  debug: Debug | null;
  /** Called once when the live scene is given up for good (tier t1). The owner removes the canvas. */
  onGone: () => void;
}

/**
 * Decides the tier, lazy-loads the scene once the page is idle (or on the first pointer move), and runs it: loop, resize,
 * pointer, context loss and the frame-time probe. Returns a dispose function; calling start again after it is safe.
 */
export function startRuntime({ canvas, variant, sample, debug, onGone }: RuntimeOptions): () => void {
  const root = document.documentElement;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const probe = createProbe();
  const basic = readBasicEnv();

  let disposed = false;
  let started = false;
  let tier: Tier = "t1";
  let current = variant;
  let scene: LayerScene | null = null;
  let loop: Loop | null = null;
  let build = 0; // bumped whenever a scene is made or torn down, so stale async work can tell it is stale
  let retried = false;
  let shown = false;
  let lastWidth = 0;
  let cpuMs = 0;
  let resizeTimer = 0;
  let idleHandle = 0;
  let pointerTimer = 0;
  let lastMove = 0;
  let observer: ResizeObserver | null = null;
  let listening = false;
  let sceneModule: Promise<SceneModule> | null = null;

  const hasIdle = typeof requestIdleCallback === "function"; // not in Safari
  const stage = canvas.closest("[data-layer-stage]");

  const applyTier = (t: Tier) => {
    tier = t;
    root.dataset.layerTier = t;
    debug?.set({ tier: t });
  };

  const writeAnchors = (a: AnchorMap) => {
    if (!stage) return;
    for (const el of stage.querySelectorAll<HTMLElement>("[data-anchor]")) {
      const p = a[el.dataset.anchor as AnchorId];
      if (!p) continue;
      el.style.setProperty("--ax", String(Math.round(p.x * 100) / 100));
      el.style.setProperty("--ay", String(Math.round(p.y * 100) / 100));
    }
  };

  const hideCanvas = () => {
    shown = false;
    canvas.style.opacity = "0";
    delete canvas.dataset.ready;
  };

  const teardownScene = () => {
    build++;
    loop?.dispose();
    loop = null;
    try {
      scene?.dispose();
    } catch {
      // a lost context can make dispose throw; there is nothing left to free
    }
    scene = null;
    layerBus.pointer = null;
  };

  /** Back to the poster for good. */
  const giveUp = () => {
    if (disposed) return;
    const wasLive = scene !== null || shown;
    teardownScene();
    if (wasLive) writeAnchors(ANCHORS[current]);
    applyTier("t1");
    onGone();
  };

  const applySize = () => {
    const parent = canvas.parentElement;
    if (!scene || !parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (!w || !h) return;
    const dpr = dprFor(tier, devicePixelRatio);
    lastWidth = w;
    scene.resize(w, h, dpr);
    debug?.set({ dpr });
  };

  const onResize = (entries: ResizeObserverEntry[]) => {
    if (!scene) return;
    const w = Math.round(entries[entries.length - 1].contentRect.width);
    if (coarse && w === lastWidth) return; // height-only: the mobile browser bars moving, not worth reallocating targets
    const next = pickVariant(innerWidth, innerHeight);
    if (next !== current) {
      current = next;
      void mountScene(tier as LiveTier);
      return;
    }
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applySize, RESIZE_DEBOUNCE_MS);
  };

  const onFrame = (frameMs: number | null, drew: boolean, timeMs: number) => {
    if (frameMs === null) probe.reset();
    else {
      debug?.push(frameMs, cpuMs);
      if (probe.push(frameMs, timeMs)) lowerTier();
    }
    if (drew && !shown) {
      shown = true;
      canvas.dataset.ready = "true";
      canvas.style.opacity = "1";
    }
  };

  const lowerTier = () => {
    const next = stepDown(tier);
    if (next === "t2" && scene) {
      scene.setTier("t2");
      applyTier("t2");
      applySize();
      probe.reset();
    } else {
      giveUp();
    }
  };

  const frame = (timeMs: number): boolean => {
    const t0 = performance.now();
    try {
      const drew = scene ? scene.frame(timeMs) : false;
      cpuMs = performance.now() - t0;
      return drew;
    } catch {
      giveUp();
      return false;
    }
  };

  const mountScene = async (t: LiveTier) => {
    teardownScene();
    const id = build;
    try {
      sceneModule ??= import("./scene") as Promise<SceneModule>;
      const { createLayerScene } = await sceneModule;
      if (id !== build) return;
      const made = await createLayerScene({ canvas, variant: current, tier: t, sample, onAnchors: writeAnchors });
      if (id !== build) {
        made.dispose();
        return;
      }
      scene = made;
      applySize();
      await made.warm();
    } catch {
      if (id === build) giveUp();
      return;
    }
    if (id !== build) return;
    const next = pickVariant(innerWidth, innerHeight);
    if (next !== current) {
      current = next;
      void mountScene(t);
      return;
    }
    probe.reset();
    loop = createLoop({ target: canvas, frame, onFrame });
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const p = (layerBus.pointer ??= { x: 0, y: 0 });
    p.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    p.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    lastMove = e.timeStamp;
    pointerTimer ||= window.setTimeout(expirePointer, POINTER_IDLE_MS);
  };

  // One timer, re-armed for the remainder, so a stream of moves costs no timer churn.
  const expirePointer = () => {
    const left = POINTER_IDLE_MS - (performance.now() - lastMove);
    if (left > 5) {
      pointerTimer = window.setTimeout(expirePointer, left);
      return;
    }
    pointerTimer = 0;
    layerBus.pointer = null;
  };

  const clearPointer = () => {
    clearTimeout(pointerTimer);
    pointerTimer = 0;
    layerBus.pointer = null;
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    teardownScene();
    hideCanvas();
    writeAnchors(ANCHORS[current]);
    applyTier("t1");
  };

  const onRestored = () => {
    if (retried || disposed) return;
    retried = true;
    applyTier("t2");
    void mountScene("t2");
  };

  const listen = () => {
    listening = true;
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    if (canvas.parentElement) {
      observer = new ResizeObserver(onResize);
      observer.observe(canvas.parentElement);
    }
    if (!coarse) {
      addEventListener("pointermove", onMove, { passive: true });
      root.addEventListener("pointerleave", clearPointer);
    }
  };

  const cancelIdle = () => {
    if (hasIdle) cancelIdleCallback(idleHandle);
    else clearTimeout(idleHandle);
    idleHandle = 0;
  };

  const begin = () => {
    if (started || disposed) return;
    started = true;
    removeEventListener("pointermove", begin);
    removeEventListener("load", schedule);
    cancelIdle();
    const gl = probeGl();
    debug?.set({ renderer: gl.renderer || "n/a" });
    const decided = detectTier({ ...basic, ...gl });
    if (decided === "t1") {
      giveUp();
      return;
    }
    applyTier(decided);
    debug?.set({ calls: () => (scene as (LayerScene & { drawCalls?: () => number }) | null)?.drawCalls?.() ?? null });
    listen();
    void mountScene(decided);
  };

  const schedule = () => {
    removeEventListener("load", schedule);
    if (started || disposed) return;
    idleHandle = hasIdle ? requestIdleCallback(begin, { timeout: IDLE_TIMEOUT_MS }) : window.setTimeout(begin, 600);
  };

  // Anything that rules out WebGL is known without a context, so decide it now and skip the probe entirely.
  if (detectTier({ ...basic, webgl2: true, software: false }) === "t1") {
    started = true;
    applyTier("t1");
    onGone();
  } else {
    addEventListener("pointermove", begin, { once: true, passive: true });
    if (document.readyState === "complete") schedule();
    else addEventListener("load", schedule, { once: true });
  }

  return () => {
    disposed = true;
    started = true;
    removeEventListener("pointermove", begin);
    removeEventListener("load", schedule);
    cancelIdle();
    clearTimeout(resizeTimer);
    clearPointer();
    observer?.disconnect();
    if (listening) {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", clearPointer);
    }
    teardownScene();
    delete root.dataset.layerTier;
  };
}
