import { deriveDna } from "../engine/dna.ts";
import { evaluateDeal } from "../engine/evaluate.ts";
import { makeDraft } from "../engine/draft.ts";
import { extractInquiry } from "../engine/extract.ts";
import { buildPackage } from "../engine/studio.ts";
import { LIBRARY } from "../engine/trend.ts";
import { mean } from "../engine/format.ts";
import type { CreatorDNA, Inquiry, MemoryItem, PastPost, Workspace } from "../engine/types.ts";

const post = (n: number, title: string, hook: PastPost["hook"], format: PastPost["format"], durationSec: number, views: number, saves: number, shares: number, comments: number, postedOn: string): PastPost =>
  ({ id: `post-${n}`, title, hook, format, durationSec, views, saves, shares, comments, postedOn });

const POSTS: PastPost[] = [
  post(1, "I replaced my weekly planning with AI for 7 days", "transformation", "facecam", 24, 22800, 1700, 760, 250, "2026-09-26"),
  post(2, "This client report took 4 minutes", "proof-first", "screen-record", 19, 28000, 2900, 960, 230, "2026-09-19"),
  post(3, "Stop writing meeting notes by hand", "contrarian", "facecam", 26, 14500, 880, 420, 160, "2026-09-12"),
  post(4, "5 AI tools I'd keep for freelancing", "list", "voiceover-broll", 34, 8600, 650, 300, 70, "2026-09-05"),
  post(5, "POV: your manager asks for the report you automated", "pov", "skit", 14, 5000, 120, 520, 45, "2026-08-29"),
  post(6, "Why this reel hit 1M views, frame by frame", "teardown", "screen-record", 41, 6400, 470, 170, 36, "2026-08-22"),
  post(7, "Clean a messy sheet in 20 seconds", "tutorial", "screen-record", 21, 10900, 1100, 440, 90, "2026-08-15"),
  post(8, "I tested 4 AI note apps so you don't have to", "list", "facecam", 38, 8900, 940, 290, 110, "2026-09-22"),
  post(9, "My inbox went from 400 to 0 in one afternoon", "proof-first", "facecam", 22, 20100, 2100, 640, 180, "2026-09-09"),
  post(10, "How I plan a week of content in 10 minutes", "tutorial", "screen-record", 28, 9600, 1000, 340, 80, "2026-08-18"),
  post(11, "Everyone's prompt library is wrong", "contrarian", "facecam", 23, 11500, 720, 310, 150, "2026-08-25"),
  post(12, "I replaced my morning routine with AI for 5 days", "transformation", "facecam", 20, 16300, 1100, 450, 190, "2026-08-12"),
];

export const SAMPLE_INQUIRY = `Hi Arjun,

I'm Meera from Tessera, an AI meeting-notes app for freelancers and small teams. Loved your reel on replacing weekly planning with AI, it is exactly the audience we want.

We'd like to work with you on a launch campaign:
- 1 Reel + 2 Stories showing Tessera in your workflow
- Paid usage: we'd run the Reel as partnership ads for 30 days
- Exclusivity: no competing note-taking or meeting apps for 6 months
- Budget: ₹12,000 all in
- Go-live by 18 Oct

Let us know if you're interested and we'll share the brief. Can you confirm by Monday?

Regards,
Meera Rao
Partnerships, Tessera
meera@tessera.app`;

export const SAMPLE_SCAM = `Dear creator,

Congratulations! You are selected for the Glowmax Influencer Program. To receive your PR kit and a ₹25,000 sponsored deal you must pay a ₹1,500 registration fee today only. Click this link to pay: bit.ly/glowmax-join. Please also share your UPI PIN to verify your account.

Team Glowmax`;

