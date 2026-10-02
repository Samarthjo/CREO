import type { CSSProperties, ReactNode } from "react";
import { cn } from "../ui/kit";
import { fbm, noise1, polyPath, r1, ridge, rng, smoothstep } from "./noise";
import { paletteFor, type Look, type Palette, type Time } from "./palette";

/*
  The CREO scene: an original, procedurally drawn mountain-and-lake world in three layers.
  Every layer is its own element so a painted PNG/WebP can replace it later without touching layout
  (see docs/design-direction.md section 11). Server component: output is deterministic, no hydration drift.
  Two looks. "classic" is the original pastel scene with scroll parallax, kept for /classic. "calm" is the site's scene: muted
  slate, forest and cream, one light direction, varied trees (a few near ones sway), still mountains and water, no parallax.
*/
const W = 1600;
const H = 900;
const SHORE = 620;

const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

function pine(x: number, y: number, h: number, r: () => number) {
  const tiers = 5;
  const trunk = h * 0.07;
  const body = h - trunk;
  const right: string[] = [];
  const left: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const yb = y - h + body * (0.3 + 0.7 * ((i + 1) / tiers));
    const w = h * 0.2 * (0.45 + 0.55 * ((i + 1) / tiers));
    right.push(`${r1(x + w * (0.9 + 0.25 * r()))} ${r1(yb)}`, `${r1(x + w * 0.3)} ${r1(yb - h * 0.025)}`);
    left.unshift(`${r1(x - w * 0.3)} ${r1(yb - h * 0.025)}`, `${r1(x - w * (0.9 + 0.25 * r()))} ${r1(yb)}`);
  }
  const apex = `${r1(x)} ${r1(y - h)}`;
  const full = `M${apex}L${right.join("L")}L${r1(x + h * 0.02)} ${r1(y - trunk)}L${r1(x + h * 0.02)} ${r1(y)}L${r1(x - h * 0.02)} ${r1(y)}L${r1(x - h * 0.02)} ${r1(y - trunk)}L${left.join("L")}Z`;
  const lit = `M${apex}L${[...left].reverse().join("L")}L${r1(x)} ${r1(y - trunk)}Z`;
  return { full, lit };
}

function rock(cx: number, cy: number, rx: number, ry: number, r: () => number) {
  const pts: string[] = [];
  const n = 8;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rad = 0.78 + 0.3 * r();
    pts.push(`${r1(cx + Math.cos(a) * rx * rad)} ${r1(Math.min(cy + Math.sin(a) * ry * rad, cy + ry * 0.4))}`);
  }
  const lit = pts.map((p) => {
    const [px, py] = p.split(" ").map(Number) as [number, number];
    return `${r1(cx + (px - cx) * 0.72 - rx * 0.1)} ${r1(cy + (py - cy) * 0.7 - ry * 0.16)}`;
  });
  return { full: `M${pts.join("L")}Z`, lit: `M${lit.join("L")}Z` };
}

/** A conifer with its own tier count, slenderness and lean, so no two in a row repeat. Returns the whole tree and its two halves. */
function conifer(x: number, y: number, h: number, r: () => number, o: { tiers?: number; slim?: number; lean?: number }) {
  const tiers = o.tiers ?? 5;
  const slim = o.slim ?? 0.2;
  const ax = x + (o.lean ?? 0) * h;
  const trunk = h * 0.07;
  const body = h - trunk;
  const right: string[] = [];
  const left: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const t = (i + 1) / tiers;
    const yb = y - h + body * (0.3 + 0.7 * t);
    const cx = ax + (x - ax) * t;
    const wr = h * slim * (0.42 + 0.58 * t) * (0.88 + 0.24 * r());
    const wl = h * slim * (0.42 + 0.58 * t) * (0.88 + 0.24 * r());
    const notch = h * 0.026 * (0.6 + 0.8 * r());
    right.push(`${r1(cx + wr)} ${r1(yb)}`, `${r1(cx + wr * 0.32)} ${r1(yb - notch)}`);
    left.unshift(`${r1(cx - wl * 0.32)} ${r1(yb - notch)}`, `${r1(cx - wl)} ${r1(yb)}`);
  }
  const apex = `${r1(ax)} ${r1(y - h)}`;
  const tw = Math.max(1, h * 0.022);
  const full = `M${apex}L${right.join("L")}L${r1(x + tw)} ${r1(y - trunk)}L${r1(x + tw)} ${r1(y)}L${r1(x - tw)} ${r1(y)}L${r1(x - tw)} ${r1(y - trunk)}L${left.join("L")}Z`;
  return { full, left: `M${apex}L${[...left].reverse().join("L")}L${r1(x)} ${r1(y - trunk)}Z`, right: `M${apex}L${right.join("L")}L${r1(x)} ${r1(y - trunk)}Z` };
}

