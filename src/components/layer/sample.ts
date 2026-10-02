import { inr, round500 } from "@/lib/engine/format";
import { getDemo } from "../landing/demo";
import type { SceneSample } from "./scene/types";

/** The sample creator's numbers, taken from the same engines as the app. Server-safe. */
export function getLayerSample(): SceneSample {
  const { ws, insights } = getDemo();
  const proof = insights.hooksRanked[0]!;
  const q = ws.inquiries[0]!.evaluation.quote;
  const top = getDemo().brief.recommended;
  const k = (n: number) => `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return {
    creator: ws.dna.name,
    followers: k(ws.dna.followers),
    audienceLine: "22 to 34 · Pune",
    patternTitle: top?.subject ?? "I replaced X with AI for 7 days",
    proofLift: `${proof.lift.toFixed(1)}x`,
    proofBasis: `${proof.posts} posts`,
    durationSec: `${insights.typicalDurationSec}s`,
    brand: "Tessera",
    offer: inr(ws.inquiries[0]!.extraction.budgetInr ?? 12000),
    quoteShort: `₹${(q.lowInr / 1000).toFixed(1)}K–${Math.round(q.highInr / 1000)}K`,
    quoteLong: `${inr(q.lowInr)} to ${inr(q.highInr)}`,
    walkAway: inr(round500(q.walkAwayInr)),
  };
}
