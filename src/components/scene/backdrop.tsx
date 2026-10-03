import type { CSSProperties } from "react";

/*
  Quiet pictures behind sections. Everything here is static, aria-hidden and sits behind the content (see "Backgrounds" in
  globals.css). Colours come from theme tokens, so each picture follows the light and dark themes by itself.
  The treeline, horizon and sky are pure CSS (their images are baked into backdrop.css by scripts/backdrop.mjs).
  Contours, the rising line and the ripples are small SVGs. Their coordinates are rounded to whole numbers, so the
  server and the browser draw exactly the same thing.
*/

/** Far hills and a nearer ridge of trees along the bottom edge of a section. `shift` slides the pattern so no two look alike. */
export function Treeline({ shift = 0 }: { shift?: number }) {
  return <div aria-hidden className="treeline" style={{ "--tl": `${shift}px` } as CSSProperties} />;
}

/** The strip where the afternoon turns to dusk and meets the night scene. */
export function Horizon() {
  return <div aria-hidden className="horizon" />;
}

/** Stars and a faint aurora along the top of a section. Shown in the dark theme only. */
export function Sky() {
  return <div aria-hidden className="sky-deco" />;
}

const TAU = Math.PI * 2;
const int = Math.round;

/** Topographic rings, like the rings of a tree: a closed line that wobbles a little more with every step outwards. */
export function Contours() {
  const cx = 880, cy = 340;
  const harmonics = [
    { k: 2, a: 0.055, p: 0.7, s: 0.09 },
    { k: 3, a: 0.04, p: 2.1, s: 0.07 },
    { k: 4, a: 0.028, p: 4.0, s: 0.11 },
    { k: 6, a: 0.016, p: 1.2, s: 0.05 },
  ];
  const rings = Array.from({ length: 16 }, (_, i) => {
    const R = 64 + i * 50;
    const pts: string[] = [];
    for (let n = 0; n < 84; n++) {
      const t = (n / 84) * TAU;
      let k = 1;
      for (const h of harmonics) k += h.a * Math.sin(h.k * t + h.p + i * h.s * h.k);
      pts.push(`${int(cx + Math.cos(t) * R * k)} ${int(cy + Math.sin(t) * R * k * 0.84)}`);
    }
    return { d: `M${pts.join("L")}Z`, index: i % 5 === 4, o: 1 - i / 24 };
  });
  return (
    <div aria-hidden className="motif-layer">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none" strokeWidth={1.25}>
        {rings.map((r, i) => (
          <path key={i} d={r.d} stroke={r.index ? "var(--motif)" : "var(--motif-soft)"} strokeOpacity={r.o} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

/** A trend line rising from lower left to upper right, with two fainter echoes and a point on the way. */
export function Wave() {
  const line = (j: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 1600; x += 16) {
      const y = 590 - 0.27 * x - j * 54 + 34 * Math.sin(x / 120 + 0.7 + j * 0.9) + 17 * Math.sin(x / 47 + 1.9 * j) + 8 * Math.sin(x / 19 + j);
      pts.push(`${x} ${int(y)}`);
    }
    return pts;
  };
  const main = line(0);
  const dot = main[Math.round(1360 / 16)]!.split(" ").map(Number) as [number, number];
  return (
    <div aria-hidden className="motif-layer">
      <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.13 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={`M${main.join("L")}L1600 700L0 700Z`} fill="url(#wave-fill)" />
        <path d={`M${main.join("L")}`} stroke="var(--motif)" strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        {[1, 2].map((j) => (
          <path key={j} d={`M${line(j).join("L")}`} stroke="var(--motif-soft)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        ))}
        <circle cx={dot[0]} cy={dot[1]} r={5} fill="var(--accent)" fillOpacity={0.55} />
        <circle cx={dot[0]} cy={dot[1]} r={16} stroke="var(--motif)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/** Ripples spreading out from the learning-loop diagram. Place it inside the diagram's own box; it extends beyond it. */
export function Ripples() {
  const radii = [49, 60, 73, 88, 106, 126];
  return (
    <svg aria-hidden viewBox="-100 -100 200 200" className="ripples pointer-events-none absolute -inset-[42%] -z-10 size-[184%]" fill="none">
      {radii.map((r, i) => (
        <circle key={r} cx={0} cy={0} r={r} stroke={i % 2 ? "var(--motif-soft)" : "var(--motif)"} strokeOpacity={1 - i * 0.14} strokeWidth={1.2} strokeDasharray={i === 1 ? "0.8 2.2" : undefined} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
