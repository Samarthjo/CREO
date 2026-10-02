"use client";

import { useSyncExternalStore } from "react";
import type { Variant } from "./bus";
import { LayerCanvas } from "./layer-canvas";
import type { SceneSample } from "./scene/types";
import { NARROW_PX } from "./tier";

const QUERY = `(min-width: ${NARROW_PX}px) and (orientation: landscape)`;

function subscribe(onChange: () => void) {
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const clientVariant = (): Variant => (matchMedia(QUERY).matches ? "wide" : "tall");

/** The live canvas, mounted only after hydration because the variant is known only in the browser. The server renders nothing here. */
export function StageCanvas({ sample }: { sample: SceneSample }) {
  const variant = useSyncExternalStore(subscribe, clientVariant, () => null);
  return variant ? <LayerCanvas variant={variant} sample={sample} /> : null;
}
