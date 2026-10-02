import { inr, round500 } from "./format.ts";
import type { DnaInsights } from "./dna.ts";
import { scopeText } from "./evaluate.ts";
import { rankPatterns } from "./trend.ts";
import { HOOK_TYPES, type Workspace } from "./types.ts";

export interface Action {
  id: string;
  /** What the action is about, shown under the title. */
  subject?: string;
  kind: "create" | "review-deal" | "approve" | "log-result";
  title: string;
  why: string;
  score: number;
  href: string;
  cta: string;
  fit?: number;
}
export interface Brief {
  found: { patterns: number; drafts: number; inquiries: number };
  recommended: Action | null;
  actions: Action[];
}

export function buildBrief(ws: Workspace, ins: DnaInsights): Brief {
  const ranked = rankPatterns(ws.patterns, ws.dna, ins, ws.memory);
  const used = new Set(ws.packages.map((p) => p.trendId).filter(Boolean));
  const actions: Action[] = [];

  ranked.forEach(({ pattern, fit }, i) => {
    if (used.has(pattern.id) || pattern.status === "stable" || fit.score < 60) return;
    const boost = pattern.status === "emerging" ? 12 : 6;
    actions.push({
      id: `create-${pattern.id}`,
      kind: "create",
      title: `Create a Reel from Trend #${i + 1}`,
      subject: pattern.title,
      why: `${pattern.status === "emerging" ? "Emerging now" : "Rising"} with a ${HOOK_TYPES[pattern.mechanism.hook].toLowerCase()} hook. ${fit.parts.find((p) => p.key === "hook")?.note ?? ""} ${fit.parts.find((p) => p.key === "format")?.note ?? ""}`.trim(),
      score: fit.score * 0.7 + boost,
      href: `/app/studio?trend=${pattern.id}`,
      cta: "Open in Studio",
      fit: fit.score,
    });
  });

  for (const q of ws.inquiries.filter((x) => x.status === "new" || x.status === "drafted")) {
    const ev = q.evaluation;
    const total = q.extraction.budgetInr;
    actions.push({
      id: `deal-${q.id}`,
      kind: "review-deal",
      title: `Review the inquiry from ${q.extraction.brand ?? "a new brand"}`,
      subject: `${q.extraction.brand ?? "Brand"} asks for ${scopeText(q.extraction.reels, q.extraction.stories, q.extraction.posts)}`,
      why: ev.health === "avoid" ? `Looks unsafe: ${ev.reasoning.find((r) => /\.$/.test(r)) ?? "check the red flags"}` : `${total ? `They offer ${inr(total)}.` : "No budget stated."} Their terms are worth about ${inr(round500(ev.asked.midInr))}. ${ev.counter.changes.length ? "Counter before you reply." : ""}`.trim(),
      score: 62 + (ev.health === "strong" ? 20 : ev.health === "workable" ? 14 : ev.health === "risky" ? 10 : 4) + (q.extraction.urgent ? 6 : 0),
      href: `/app/collabs?id=${q.id}`,
      cta: "Open Collab Inbox",
    });
  }

  const pending = ws.approvals.filter((a) => a.status === "pending");
  if (pending.length)
    actions.push({
      id: "approvals",
      kind: "approve",
      title: pending.length === 1 ? "Approve 1 item before it goes out" : `Approve ${pending.length} items before they go out`,
      why: "Nothing public or commercial leaves CREO without your approval.",
      score: 66,
      href: "/app/approvals",
      cta: "Open approvals",
    });

  const stale = ws.packages.find((p) => p.status === "approved" && !ws.memory.some((m) => m.kind === "outcome" && m.detail?.ai === p.id));
  if (stale)
    actions.push({
      id: `result-${stale.id}`,
      kind: "log-result",
      title: "Log a result",
      subject: stale.topic,
      why: "Results teach CREO which hooks work for your audience.",
      score: 48,
      href: `/app/memory?log=${stale.id}`,
      cta: "Log result",
    });

  actions.sort((a, b) => b.score - a.score);
  return {
    found: {
      patterns: ranked.filter((r) => r.pattern.status !== "stable" && r.fit.score >= 70).length,
      drafts: ws.packages.filter((p) => p.status === "draft").length,
      inquiries: ws.inquiries.filter((q) => q.status === "new" || q.status === "drafted").length,
    },
    recommended: actions[0] ?? null,
    actions: actions.slice(0, 5),
  };
}