/** A rounded broadleaf crown: a cluster of overlapping circles on a thin trunk. Same return shape as conifer(). */
function broadleaf(x: number, y: number, h: number, r: () => number) {
  const cy = y - h * 0.62;
  const blobs = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + r() * 0.8;
    const d = h * (0.1 + 0.12 * r());
    return { cx: x + Math.cos(a) * d * 1.25, cy: cy + Math.sin(a) * d * 0.8, rr: h * (0.17 + 0.1 * r()) };
  });
  blobs.push({ cx: x, cy: cy - h * 0.04, rr: h * 0.27 });
  const circle = (c: { cx: number; cy: number; rr: number }) => `M${r1(c.cx - c.rr)} ${r1(c.cy)}a${r1(c.rr)} ${r1(c.rr)} 0 1 0 ${r1(2 * c.rr)} 0a${r1(c.rr)} ${r1(c.rr)} 0 1 0 ${r1(-2 * c.rr)} 0Z`;
  const tw = Math.max(0.8, h * 0.03);
  const trunk = `M${r1(x - tw)} ${r1(y)}L${r1(x - tw)} ${r1(cy)}L${r1(x + tw)} ${r1(cy)}L${r1(x + tw)} ${r1(y)}Z`;
  const full = trunk + blobs.map(circle).join("");
  const half = (side: number) => blobs.map((c) => circle({ cx: c.cx + side * c.rr * 0.3, cy: c.cy - c.rr * 0.22, rr: c.rr * 0.62 })).join("");
  return { full, left: half(-1), right: half(1) };
}

