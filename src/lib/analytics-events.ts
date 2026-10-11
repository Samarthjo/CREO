// What CREO tells its analytics, and the rule that keeps it harmless: events carry choices, counts and yes/no answers, never what a person typed.
// No names, handles, contact details, access codes, topics, message text or reasons are ever sent, only which button, which option, how many.
// This file has no browser code, so the tests can run it. analytics.ts sends what it describes.
import type { Action } from "./store/actions.ts";
import type { Approval, Inquiry } from "./engine/types.ts";

type Failure = "invalid" | "server" | "network";

/** Every event CREO sends, and the only properties each may carry. */
export interface EventMap {
  // the website
  cta_clicked: { id: string; where: string };
  cohort_apply_started: { variant: "short" | "full" };
  cohort_apply_submitted: { variant: "short" | "full"; followers: string; niche?: string; platform?: string; posts_per_week?: string; goal?: string; brand_inquiries?: string; extra_answers: number; has_problem: boolean };
  cohort_apply_failed: { variant: "short" | "full"; reason: Failure; fields?: string };
  contact_submitted: Record<string, never>;
  contact_failed: { reason: Failure; fields?: string };
  // the workspace door
  workspace_unlocked: { via: "code_page" | "lock" };
  workspace_unlock_failed: { reason: "empty" | "wrong_code" | "blocked" | "error" | "network" };
  // the workspace
  profile_created: { niche: string; past_posts: number; past_deals: number };
  profile_updated: { fields: string };
  sample_workspace_reset: Record<string, never>;
  library_item_changed: { item: "past_post" | "past_deal" | "trend_pattern"; change: "added" | "removed" };
  package_generated: { engine: string; length_sec: number; language: string; hooks: number; from_trend: boolean };
  package_updated: { fields: string };
  hook_edit_saved: { field: string; has_reason: boolean };
  package_deleted: Record<string, never>;
  inquiry_added: { source: string; chars: number; health: string; recommendation: string };
  inquiry_updated: { fields: string };
  inquiry_deleted: Record<string, never>;
  approval_requested: { kind: Approval["kind"]; risk: Approval["risk"] };
  approval_decided: { kind: Approval["kind"] | "unknown"; decision: "approved" | "rejected"; has_reason: boolean };
  memory_added: { kind: string; source: string; rule: string };
  memory_removed: Record<string, never>;
}
export type EventName = keyof EventMap;
export type TrackedEvent = { [K in EventName]: [name: K, props: EventMap[K]] }[EventName];

/** The names of the fields that failed, never their values: "contact,name". */
export const fieldList = (errors: Record<string, unknown>): string => Object.keys(errors).sort().join(",");

/** What the cohort application tells us about the creator: the options they picked and how much they filled in, not what they wrote. */
export function applyProps(variant: "short" | "full", a: { followers: string; niche?: string; platform?: string; postsPerWeek?: string; goal?: string; brandInquiries?: string; problem?: string }): EventMap["cohort_apply_submitted"] {
  const optional = [a.niche, a.platform, a.postsPerWeek, a.goal, a.brandInquiries, a.problem];
  return {
    variant,
    followers: a.followers,
    niche: a.niche || undefined,
    platform: a.platform || undefined,
    posts_per_week: a.postsPerWeek || undefined,
    goal: a.goal || undefined,
    brand_inquiries: a.brandInquiries || undefined,
    extra_answers: optional.filter((x) => !!x && String(x).trim() !== "").length,
    has_problem: !!a.problem && a.problem.trim() !== "",
  };
}

/** Why an access attempt failed, from the server's status. */
export const unlockFailure = (status: number): EventMap["workspace_unlock_failed"]["reason"] => (status === 401 ? "wrong_code" : status === 429 ? "blocked" : "error");

/** A click on something marked data-track="id" (and optionally data-track-where="place"). */
export function ctaProps(el: { getAttribute(name: string): string | null }): EventMap["cta_clicked"] | null {
  const id = el.getAttribute("data-track");
  if (!id) return null;
  return { id: id.slice(0, 60), where: (el.getAttribute("data-track-where") ?? "page").slice(0, 60) };
}

/**
 * Describes a workspace change as an event, or nothing when it is not worth one.
 * `approvals` is the workspace's current list, to say which kind of thing was approved.
 */
export function eventForAction(a: Action, approvals: readonly Pick<Approval, "id" | "kind">[]): TrackedEvent | null {
  switch (a.type) {
    case "load": return null;
    case "dna": return ["profile_updated", { fields: Object.keys(a.patch).sort().join(",") }];
    case "post-add": return ["library_item_changed", { item: "past_post", change: "added" }];
    case "post-remove": return ["library_item_changed", { item: "past_post", change: "removed" }];
    case "deal-add": return ["library_item_changed", { item: "past_deal", change: "added" }];
    case "deal-remove": return ["library_item_changed", { item: "past_deal", change: "removed" }];
    case "pattern-add": return ["library_item_changed", { item: "trend_pattern", change: "added" }];
    case "pattern-remove": return ["library_item_changed", { item: "trend_pattern", change: "removed" }];
    case "pkg-add": return ["package_generated", { engine: a.pkg.engine, length_sec: a.pkg.lengthSec, language: a.pkg.language, hooks: a.pkg.hooks.length, from_trend: !!a.pkg.trendId }];
    case "pkg-patch": return ["package_updated", { fields: Object.keys(a.patch).sort().join(",") }];
    case "pkg-edit": return ["hook_edit_saved", { field: a.field, has_reason: a.reason.trim() !== "" }];
    case "pkg-remove": return ["package_deleted", {}];
    case "inq-add": return ["inquiry_added", inquiryProps(a.inquiry)];
    case "inq-patch": return ["inquiry_updated", { fields: Object.keys(a.patch).sort().join(",") }];
    case "inq-remove": return ["inquiry_deleted", {}];
    case "approval-request": return ["approval_requested", { kind: a.approval.kind, risk: a.approval.risk }];
    case "approval-decide": return ["approval_decided", { kind: approvals.find((x) => x.id === a.id)?.kind ?? "unknown", decision: a.decision, has_reason: !!a.reason && a.reason.trim() !== "" }];
    case "memory-add": return ["memory_added", { kind: a.item.kind, source: a.item.source, rule: a.item.rule?.type ?? "none" }];
    case "memory-remove": return ["memory_removed", {}];
  }
}

/** A pasted brand message, described by where it came from, how long it was and what CREO made of it, never by its words. */
export function inquiryProps(q: Pick<Inquiry, "source" | "raw" | "evaluation">): EventMap["inquiry_added"] {
  return { source: q.source, chars: q.raw.length, health: q.evaluation.health, recommendation: q.evaluation.recommendation };
}

/** Events that need a visitor's yes: what they click and how they scroll, as opposed to the plain count of visits. */
export const NEEDS_CONSENT: ReadonlySet<string> = new Set(["$autocapture", "$rageclick", "$dead_click", "$$heatmap", "$heatmap_data", "$snapshot"]);

