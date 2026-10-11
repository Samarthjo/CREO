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

/**
 * A made-up result on the top recommendation: the post gets `lift` times the creator's usual views, and the score of the hook
 * style behind it moves with it. Example numbers from the same engine as the app, never a measured result.
 */
export function demoLesson() {
  const { ws, insights } = getDemo();
  const before = insights.hooksRanked[0]!;
  const base = ws.dna.posts.find((p) => p.hook === "proof-first");
  const lift = 2.2;
  const after = base ? deriveDna({ ...ws.dna, posts: [...ws.dna.posts, { ...base, id: "example", views: Math.round(insights.baseline * lift) }] }).hookLift["proof-first"] : undefined;
  return { hook: before.label, before: before.lift, after: after?.lift ?? before.lift, posts: before.posts, lift };
}
