import type { EtchNode } from "./paint";

export interface Network {
  nodes: EtchNode[];
  links: [number, number, number][];
}

interface Pt {
  x: number;
  y: number;
}

/**
 * The Creator DNA network etched on the glass, in glass-local units. The five signals are the hero nodes; each is wired
 * to the CREO mark by a bright spoke, and the rest of the network thins out away from them. `rnd` is seeded, so the
 * network is identical every run.
 */
export function buildNetwork(w: number, h: number, hero: Pt[], mark: Pt, markHalf: Pt, rnd: () => number): Network {
  const nodes: EtchNode[] = hero.map((p) => ({ ...p, hero: true }));
  const inMark = (x: number, y: number, pad = 0) => ((x - mark.x) / (markHalf.x + pad)) ** 2 + ((y - mark.y) / (markHalf.y + pad)) ** 2 < 1;
  const proxOf = (x: number, y: number) => {
    let d = Infinity;
    for (const p of hero) d = Math.min(d, Math.hypot(p.x - x, p.y - y));
    return Math.exp(-d / 0.95);
  };

  // ports on the mark's outline, one per signal: where the spokes start
  const links: [number, number, number][] = [];
  hero.forEach((p, i) => {
    const a = Math.atan2((p.y - mark.y) / markHalf.y, (p.x - mark.x) / markHalf.x);
    nodes.push({ x: mark.x + Math.cos(a) * (markHalf.x + 0.1), y: mark.y + Math.sin(a) * (markHalf.y + 0.1), hero: false });
    links.push([nodes.length - 1, i, 1]);
  });

  const margin = 0.3;
  const count = Math.round(w * h * 1.5);
  const minD = 0.5;
  let guard = 0;
  while (nodes.length < hero.length * 2 + count && guard++ < 4000) {
    const x = (rnd() - 0.5) * (w - margin * 2);
    const y = (rnd() - 0.5) * (h - margin * 2);
    if (inMark(x, y, 0.35)) continue;
    if (nodes.some((n) => Math.hypot(n.x - x, n.y - y) < minD)) continue;
    nodes.push({ x, y, hero: false });
  }

  const crossesMark = (a: Pt, b: Pt) => {
    for (let t = 0; t <= 1; t += 0.1) if (inMark(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.05)) return true;
    return false;
  };
  const seen = new Set<string>(links.map(([a, b]) => `${Math.min(a, b)}:${Math.max(a, b)}`));
  const first = hero.length * 2; // random nodes start here
  const link = (a: number, b: number) => {
    const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
    if (seen.has(key)) return;
    const A = nodes[a]!;
    const B = nodes[b]!;
    if (crossesMark(A, B) || Math.hypot(A.x - B.x, A.y - B.y) > 1.6) return;
    seen.add(key);
    links.push([a, b, 0.14 + 0.86 * proxOf((A.x + B.x) / 2, (A.y + B.y) / 2)]);
  };
  const candidates = nodes.map((_, i) => i).filter((i) => i < hero.length || i >= first);
  for (const i of candidates) {
    const A = nodes[i]!;
    const near = candidates
      .filter((j) => j !== i)
      .map((j) => ({ j, d: Math.hypot(nodes[j]!.x - A.x, nodes[j]!.y - A.y) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, i < hero.length ? 3 : 2);
    for (const { j } of near) link(i, j);
  }
  return { nodes, links };
}
