import { clamp, inr, round500 } from "./format.ts";
import { exclusivityUplift, priceDeal } from "./pricing.ts";
import { NICHES, type CreatorDNA, type Evaluation, type Extraction, type Lever, type UsageKind } from "./types.ts";

export const scopeText = (reels: number, stories: number, posts: number): string => {
  const p = [reels && `${reels} ${reels > 1 ? "Reels" : "Reel"}`, stories && `${stories} ${stories > 1 ? "Stories" : "Story"}`, posts && `${posts} ${posts > 1 ? "posts" : "post"}`].filter(Boolean);
  return p.length ? p.join(" and ") : "1 Reel";
};

const USAGE_RANK: Record<UsageKind, number> = { organic: 0, unknown: 0, "paid-30": 1, "paid-unspecified": 1, "paid-90": 2, perpetual: 3 };
const RULE_RANK = { organic: 0, "paid-30": 1, "paid-90": 2 } as const;

export function evaluateDeal(ex: Extraction, dna: CreatorDNA, raw = ""): Evaluation {
  const { rules } = dna;
  const niche = NICHES[dna.niche];
  const none = ex.reels + ex.stories + ex.posts === 0;
  const reels = none ? 1 : ex.reels;
  const base = { avgViews: dna.avgViews, nicheRate: niche.rate, minReelInr: rules.minReelInr, reels, stories: ex.stories, posts: ex.posts, rush: ex.urgent };

  // What the brand asked for, and what CREO recommends countering with.
  const askedDays = ex.exclusivityAsked ? ex.exclusivityDays ?? 90 : null;
  const asked = priceDeal({ ...base, usage: ex.usage, exclusivityDays: askedDays });
  const usageOver = USAGE_RANK[ex.usage] > RULE_RANK[rules.maxUsage];
  const exclOver = ex.exclusivityAsked && (askedDays ?? 90) > rules.maxExclusivityDays;
  const counterUsage: UsageKind = usageOver ? rules.maxUsage : ex.usage === "paid-unspecified" ? "paid-30" : ex.usage === "unknown" ? "organic" : ex.usage;
  const counterDays = ex.exclusivityAsked ? Math.min(askedDays ?? 90, rules.maxExclusivityDays) : null;
  const quote = priceDeal({ ...base, usage: counterUsage, exclusivityDays: counterDays });
  const changes: string[] = [];
  if (exclOver) changes.push(`Exclusivity cut from ${askedDays} to ${rules.maxExclusivityDays} days.`);
  if (usageOver) changes.push(`Paid usage capped at ${rules.maxUsage === "organic" ? "organic only" : rules.maxUsage === "paid-30" ? "30 days" : "90 days"}.`);
  if (ex.usage === "paid-unspecified") changes.push("Paid usage set to 30 days until they confirm a length.");

  const total = ex.budgetInr ? ex.budgetInr * (ex.budgetPerUnit ? Math.max(1, ex.reels || 1) : 1) : null;
  const ratio = total ? total / asked.midInr : null;
  const barterBlocked = ex.budgetKind === "barter" && !rules.allowBarter;

  let sBudget = 18;
  if (ratio !== null) sBudget = ratio >= 1 ? 40 : ratio >= 0.85 ? 32 : ratio >= 0.7 ? 22 : ratio >= 0.5 ? 12 : 5;
  else if (ex.budgetKind === "barter") sBudget = rules.allowBarter ? 14 : 0;
  else if (ex.budgetKind === "commission") sBudget = 6;

  let sTerms = 25;
  if (ex.usage === "perpetual") sTerms -= 20;
  else if (usageOver) sTerms -= 8;
  if (ex.usage === "unknown" || ex.usage === "paid-unspecified") sTerms -= 3;
  if (exclOver) sTerms -= (askedDays ?? 90) > 90 ? 15 : 10;
  if (ex.unlimitedRevisions) sTerms -= 8;
  sTerms = clamp(sTerms, 0, 25);

  const risks = ex.signals.filter((s) => s.severity === "risk");
  const warns = ex.signals.filter((s) => s.severity === "warn");
  const sLegit = clamp(20 - risks.length * 12 - warns.length * 5 - (ex.brand ? 0 : 5), 0, 20);

  const hay = raw.toLowerCase();
  const matches = niche.tags.filter((t) => new RegExp(`\\b${t}`).test(hay)).length;
  const sFit = matches >= 2 ? 15 : matches === 1 ? 11 : 6;
  const fitNote = matches >= 2 ? "The brand's category matches your niche." : matches === 1 ? "Some overlap with your niche." : "No clear link to your niche. Check the fit before replying.";

  const score = Math.round(sBudget + sTerms + sLegit + sFit);
  const health: Evaluation["health"] = risks.length ? "avoid" : score >= 75 ? "strong" : score >= 55 ? "workable" : score >= 35 ? "risky" : "avoid";

  let recommendation: Evaluation["recommendation"] = "counter";
  if (health === "avoid") recommendation = "decline";
  else if (ex.budgetKind === "unknown") recommendation = "clarify";
  else if (total !== null && total >= quote.midInr * 0.95 && !changes.length && ex.usage !== "perpetual") recommendation = "accept";

  const levers: Lever[] = [];
  if (recommendation !== "accept") levers.push({ label: "Price", ask: `Quote ${inr(quote.lowInr)} to ${inr(quote.highInr)} with your terms.` });
  if (total && total < quote.midInr * 0.95) {
    const fit = ([[1, 2], [1, 1], [1, 0]] as const).find(([r, s]) => priceDeal({ ...base, reels: r, stories: s, posts: 0, usage: "organic", exclusivityDays: null, rush: false }).midInr <= total * 1.05);
    levers.push({ label: "Scope", ask: fit ? `At ${inr(total)}, offer ${scopeText(fit[0], fit[1], 0)}, organic use, no exclusivity.` : `Even one organic Reel prices above ${inr(total)}. Hold the quote or decline.` });
  }
  if (exclOver) levers.push({ label: "Exclusivity", ask: `Keep it to ${rules.maxExclusivityDays} days. ${askedDays} days would add ${Math.round(exclusivityUplift(askedDays) * 100)}% to the price.` });
  if (usageOver || ex.usage === "paid-unspecified") levers.push({ label: "Usage", ask: "Price paid usage as an add-on: +30% for 30 days, +60% for 90 days." });
  if (barterBlocked) levers.push({ label: "Gifting", ask: `Counter the gift with a paid fee from ${inr(quote.lowInr)}, or a hybrid of fee and product.` });
  if (!ex.paymentTerms) levers.push({ label: "Payment", ask: "Ask for 50% on confirmation and the balance within 7 days of posting." });
  if (ex.unlimitedRevisions || ex.revisions === null) levers.push({ label: "Revisions", ask: "Include one round of revisions. Extra rounds are billed." });

  const reasoning: string[] = [];
  if (total && ratio !== null) reasoning.push(`Their budget of ${inr(total)} is ${Math.round(ratio * 100)}% of the ${inr(round500(asked.midInr))} these terms are worth.`);
  else if (ex.budgetKind === "barter") reasoning.push(barterBlocked ? "No cash offered, and your deal rules do not allow gifting-only work." : "No cash offered. Gifting only.");
  else if (ex.budgetKind === "commission") reasoning.push("Commission only. There is no fixed fee for your time.");
  else reasoning.push("No budget stated. Ask for it before you quote.");
  if (exclOver) reasoning.push(`${askedDays} days of exclusivity adds ${Math.round(exclusivityUplift(askedDays) * 100)}% to a fair price. Your rule allows ${rules.maxExclusivityDays} days.`);
  if (ex.usage === "perpetual") reasoning.push("Perpetual usage lets them run your content as ads with no end date.");
  else if (ex.usage === "paid-30" || ex.usage === "paid-90") reasoning.push(`Paid usage for ${ex.usageDays} days adds ${ex.usage === "paid-30" ? 30 : 60}% to the price.`);
  else if (ex.usage === "paid-unspecified") reasoning.push("They want paid usage but give no length. Ask before you price it.");
  if (risks[0]) reasoning.push(`${risks[0].label}. ${risks[0].detail}`);
  else if (warns[0] && reasoning.length < 4) reasoning.push(`${warns[0].label}. ${warns[0].detail}`);
  else if (ex.brand && !none && reasoning.length < 4) reasoning.push("Looks like a real brief: a named company and a clear scope.");
  if (reasoning.length < 5) reasoning.push(fitNote);
  if (ex.missing.length && reasoning.length < 5) reasoning.push(`Still missing: ${ex.missing.slice(0, 3).join(", ").toLowerCase()}.`);

  return { health, score, quote, asked, counter: { usage: counterUsage, exclusivityDays: counterDays, changes }, recommendation, reasoning: reasoning.slice(0, 5), levers: levers.slice(0, 4), fitNote };
}
