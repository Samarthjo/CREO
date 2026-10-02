"use client";

import { useEffect, useRef, useState } from "react";
import type { Variant } from "./bus";
import { createDebug, type Debug } from "./debug";
import { startRuntime } from "./runtime";
import type { SceneSample } from "./scene/types";

/**
 * The live scene's canvas. The server renders only this empty, transparent canvas; the runtime decides the tier after
 * mount, lazy-loads the scene and fades the canvas in over the poster. At tier t1 the canvas is removed.
 */
export function LayerCanvas({ variant, sample }: { variant: Variant; sample: SceneSample }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const debug = useRef<Debug | null>(null);
  const latest = useRef({ variant, sample });
  const [gone, setGone] = useState(false);

  useEffect(() => {
    latest.current = { variant, sample };
  });

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("debug")) return;
    const d = createDebug();
    debug.current = d;
    return () => {
      d.dispose();
      debug.current = null;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (gone) {
      root.dataset.layerTier = "t1";
      return () => {
        delete root.dataset.layerTier;
      };
    }
    const canvas = ref.current;
    if (!canvas) return;
    return startRuntime({ canvas, ...latest.current, debug: debug.current, onGone: () => setGone(true) });
  }, [gone]);

  if (gone) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        width: "100%",
        height: "100%",
        opacity: 0,
        transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "none",
      }}
    />
  );
}
