import { mean, median } from "./format.ts";
import { FORMATS, HOOK_TYPES, type CreatorDNA, type FormatKey, type HookType } from "./types.ts";

export interface Lift {
  key: string;
  label: string;
  lift: number;
  posts: number;
  avgViews: number;
}
export interface DnaInsights {
  baseline: number;
  hookLift: Partial<Record<HookType, Lift>>;
  formatLift: Partial<Record<FormatKey, Lift>>;
  hooksRanked: Lift[];
  typicalDurationSec: number;
  winners: CreatorDNA["posts"];
  saveRate: number;
  lines: string[];
}

const lift = (key: string, label: string, views: number[], baseline: number): Lift => ({
  key,
  label,
  lift: baseline ? mean(views) / baseline : 1,
  posts: views.length,
  avgViews: mean(views),
});

export function deriveDna(dna: CreatorDNA): DnaInsights {
  const baseline = dna.avgViews || median(dna.posts.map((p) => p.views)) || 1;
  const hookLift: DnaInsights["hookLift"] = {};
  const formatLift: DnaInsights["formatLift"] = {};

  for (const key of Object.keys(HOOK_TYPES) as HookType[]) {
    const v = dna.posts.filter((p) => p.hook === key).map((p) => p.views);
    if (v.length) hookLift[key] = lift(key, HOOK_TYPES[key], v, baseline);
  }
  for (const key of Object.keys(FORMATS) as FormatKey[]) {
    const v = dna.posts.filter((p) => p.format === key).map((p) => p.views);
    if (v.length) formatLift[key] = lift(key, FORMATS[key], v, baseline);
  }

  const hooksRanked = Object.values(hookLift).sort((a, b) => b.lift - a.lift);
  const winners = dna.posts.filter((p) => p.views / baseline >= 1.5).sort((a, b) => b.views - a.views);
  const top = [...dna.posts].sort((a, b) => b.views - a.views).slice(0, 4);
  const typicalDurationSec = Math.round(median(top.map((p) => p.durationSec)) || 25);
  const totalViews = dna.posts.reduce((a, p) => a + p.views, 0) || 1;
  const saveRate = dna.posts.reduce((a, p) => a + p.saves, 0) / totalViews;

  const lines: string[] = [];
  const best = hooksRanked[0];
  if (best && best.lift >= 1.15) lines.push(`${best.label} openings run at ${best.lift.toFixed(1)}x your baseline views (${best.posts} ${best.posts === 1 ? "post" : "posts"}).`);
  const worst = hooksRanked[hooksRanked.length - 1];
  if (worst && worst.key !== best?.key && worst.lift < 0.8) lines.push(`${worst.label} openings sit at ${worst.lift.toFixed(1)}x. Use them sparingly.`);
  const bestFormat = Object.values(formatLift).sort((a, b) => b.lift - a.lift)[0];
  if (bestFormat) lines.push(`${bestFormat.label} is your strongest format at ${bestFormat.lift.toFixed(1)}x.`);
  lines.push(`Your best posts run about ${typicalDurationSec} seconds.`);

  return { baseline, hookLift, formatLift, hooksRanked, typicalDurationSec, winners, saveRate, lines };
}