function Back({ id, p, calm, dir }: { id: string; p: Palette; calm: boolean; dir: number }) {
  const far = ridge({ seed: 11, width: 1700, base: 622, amp: 360, freq: 0.0042, oct: 5, ridged: true, envelope: (x) => Math.min(1.12, 0.5 + 0.5 * (bump(x, 1250, 340) + 0.62 * bump(x, 300, 270))) });
  const mid = ridge({ seed: 29, width: 1700, base: 628, amp: 225, freq: 0.0058, oct: 4, envelope: (x) => 0.6 + 0.4 * bump(x, 760, 430) });
  const farPath = polyPath(far, 700);
  const midPath = polyPath(mid, 700);
  const sn = noise1(7);
  const snowLine = 430;
  const top = far.map(([x, y]) => `${x} ${y}`);
  const bottom = [...far].reverse().map(([x, y]) => `${x} ${r1(Math.max(y, snowLine + (fbm(sn, x * 0.03, 2) - 0.5) * 56))}`);
  const snow = `M${top.join("L")}L${bottom.join("L")}Z`;

  const r = rng(5);
  const stars = p.moon ? Array.from({ length: 70 }, (_, i) => ({ x: r1(r() * W), y: r1(r() * 360), s: r1(0.6 + r() * 1.3), o: r1(0.35 + r() * 0.65), t: i % 6 === 0 })) : [];
  const gx = p.sunX * W;
  const glints = Array.from({ length: 22 }, () => ({ x: r1(gx + (r() - 0.5) * 520 * (0.4 + r())), y: r1(SHORE + 24 + r() * 230), rx: r1(24 + r() * 130), o: r1(0.25 + r() * 0.5) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.skyTop} /><stop offset="0.55" stopColor={p.skyMid} /><stop offset="1" stopColor={p.skyLow} /></linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={p.glow} stopOpacity={p.glowOpacity} /><stop offset="1" stopColor={p.glow} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.haze} stopOpacity="0" /><stop offset="1" stopColor={p.haze} stopOpacity="0.9" /></linearGradient>
        <linearGradient id={`${id}-lake`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.lakeTop} /><stop offset="1" stopColor={p.lakeLow} /></linearGradient>
        <clipPath id={`${id}-farc`}><path d={farPath} /></clipPath>
        <clipPath id={`${id}-midc`}><path d={midPath} /></clipPath>
        <clipPath id={`${id}-lakec`}><rect x="0" y={SHORE} width={W} height={H - SHORE} /></clipPath>
        <filter id={`${id}-blur`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect width={W} height={SHORE + 4} fill={`url(#${id}-sky)`} />
      {p.moon ? (
        <>
          <circle cx={gx} cy={200} r={300} fill={`url(#${id}-glow)`} />
          <circle cx={gx} cy={200} r={30} fill="#eef1ff" />
        </>
      ) : (
        <circle cx={gx} cy={SHORE - 30} r={760} fill={`url(#${id}-glow)`} />
      )}
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />)}

      <path d={farPath} fill={p.farShade} />
      <g clipPath={`url(#${id}-farc)`}><path d={farPath} transform={`translate(${34 * dir} 0)`} fill={p.farLit} /></g>
      <path d={snow} fill={p.farSnow} opacity="0.92" />
      <rect x="0" y="380" width={W} height="250" fill={`url(#${id}-haze)`} opacity="0.38" />

      <path d={midPath} fill={p.midShade} />
      <g clipPath={`url(#${id}-midc)`}><path d={midPath} transform={`translate(${26 * dir} 0)`} fill={p.midLit} /></g>
      <rect x="0" y="500" width={W} height={SHORE - 500 + 6} fill={`url(#${id}-haze)`} opacity="0.6" />

      <rect x="0" y={SHORE} width={W} height={H - SHORE} fill={`url(#${id}-lake)`} />
      <g clipPath={`url(#${id}-lakec)`}>
        <g transform={`translate(0 ${SHORE * 2}) scale(1 -1)`} opacity="0.3" filter={`url(#${id}-blur)`}>
          <path d={farPath} fill={p.farShade} />
          <path d={midPath} fill={p.midShade} />
        </g>
        {glints.map((g, i) => <ellipse key={i} cx={g.x} cy={g.y} rx={g.rx} ry={i % 3 ? 1.4 : 2.2} fill={p.glint} opacity={g.o} />)}
      </g>
    </svg>
  );
}

function MidClassic({ p }: { p: Palette }) {
  const r = rng(41);
  const shore = ridge({ seed: 53, base: 634, amp: 52, freq: 0.006, oct: 3, envelope: (x) => smoothstep(480, 640, x) * (1 - smoothstep(1420, 1560, x)) });
  const trees: string[] = [];
  const treeLit: string[] = [];
  for (let x = 500; x < 1540; x += 14 + r() * 12) {
    const base = shore[Math.round(x / 10)]?.[1] ?? 634;
    if (base > 631) continue;
    const t = pine(x, base + 6, 26 + r() * 30, r);
    trees.push(t.full);
    treeLit.push(t.lit);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full" aria-hidden focusable="false">
      <path d={polyPath(shore, 646)} fill={p.shore} />
      <path d={trees.join("")} fill={p.shore} />
      <path d={treeLit.join("")} fill={p.shoreLit} opacity="0.7" />
      <ellipse cx="1010" cy="640" rx="640" ry="16" fill={p.haze} opacity="0.32" />
    </svg>
  );
}

