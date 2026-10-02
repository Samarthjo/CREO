import { buildBrief } from "@/lib/engine/brief";
import { deriveDna } from "@/lib/engine/dna";
import { rankPatterns } from "@/lib/engine/trend";
import { sampleWorkspace } from "@/lib/store/seed";

// One deterministic sample workspace shared by every landing section. The same engines power the app.
let cache: ReturnType<typeof build> | null = null;
function build() {
  const ws = sampleWorkspace();
  const insights = deriveDna(ws.dna);
  const ranked = rankPatterns(ws.patterns, ws.dna, insights, ws.memory);
  const brief = buildBrief(ws, insights);
  return { ws, insights, ranked, brief };
}
export const getDemo = () => (cache ??= build());

import { buildPackage } from "@/lib/engine/studio";
import type { Language } from "@/lib/engine/types";

export function demoPackage(opts: { topic: string; proof: string; lengthSec: 30 | 45 | 60; language: Language; trendId: string }) {
  const { ws, insights } = getDemo();
  return buildPackage({ ...opts, pattern: ws.patterns.find((p) => p.id === opts.trendId), dna: ws.dna, insights, memory: ws.memory });
}
