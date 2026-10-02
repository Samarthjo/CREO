import type { CSSProperties } from "react";
import { cn } from "../ui/kit";
import { r1, rng } from "./noise";

export interface TileSpot { x: number; y: number; size: number }

/** Deterministic clusters of frosted tiles. x and y are percentages of the container, size is in rem. */
export function tileSpots(seed: number, clusters: { x: number; y: number; n: number; spread?: number }[]): TileSpot[] {
  const r = rng(seed);
  return clusters.flatMap((c) =>
    Array.from({ length: c.n }, () => ({ x: r1(c.x + (r() - 0.5) * (c.spread ?? 10)), y: r1(c.y + (r() - 0.5) * (c.spread ?? 10) * 1.4), size: r1(2.2 + r() * 2.4) })),
  );
}

/** Small frosted-glass squares that drift slowly over the scene. Decoration only: aria-hidden, no content. */
export function GlassTiles({ spots, className }: { spots: TileSpot[]; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {spots.map((s, i) => (
        <span
          key={i}
          className="glass drift-y absolute rounded-glass"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}rem`, height: `${s.size}rem`, "--dur": `${9 + (i % 5) * 2.5}s`, "--delay": `${-(i * 1.7)}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