function MidCalm({ id, p, dir }: { id: string; p: Palette; dir: number }) {
  const r = rng(41);
  const n = noise1(61);
  const shore = ridge({ seed: 53, base: 634, amp: 52, freq: 0.006, oct: 3, envelope: (x) => smoothstep(480, 640, x) * (1 - smoothstep(1420, 1560, x)) });
  const body: string[] = [];
  const lit: string[] = [];
  const shade: string[] = [];
  // Irregular spacing: tight groves, then a gap. Height follows a slow noise, so groves rise and fall.
  for (let x = 500; x < 1540; ) {
    x += 6 + r() * 24 + (r() < 0.1 ? 36 + r() * 56 : 0);
    const base = shore[Math.round(x / 10)]?.[1] ?? 634;
    if (base > 631) continue;
    const grove = fbm(n, x * 0.012, 2);
    const h = 16 + 44 * grove * (0.7 + 0.5 * r());
    const t = r() < 0.22 ? broadleaf(x, base + 6, h * 0.9, r) : conifer(x, base + 6, h, r, { tiers: 4 + Math.floor(r() * 3), slim: 0.13 + r() * 0.09, lean: (r() - 0.5) * 0.05 });
    body.push(t.full);
    lit.push(dir < 0 ? t.left : t.right);
    shade.push(dir < 0 ? t.right : t.left);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full" aria-hidden focusable="false">
      <defs><filter id={`${id}-soft`} x="-2%" y="-10%" width="104%" height="120%"><feGaussianBlur stdDeviation="0.8" /></filter></defs>
      <path d={polyPath(shore, 646)} fill={p.shore} />
      <g filter={`url(#${id}-soft)`}>
        <path d={body.join("")} fill={p.shore} />
        <path d={lit.join("")} fill={p.shoreLit} opacity="0.7" />
        <path d={shade.join("")} fill={p.treeShade ?? p.pine} opacity="0.3" />
      </g>
      <ellipse cx="1010" cy="640" rx="640" ry="16" fill={p.haze} opacity="0.32" />
    </svg>
  );
}

function NearClassic({ id, p }: { id: string; p: Palette }) {
  const r = rng(77);
  const n = noise1(97);
  const leftTop = (x: number) => 505 + 365 * Math.pow(smoothstep(0, 780, x), 1.25) + (fbm(n, x * 0.012, 3) - 0.5) * 38;
  const rightTop = (x: number) => 890 - 250 * Math.pow(smoothstep(1020, 1600, x), 1.1) + (fbm(n, x * 0.012 + 40, 3) - 0.5) * 38;
  const leftPts: [number, number][] = [];
  for (let x = 0; x <= 790; x += 10) leftPts.push([x, r1(leftTop(x))]);
  const rightPts: [number, number][] = [];
  for (let x = 1010; x <= 1610; x += 10) rightPts.push([x, r1(rightTop(x))]);
  const leftPath = `M0 ${H + 20}L${leftPts.map(([x, y]) => `${x} ${y}`).join("L")}L790 ${H + 20}Z`;
  const rightPath = `M1010 ${H + 20}L${rightPts.map(([x, y]) => `${x} ${y}`).join("L")}L1610 ${H + 20}Z`;

  const dabs = (pts: [number, number][], x0: number, x1: number, count: number) =>
    Array.from({ length: count }, () => {
      const x = x0 + r() * (x1 - x0);
      const top = pts.find(([px]) => px >= x)?.[1] ?? H;
      return { x: r1(x), y: r1(top + 14 + r() * Math.max(10, H - top - 30)), rx: r1(14 + r() * 56), ry: r1(3 + r() * 9), o: r1(0.18 + r() * 0.4) };
    });
  const lDabs = dabs(leftPts, 0, 780, 46);
  const rDabs = dabs(rightPts, 1020, 1600, 36);

  const flowers = (pts: [number, number][], x0: number, x1: number, count: number) =>
    Array.from({ length: count }, () => {
      const x = x0 + r() * (x1 - x0);
      const top = pts.find(([px]) => px >= x)?.[1] ?? H;
      return { x: r1(x), y: r1(top + 6 + r() * 120), s: r1(1.4 + r() * 2.4), o: r1(0.6 + r() * 0.4) };
    });
  const lFlowers = flowers(leftPts, 0, 760, 70);
  const rFlowers = flowers(rightPts, 1030, 1600, 50);

  const lPines = [[34, 1.0], [150, 0.78], [262, 0.52], [352, 0.34]].map(([x, s]) => pine(x!, leftTop(x!) + 22, 330 * s!, r));
  const rPines = [[1500, 0.62], [1410, 0.44], [1548, 0.36]].map(([x, s]) => pine(x!, rightTop(x!) + 18, 260 * s!, r));
  const rocks = [
    rock(430, leftTop(430) + 40, 74, 34, r), rock(230, leftTop(230) + 90, 54, 26, r), rock(610, leftTop(610) + 52, 46, 20, r),
    rock(1210, rightTop(1210) + 34, 62, 26, r), rock(1460, rightTop(1460) + 70, 82, 34, r), rock(1330, 876, 90, 28, r),
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.bankLit} /><stop offset="1" stopColor={p.bankShade} /></linearGradient>
        <clipPath id={`${id}-lbc`}><path d={leftPath} /></clipPath>
        <clipPath id={`${id}-rbc`}><path d={rightPath} /></clipPath>
      </defs>
      <path d={leftPath} fill={`url(#${id}-bank)`} />
      <path d={rightPath} fill={`url(#${id}-bank)`} />
      <g clipPath={`url(#${id}-lbc)`}>{lDabs.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill={p.bankDab} opacity={d.o} />)}</g>
      <g clipPath={`url(#${id}-rbc)`}>{rDabs.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill={p.bankDab} opacity={d.o} />)}</g>
      {rocks.map((k, i) => (
        <g key={i}><path d={k.full} fill={p.rock} /><path d={k.lit} fill={p.rockLit} opacity="0.85" /></g>
      ))}
      {[...lFlowers, ...rFlowers].map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.s} fill={p.flower} opacity={f.o} />)}
      {[...rPines, ...lPines].map((t, i) => (
        <g key={i}><path d={t.full} fill={p.pine} /><path d={t.lit} fill={p.pineLit} opacity="0.85" /></g>
      ))}
    </svg>
  );
}

