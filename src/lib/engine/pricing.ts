import { inr, round500 } from "./format.ts";
import type { Quote, QuoteStep, UsageKind } from "./types.ts";

export interface QuoteInput {
  avgViews: number;
  nicheRate: number;
  reels: number;
  stories: number;
  posts: number;
  usage: UsageKind;
  exclusivityDays: number | null;
  rush: boolean;
  minReelInr: number;
}

export const STORY_FACTOR = 0.3;
export const POST_FACTOR = 0.6;
export const BUNDLE_DISCOUNT = 0.95;
export const RUSH_UPLIFT = 0.2;
export const BAND = 0.15;
export const WALK_AWAY = 0.75;
export const USAGE_UPLIFT: Record<UsageKind, number> = { organic: 0, unknown: 0, "paid-30": 0.3, "paid-unspecified": 0.3, "paid-90": 0.6, perpetual: 1 };
export const USAGE_LABEL: Record<UsageKind, string> = {
  organic: "Organic use only",
  unknown: "Usage not stated",
  "paid-30": "Paid ads, 30 days",
  "paid-unspecified": "Paid ads, length not stated",
  "paid-90": "Paid ads, 90 days",
  perpetual: "Perpetual usage",
};
export const exclusivityUplift = (days: number | null): number => (!days ? 0 : days <= 30 ? 0.25 : days <= 90 ? 0.5 : days <= 180 ? 0.75 : 1);

// Deterministic, explainable pricing. Every number in the quote traces to a visible step.
export function priceDeal(i: QuoteInput): Quote {
  const steps: QuoteStep[] = [];
  const raw = (i.avgViews / 1000) * 500 * i.nicheRate;
  let anchor = Math.max(1000, raw);
  steps.push({ label: "Reel anchor", value: inr(anchor), note: `${Math.round(i.avgViews).toLocaleString("en-IN")} average views, ₹500 per 1,000, niche factor ${i.nicheRate}` });
  let floorApplied = false;
  if (i.minReelInr > anchor) {
    anchor = i.minReelInr;
    floorApplied = true;
    steps.push({ label: "Your minimum applies", value: inr(anchor), note: "Your deal rules set a higher floor per Reel." });
  }

  const count = i.reels + i.stories + i.posts;
  const base = anchor * (i.reels + STORY_FACTOR * i.stories + POST_FACTOR * i.posts);
  const parts = [i.reels && `${i.reels} Reel${i.reels > 1 ? "s" : ""}`, i.stories && `${i.stories} ${i.stories > 1 ? "Stories" : "Story"} at ${STORY_FACTOR}x`, i.posts && `${i.posts} post${i.posts > 1 ? "s" : ""} at ${POST_FACTOR}x`].filter(Boolean);
  steps.push({ label: "Deliverables", value: inr(base), note: parts.join(" + ") });

  const bundle = count >= 3 ? BUNDLE_DISCOUNT : 1;
  if (bundle < 1) steps.push({ label: "Bundle of 3 or more", value: "-5%", note: "Small discount for a package." });

  const uUse = USAGE_UPLIFT[i.usage];
  const uEx = exclusivityUplift(i.exclusivityDays);
  const uRush = i.rush ? RUSH_UPLIFT : 0;
  if (uUse) steps.push({ label: USAGE_LABEL[i.usage], value: `+${Math.round(uUse * 100)}%` });
  if (uEx) steps.push({ label: `Exclusivity, ${i.exclusivityDays} days`, value: `+${Math.round(uEx * 100)}%` });
  if (uRush) steps.push({ label: "Rush", value: "+20%", note: "Under 72 hours." });

  const mid = base * bundle * (1 + uUse + uEx + uRush);
  const quote: Quote = {
    anchorInr: anchor,
    baseInr: base,
    midInr: mid,
    lowInr: round500(mid * (1 - BAND)),
    highInr: round500(mid * (1 + BAND)),
    walkAwayInr: round500(mid * WALK_AWAY),
    floorApplied,
    steps,
  };
  quote.steps.push({ label: "Range", value: `${inr(quote.lowInr)} to ${inr(quote.highInr)}`, note: "Mid-point plus or minus 15%, rounded to ₹500." });
  quote.steps.push({ label: "Walk-away", value: inr(quote.walkAwayInr), note: "75% of the mid-point. Below this, decline or reduce scope." });
  return quote;
}
