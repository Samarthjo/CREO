import { deriveDna } from "@/lib/engine/dna";
import type { Lift } from "@/lib/engine/dna";
import { demoPackage, getDemo } from "../../landing/demo";
import { getLayerSample } from "../sample";

// Everything the five beats show, computed on the server from the same engines as the app. Plain data only.

export interface NetNode {
  id: string;
  kind: "creator" | "hook" | "format";
  /** Words for the readout, e.g. "Proof-first hooks 1.8x". */
  text: string;
  basis: string;
  /** Position in a 100 x 60 box. */
  x: number;
  y: number;
  /** Diameter, in percent of the network's width. */
  d: number;
  best: boolean;
  /** Reveal order, 0 to 1. */
  s: number;
}
export interface NetLink {
  id: string;
  a: string;
  b: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hub: boolean;
  s: number;
}
export interface Network {
  nodes: NetNode[];
  links: NetLink[];
  label: string;
}

export interface StudioData {
  hooks: { id: string; style: string; short: string }[];
  chosen: string;
  /** Script beats as seconds, so the timeline is drawn to scale. */
  segments: { id: string; sec: number }[];
  shots: string[];
  shotsText: string;
  tags: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clip = (s: string, n: number) => {
  const w = s.trim().split(/\s+/);
  return w.length > n ? `${w.slice(0, n).join(" ")}…` : s;
};
const plural = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;
const hyphen = (s: string) => s.replace(/ first$/, "-first");
const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

function buildNetwork(): Network {
  const { ws, insights } = getDemo();
  const hooks = Object.values(insights.hookLift) as Lift[];
  const formats = Object.values(insights.formatLift).sort((a, b) => b.posts - a.posts) as Lift[];
  const best = insights.hooksRanked[0]?.key;
  const cx = 50;
  const cy = 30;
  const at = (rx: number, ry: number, deg: number) => ({ x: round2(cx + rx * Math.cos((deg * Math.PI) / 180)), y: round2(cy + ry * Math.sin((deg * Math.PI) / 180)) });

  const fDeg = new Map(formats.map((f, i) => [f.key, 160 + (360 / formats.length) * i] as const));
  const pairs = new Map<string, number>();
  for (const p of ws.dna.posts) pairs.set(`${p.hook}|${p.format}`, (pairs.get(`${p.hook}|${p.format}`) ?? 0) + 1);

  // Hooks sit on the outer ring, as close as an even spread allows to the formats their posts used.
  const mean = new Map(
    hooks.map((h) => {
      let sx = 0;
      let sy = 0;
      for (const f of formats) {
        const w = pairs.get(`${h.key}|${f.key}`) ?? 0;
        sx += w * Math.cos((fDeg.get(f.key)! * Math.PI) / 180);
        sy += w * Math.sin((fDeg.get(f.key)! * Math.PI) / 180);
      }
      return [h.key, ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360] as const;
    }),
  );
  const order = [...hooks].sort((a, b) => mean.get(a.key)! - mean.get(b.key)!);
  const step = 360 / order.length;
  let offset = 0;
  let cost = Infinity;
  for (let o = 0; o < 360; o += 5) {
    const c = order.reduce((s, h, i) => s + angleDiff(o + i * step, mean.get(h.key)!), 0);
    if (c < cost) [cost, offset] = [c, o];
  }

  const nodes: NetNode[] = [{ id: "creator", kind: "creator", text: `${ws.dna.name}'s Creator DNA`, basis: plural(ws.dna.posts.length), x: cx, y: cy, d: 8.5, best: false, s: 0 }];
  formats.forEach((f, i) => {
    const pos = at(17, 11, fDeg.get(f.key)!);
    nodes.push({ id: f.key, kind: "format", text: `${f.label} ${f.lift.toFixed(1)}x`, basis: plural(f.posts), ...pos, d: round2(3.4 + f.lift * 1.1), best: false, s: round2(0.12 + i * 0.05) });
  });
  order.forEach((h, i) => {
    const pos = at(41, 25, offset + i * step);
    nodes.push({ id: h.key, kind: "hook", text: `${hyphen(h.label)} hooks ${h.lift.toFixed(1)}x`, basis: plural(h.posts), ...pos, d: round2(2.6 + h.lift * 1.3), best: h.key === best, s: round2(0.3 + i * 0.06) });
  });

  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const links: NetLink[] = [];
  const link = (a: string, b: string, hub: boolean, s: number) => {
    const p = byId.get(a)!;
    const q = byId.get(b)!;
    links.push({ id: `${a}-${b}`, a, b, x1: p.x, y1: p.y, x2: q.x, y2: q.y, hub, s: round2(s) });
  };
  for (const f of formats) link("creator", f.key, true, byId.get(f.key)!.s - 0.1);
  for (const h of order) link("creator", h.key, true, byId.get(h.key)!.s - 0.1);
  let i = 0;
  for (const h of order) {
    for (const f of formats) {
      if (!pairs.has(`${h.key}|${f.key}`)) continue;
      link(h.key, f.key, false, 0.55 + (i++ % 8) * 0.05);
    }
  }
  return { nodes, links, label: `Creator DNA network: ${hooks.length} hook types and ${formats.length} formats read from ${ws.dna.posts.length} posts` };
}

function buildStudio(trendId: string): StudioData {
  const pkg = demoPackage({ topic: "competitor research", proof: "", lengthSec: 30, language: "English", trendId });
  const tags = (pkg.caption.match(/#\w+/g) ?? []).slice(0, 2).join(" ");
  return {
    hooks: pkg.hooks.map((h) => ({ id: h.id, style: h.style, short: clip(h.text, 7) })),
    chosen: pkg.chosenHook,
    segments: pkg.script.map((b) => {
      const [from, to] = b.at.replace("s", "").split("-").map(Number);
      return { id: b.id, sec: Math.max(1, (to ?? 0) - (from ?? 0)) };
    }),
    shots: pkg.shots.map((s) => s.kind),
    shotsText: `${pkg.shots.length} shots`,
    tags,
  };
}

let cache: ReturnType<typeof build> | null = null;
function build() {
  const { ws, insights, ranked, brief } = getDemo();
  const sample = getLayerSample();
  const top = brief.recommended;
  const featured = ranked[0]!.pattern;
  const proof = insights.hooksRanked[0]!;

  // Beat 5: the same computation as the rail on the old page. A hypothetical third proof-first post at 2.2x baseline.
  const base = ws.dna.posts.find((p) => p.hook === "proof-first");
  const extra = base ? { ...base, id: "example", views: Math.round(insights.baseline * 2.2) } : null;
  const after = extra ? deriveDna({ ...ws.dna, posts: [...ws.dna.posts, extra] }).hookLift["proof-first"] : undefined;
  const bars = ws.dna.posts.filter((p) => p.hook === "proof-first").map((p) => round2(p.views / insights.baseline));

  const inquiry = ws.inquiries[0]!;
  const ex = inquiry.extraction;
  const q = inquiry.evaluation.quote;
  const flag = ex.signals.find((s) => s.id === "long-exclusivity");
  const lo = 10000;
  const hi = 26000;
  const pos = (n: number) => round2(((n - lo) / (hi - lo)) * 100);
  const memory = ws.memory.find((m) => m.kind === "preference")?.text.match(/^[^.]+\./)?.[0] ?? "";

  return {
    sample,
    sees: {
      title: top?.subject ?? sample.patternTitle,
      fit: top?.fit ?? 0,
      status: featured.status,
      tiles: ws.patterns.map((p) => ({ id: p.id, status: p.status, featured: p.id === featured.id })),
      tilesLabel: `Pattern library: ${ws.patterns.length} patterns. ${ws.patterns.filter((p) => p.status === "rising").length} rising, ${ws.patterns.filter((p) => p.status === "emerging").length} emerging, ${ws.patterns.filter((p) => p.status === "stable").length} stable. One matched.`,
    },
    network: buildNetwork(),
    bestLength: `Best length ${insights.typicalDurationSec} seconds`,
    studio: buildStudio(featured.id),
    deal: {
      brand: ex.brand ?? sample.brand,
      quote: inquiry.raw.match(/Budget:[^\n]+/)?.[0] ?? `Budget: ${sample.offer}`,
      range: sample.quoteLong,
      walkAway: `Walk away below ${sample.walkAway}`,
      flag: flag && ex.exclusivityDays ? `${ex.exclusivityDays}-day exclusivity` : (flag?.label ?? ""),
      // Positions on a 10K to 26K rupee axis, in percent.
      ask: pos(ex.budgetInr ?? 12000),
      walk: pos(q.walkAwayInr),
      from: pos(q.lowInr),
      to: pos(q.highInr),
      label: `Offer ${sample.offer}, below the walk-away price of ${sample.walkAway}. CREO's quote is ${sample.quoteLong}.`,
    },
    learns: {
      bars,
      added: 2.2,
      max: 2.4,
      before: `${proof.lift.toFixed(1)}x`,
      after: after ? `${after.lift.toFixed(1)}x` : "",
      memory,
    },
  };
}

export const getStoryData = () => (cache ??= build());