type Tree = { side: "l" | "r"; x: number; s: number; kind: "c" | "b"; tiers?: number; slim?: number; lean?: number; sway?: [number, number] };
// Varied by hand: heights, species, slenderness and spacing differ. Three of the near ones sway, each on its own timing.
const TREES: Tree[] = [
  { side: "l", x: 22, s: 1.0, kind: "c", tiers: 6, slim: 0.17, lean: 0.02, sway: [9.4, -2.1] },
  { side: "l", x: 104, s: 0.62, kind: "b" },
  { side: "l", x: 166, s: 0.84, kind: "c", tiers: 5, slim: 0.21, lean: -0.015, sway: [11.2, -6.4] },
  { side: "l", x: 246, s: 0.46, kind: "c", tiers: 4, slim: 0.19 },
  { side: "l", x: 306, s: 0.56, kind: "b" },
  { side: "l", x: 378, s: 0.3, kind: "c", tiers: 4, slim: 0.2, lean: 0.03 },
  { side: "r", x: 1496, s: 0.68, kind: "c", tiers: 6, slim: 0.16, lean: -0.02, sway: [8.3, -4.2] },
  { side: "r", x: 1420, s: 0.4, kind: "b" },
  { side: "r", x: 1558, s: 0.48, kind: "c", tiers: 5, slim: 0.2, lean: 0.02 },
  { side: "r", x: 1352, s: 0.26, kind: "c", tiers: 4, slim: 0.18 },
];

