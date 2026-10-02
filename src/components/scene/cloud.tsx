import type { CSSProperties } from "react";
import { cn } from "../ui/kit";
import { r1, rng } from "./noise";
import { paletteFor, type Look, type Time } from "./palette";

/** A soft painted cumulus with a flat base and long wisps, in the palette of the given time of day. */
export function Cloud({ time, look = "calm", seed = 1, className, style }: { time: Time; look?: Look; seed?: number; className?: string; style?: CSSProperties }) {
  const p = paletteFor(time, look);
  const r = rng(seed * 101);
  const id = `cl-${look}-${time}-${seed}`;
  const puffs = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const hump = Math.sin(Math.PI * (0.08 + 0.84 * t));
    const rad = 26 + 74 * hump * (0.75 + 0.35 * r());
    return { x: r1(70 + t * 380 + (r() - 0.5) * 18), y: r1(170 - rad * 0.62), r: r1(rad) };
  });
  const lights = puffs.filter((_, i) => i % 3 === 1).map((c) => ({ x: r1(c.x - c.r * 0.22), y: r1(c.y - c.r * 0.28), r: r1(c.r * 0.55) }));
  return (
    <svg viewBox="0 0 520 220" className={cn("pointer-events-none", className)} style={style} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="180"><stop offset="0" stopColor={p.cloudTop} /><stop offset="1" stopColor={p.cloudBottom} /></linearGradient>
        <clipPath id={`${id}-c`}><rect x="0" y="0" width="520" height="172" /></clipPath>
        <filter id={`${id}-b`}><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <g filter={`url(#${id}-b)`}>
        <g clipPath={`url(#${id}-c)`} fill={`url(#${id}-g)`}>
          {puffs.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} />)}
        </g>
        <ellipse cx="260" cy="172" rx="256" ry="9" fill={p.cloudBottom} opacity="0.85" />
        <ellipse cx="120" cy="178" rx="130" ry="5" fill={p.cloudBottom} opacity="0.55" />
        <g filter={`url(#${id}-s)`}>{lights.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={p.cloudLight} opacity="0.62" />)}</g>
      </g>
    </svg>
  );
}