export function sampleDna(): CreatorDNA {
  return {
    id: "arjun",
    name: "Arjun Kulkarni",
    handle: "@arjunbuilds",
    city: "Pune",
    followers: 27400,
    avgViews: Math.round(mean(POSTS.map((p) => p.views))),
    niche: "ai-tech",
    topics: ["competitor research", "weekly planning", "meeting notes", "inbox triage", "client reports", "cold outreach", "content planning"],
    goals: ["brand-deals", "leads"],
    languages: ["English", "Hinglish"],
    tone: ["analytical", "dry humour", "direct"],
    avoidWords: ["game-changer", "revolutionary", "hack"],
    signature: "No fluff. Just the setup.",
    formats: ["facecam", "screen-record"],
    audience: { cities: ["Bengaluru", "Pune", "Mumbai", "Delhi NCR"], ageBand: "22 to 34", who: "Freelancers, students and early-career marketers" },
    peers: ["@neha.automates", "@parth.tests.tools", "@sahilships", "@riya.runs.on.ai", "@devansh.workflow"],
    rules: { minReelInr: 8000, maxExclusivityDays: 30, allowBarter: false, maxUsage: "paid-30" },
    posts: POSTS,
    deals: [
      { id: "deal-1", brand: "Ledgerly", category: "Invoicing app", deliverables: "1 Reel + 1 Story", priceInr: 9500, status: "paid", date: "2026-07-28" },
      { id: "deal-2", brand: "Fynwise", category: "Budgeting app", deliverables: "1 Reel", priceInr: 7500, status: "paid", date: "2026-06-14" },
      { id: "deal-3", brand: "NoteNest", category: "Notes app", deliverables: "1 Reel + 2 Stories, 30 days paid usage", priceInr: 14000, status: "pending", date: "2026-09-18" },
      { id: "deal-4", brand: "Brewline", category: "Coffee", deliverables: "Gifting only, 1 Reel", priceInr: 0, status: "declined", date: "2026-08-03" },
    ],
  };
}

export function sampleMemory(): MemoryItem[] {
  return [
    { id: "mem-1", kind: "preference", text: "Lead hooks with the result first. Your proof-first posts perform best.", source: "studio", at: "2026-09-20T09:00:00.000Z", rule: { type: "hook-style", value: "Result first" } },
    { id: "mem-2", kind: "correction", text: "Hook reworded to lead with the result.", source: "studio", at: "2026-09-12T11:20:00.000Z", detail: { ai: "Stop writing meeting notes by hand.", human: "I stopped writing meeting notes for 7 days. Here is what happened.", reason: "The original is too generic. Your proof-first posts performed better.", accepted: true } },
    { id: "mem-3", kind: "outcome", text: "Inbox 400 to 0 reached 20.1K views, 1.5x baseline. Proof-first opening confirmed.", source: "hq", at: "2026-09-16T08:00:00.000Z", detail: { result: "20.1K views, 2,100 saves" } },
    { id: "mem-4", kind: "decision", text: "Declined Brewline. Gifting only for a full Reel breaks your deal rules.", source: "collab", at: "2026-08-04T10:00:00.000Z", detail: { accepted: false, reason: "No gifting-only work." } },
    { id: "mem-5", kind: "decision", text: "Countered NoteNest at ₹14,000 with 30 days of paid usage. Accepted.", source: "collab", at: "2026-09-18T15:30:00.000Z", detail: { accepted: true } },
  ];
}

export function makeInquiry(raw: string, dna: CreatorDNA, source: Inquiry["source"] = "paste", id?: string, receivedAt?: string): Inquiry {
  const extraction = extractInquiry(raw);
  const evaluation = evaluateDeal(extraction, dna, raw);
  const draft = evaluation.recommendation === "decline" && evaluation.health === "avoid" && extraction.signals.some((s) => s.severity === "risk") ? null : makeDraft(evaluation.recommendation, extraction, evaluation, dna);
  return { id: id ?? Math.random().toString(36).slice(2, 10), receivedAt: receivedAt ?? new Date().toISOString(), source, raw, status: draft ? "drafted" : "new", extraction, evaluation, draft };
}

export function sampleWorkspace(): Workspace {
  const dna = sampleDna();
  const insights = deriveDna(dna);
  const memory = sampleMemory();
  const byId = (id: string) => LIBRARY.find((p) => p.id === id)!;
  const draft = (id: string, topic: string, proof: string, len: 30 | 45 | 60) => ({ ...buildPackage({ topic, proof, lengthSec: len, language: "English", pattern: byId(id), dna, insights, memory }), id: `pkg-${id}`, createdAt: "2026-10-01T18:00:00.000Z" });
  const approved = { ...draft("tp-twenty-seconds", "content planning", "a week of content planned in 10 minutes", 30), id: "pkg-approved", status: "approved" as const, createdAt: "2026-09-28T10:00:00.000Z" };
  return {
    version: 1,
    mode: "sample",
    dna,
    patterns: LIBRARY,
    packages: [draft("tp-five-tools", "meeting notes", "", 45), draft("tp-frame-by-frame", "client reports", "", 45), approved],
    inquiries: [makeInquiry(SAMPLE_INQUIRY, dna, "paste", "inq-tessera", "2026-10-02T04:10:00.000Z")],
    memory,
    approvals: [],
  };
}

export function blankWorkspace(dna: CreatorDNA): Workspace {
  return { version: 1, mode: "own", dna, patterns: LIBRARY, packages: [], inquiries: [], memory: [], approvals: [] };
}