function NearCalm({ id, p, dir }: { id: string; p: Palette; dir: number }) {
  const r = rng(77);
  const n = noise1(97);
  const leftTop = (x: number) => 505 + 365 * Math.pow(smoothstep(0, 780, x), 1.25) + (fbm(n, x * 0.012, 3) - 0.5) * 38;
  const rightTop = (x: number) => 890 - 250 * Math.pow(smoothstep(1020, 1600, x), 1.1) + (fbm(n, x * 0.012 + 40, 3) - 0.5) * 38;
  const leftPts: [number, number][] = [];
  for (let x = 0; x <= 790; x += 10) leftPts.push([x, r1(leftTop(x))]);
  const rightPts: [number, number][] = [];
  for (let x = 1010; x <= 1610; x += 10) rightPts.push([x, r1(rightTop(x))]);
  const leftPath = `M0 ${H + 20}L${leftPts.map(([x, y]) => `${x} ${y}`).join("L")}L790 ${H + 20}Z`;
  const rightPath = `M1010 ${H + 20}L${rightPts.map(([x, y]) => `${x} ${y}`).join("L")}L1610 ${H + 20}Z`;

  const dabs = (pts: [number, number][], x0: number, x1: number, count: number) =>
    Array.from({ length: count }, () => {
      const x = x0 + r() * (x1 - x0);
      const top = pts.find(([px]) => px >= x)?.[1] ?? H;
      return { x: r1(x), y: r1(top + 14 + r() * Math.max(10, H - top - 30)), rx: r1(14 + r() * 56), ry: r1(3 + r() * 9), o: r1(0.14 + r() * 0.3) };
    });
  const lDabs = dabs(leftPts, 0, 780, 40);
  const rDabs = dabs(rightPts, 1020, 1600, 30);

  const rocks = [
    rock(430, leftTop(430) + 40, 74, 34, r), rock(230, leftTop(230) + 90, 54, 26, r), rock(610, leftTop(610) + 52, 46, 20, r),
    rock(1210, rightTop(1210) + 34, 62, 26, r), rock(1460, rightTop(1460) + 70, 82, 34, r), rock(1330, 876, 90, 28, r),
  ];
  const trees = TREES.map((t) => {
    const base = (t.side === "l" ? leftTop(t.x) : rightTop(t.x)) + 20;
    const h = 330 * t.s;
    const shape = t.kind === "c" ? conifer(t.x, base, h, r, { tiers: t.tiers, slim: t.slim, lean: t.lean }) : broadleaf(t.x, base, h * 0.8, r);
    return { ...t, ...shape };
  });
  const crown = (k: "c" | "b") => (k === "c" ? p.pine : p.crown ?? p.pine);
  const crownLit = (k: "c" | "b") => (k === "c" ? p.pineLit : p.crownLit ?? p.pineLit);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.bankLit} /><stop offset="1" stopColor={p.bankShade} /></linearGradient>
        <clipPath id={`${id}-lbc`}><path d={leftPath} /></clipPath>
        <clipPath id={`${id}-rbc`}><path d={rightPath} /></clipPath>
      </defs>
      <path d={leftPath} fill={`url(#${id}-bank)`} />
      <path d={rightPath} fill={`url(#${id}-bank)`} />
      <g clipPath={`url(#${id}-lbc)`}>{lDabs.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill={p.bankDab} opacity={d.o} />)}</g>
      <g clipPath={`url(#${id}-rbc)`}>{rDabs.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill={p.bankDab} opacity={d.o} />)}</g>
      {rocks.map((k, i) => (
        <g key={i}><path d={k.full} fill={p.rock} /><path d={k.lit} fill={p.rockLit} opacity="0.8" /></g>
      ))}
      {trees.map((t, i) => (
        <g key={i} className={t.sway ? "sway" : undefined} style={t.sway ? ({ "--dur": `${t.sway[0]}s`, "--delay": `${t.sway[1]}s` } as CSSProperties) : undefined}>
          <path d={t.full} fill={crown(t.kind)} />
          <path d={dir < 0 ? t.left : t.right} fill={crownLit(t.kind)} opacity="0.85" />
          <path d={dir < 0 ? t.right : t.left} fill={p.treeShade ?? p.pine} opacity="0.32" />
        </g>
      ))}
    </svg>
  );
}

function Layer({ px, children, still }: { px: number; children: ReactNode; still?: boolean }) {
  if (still) return <div aria-hidden className="absolute inset-0">{children}</div>;
  return (
    <div aria-hidden className="px absolute inset-x-0" style={{ "--px": `${px}px`, top: -px, bottom: -px } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * `sky` is drawn between the mountains and the trees, so clouds pass behind the foreground instead of over it.
 * `fadeTop="long"` lets the sky dissolve into the page over the top half, which keeps hero text clear of the peaks.
 */
export function Landscape({ time, look = "calm", className, children, sky, fadeTop = true, id }: { time: Time; look?: Look; className?: string; children?: ReactNode; sky?: ReactNode; fadeTop?: boolean | "long"; id?: string }) {
  const calm = look === "calm";
  const p = paletteFor(time, look);
  const uid = id ?? `ls-${look}-${time}`;
  const dir = calm && p.sunX >= 0.5 ? 1 : -1;
  return (
    <div className={cn("isolate overflow-hidden", !/\b(absolute|fixed|relative|sticky)\b/.test(className ?? "") && "relative", fadeTop === "long" ? "scene-fade-long" : fadeTop && "scene-fade-top", className)} data-time={time} data-look={look}>
      <Layer px={14} still={calm}><Back id={uid} p={p} calm={calm} dir={dir} /></Layer>
      {sky}
      <Layer px={30} still={calm}>{calm ? <MidCalm id={uid} p={p} dir={dir} /> : <MidClassic p={p} />}</Layer>
      <Layer px={58} still={calm}>{calm ? <NearCalm id={uid} p={p} dir={dir} /> : <NearClassic id={uid} p={p} />}</Layer>
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}
