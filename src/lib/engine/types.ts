// Domain model for CREO. Pure data, no framework imports, so engines run in Node tests too.

export const NICHES = {
  "ai-tech": { label: "AI and tech", rate: 1.3, tags: ["ai", "tech", "tool", "software", "app", "saas", "productivity", "automation", "notes", "workflow", "gadget", "startup"] },
  beauty: { label: "Beauty and skincare", rate: 1.3, tags: ["skin", "beauty", "makeup", "hair", "cosmetic", "serum", "spf", "glow"] },
  fitness: { label: "Fitness", rate: 1.1, tags: ["fitness", "gym", "workout", "protein", "wellness", "yoga", "nutrition", "supplement"] },
  food: { label: "Food", rate: 1.0, tags: ["food", "recipe", "kitchen", "cook", "snack", "restaurant", "beverage", "cafe"] },
  finance: { label: "Finance and investing", rate: 1.4, tags: ["finance", "invest", "money", "budget", "fintech", "bank", "credit", "tax", "savings"] },
  education: { label: "Education and careers", rate: 1.4, tags: ["course", "learn", "career", "exam", "study", "skill", "upskill", "job", "interview"] },
  fashion: { label: "Fashion", rate: 1.1, tags: ["fashion", "style", "outfit", "wear", "jewel", "sneaker", "thrift"] },
  travel: { label: "Travel", rate: 1.0, tags: ["travel", "trip", "hotel", "flight", "stay", "itinerary", "resort"] },
  lifestyle: { label: "Lifestyle and comedy", rate: 0.9, tags: ["lifestyle", "home", "decor", "vlog", "comedy", "routine"] },
} as const;
export type NicheKey = keyof typeof NICHES;

export const HOOK_TYPES = {
  transformation: "Transformation",
  "proof-first": "Proof first",
  contrarian: "Contrarian",
  pov: "POV",
  list: "List",
  teardown: "Teardown",
  tutorial: "Tutorial",
} as const;
export type HookType = keyof typeof HOOK_TYPES;

export const FORMATS = {
  facecam: "Facecam",
  "screen-record": "Screen recording",
  "voiceover-broll": "Voiceover and B-roll",
  skit: "Skit",
  "text-overlay": "Text on screen",
} as const;
export type FormatKey = keyof typeof FORMATS;

export const GOALS = {
  "brand-deals": "Brand deals",
  grow: "Follower growth",
  leads: "Leads and DMs",
  authority: "Authority",
  product: "Sell my own product",
} as const;
export type Goal = keyof typeof GOALS;

export const CTAS = {
  comment: "Comment a keyword",
  save: "Save this",
  follow: "Follow",
  share: "Send to a friend",
  bio: "Link in bio",
} as const;
export type CtaKind = keyof typeof CTAS;

export const AUDIO = { "original-voice": "Original voice", "trending-audio": "Trending audio", "music-bed": "Music bed", voiceover: "Voiceover" } as const;
export type AudioRole = keyof typeof AUDIO;

export const EMOTIONS = { curiosity: "Curiosity", surprise: "Surprise", relief: "Relief", aspiration: "Aspiration", fomo: "FOMO", humour: "Humour", authority: "Authority" } as const;
export type Emotion = keyof typeof EMOTIONS;

export type Pacing = "fast" | "medium" | "slow";
export type Language = "English" | "Hinglish";

export interface PastPost {
  id: string;
  title: string;
  hook: HookType;
  format: FormatKey;
  durationSec: number;
  views: number;
  saves: number;
  shares: number;
  comments: number;
  postedOn: string;
}

export interface PastDeal {
  id: string;
  brand: string;
  category: string;
  deliverables: string;
  priceInr: number;
  status: "paid" | "pending" | "declined";
  date: string;
}

export interface DealRules {
  minReelInr: number;
  maxExclusivityDays: number;
  allowBarter: boolean;
  maxUsage: "organic" | "paid-30" | "paid-90";
}

export interface CreatorDNA {
  id: string;
  name: string;
  handle: string;
  city: string;
  followers: number;
  avgViews: number;
  niche: NicheKey;
  topics: string[];
  goals: Goal[];
  languages: Language[];
  tone: string[];
  avoidWords: string[];
  signature: string;
  formats: FormatKey[];
  audience: { cities: string[]; ageBand: string; who: string };
  peers: string[];
  rules: DealRules;
  posts: PastPost[];
  deals: PastDeal[];
}

export interface Mechanism {
  hook: HookType;
  formats: FormatKey[];
  durationSec: [number, number];
  pacing: Pacing;
  firstFrame: string;
  editRhythm: string;
  cta: CtaKind;
  audio: AudioRole;
  emotion: Emotion;
  proofBySec: number;
}

export interface TrendPattern {
  id: string;
  title: string;
  example: string;
  summary: string;
  status: "emerging" | "rising" | "stable";
  niches: NicheKey[] | "any";
  mechanism: Mechanism;
  source: "library" | "creator";
  sourceUrl?: string;
  addedAt: string;
  signals?: string[];
}

export interface FitPart {
  key: string;
  label: string;
  weight: number;
  value: number;
  note: string;
}
export interface Fit {
  score: number;
  parts: FitPart[];
  verdict: string;
}

export interface Hook {
  id: string;
  style: "Direct" | "Result first" | "Curious";
  text: string;
  recommended?: boolean;
}
export interface ScriptBeat {
  id: string;
  at: string;
  label: string;
  line: string;
  visual: string;
}
export interface Shot {
  id: string;
  at: string;
  kind: "A-roll" | "B-roll" | "Screen" | "Overlay";
  note: string;
}
export interface TitleOption {
  text: string;
  thumb: string;
}
export interface Correction {
  id: string;
  field: string;
  ai: string;
  human: string;
  reason: string;
  at: string;
}
export interface StudioPackage {
  id: string;
  createdAt: string;
  topic: string;
  proof: string;
  lengthSec: 30 | 45 | 60;
  language: Language;
  trendId?: string;
  trendTitle?: string;
  engine: "local" | "ai";
  hooks: Hook[];
  chosenHook: string;
  script: ScriptBeat[];
  shots: Shot[];
  caption: string;
  cta: string;
  keyword: string;
  titles: TitleOption[];
  altOpenings: string[];
  applied: string[];
  status: "draft" | "pending" | "approved" | "rejected";
  corrections: Correction[];
}

export type SpanKind = "budget" | "deliverable" | "date" | "usage" | "exclusivity" | "payment" | "risk" | "brand";
export interface Span {
  start: number;
  end: number;
  kind: SpanKind;
  label: string;
}
export interface Signal {
  id: string;
  severity: "info" | "warn" | "risk";
  label: string;
  detail: string;
}
export type UsageKind = "organic" | "paid-30" | "paid-90" | "paid-unspecified" | "perpetual" | "unknown";
export interface Extraction {
  brand: string | null;
  contactName: string | null;
  email: string | null;
  reels: number;
  stories: number;
  posts: number;
  otherAsks: string[];
  budgetInr: number | null;
  budgetPerUnit: boolean;
  budgetKind: "cash" | "barter" | "commission" | "unknown";
  goLive: string | null;
  urgent: boolean;
  usage: UsageKind;
  usageDays: number | null;
  exclusivityDays: number | null;
  exclusivityAsked: boolean;
  paymentTerms: string | null;
  revisions: number | null;
  unlimitedRevisions: boolean;
  missing: string[];
  signals: Signal[];
  spans: Span[];
}

export interface QuoteStep {
  label: string;
  value: string;
  note?: string;
}
export interface Quote {
  anchorInr: number;
  baseInr: number;
  midInr: number;
  lowInr: number;
  highInr: number;
  walkAwayInr: number;
  floorApplied: boolean;
  steps: QuoteStep[];
}
export interface Lever {
  label: string;
  ask: string;
}
export interface Counter {
  usage: UsageKind;
  exclusivityDays: number | null;
  changes: string[];
}
export interface Evaluation {
  health: "strong" | "workable" | "risky" | "avoid";
  score: number;
  /** Price for the terms CREO recommends countering with. */
  quote: Quote;
  /** Price if the creator accepted every term as asked. */
  asked: Quote;
  counter: Counter;
  recommendation: "accept" | "counter" | "clarify" | "decline";
  reasoning: string[];
  levers: Lever[];
  fitNote: string;
}

export type DraftKind = "accept" | "counter" | "clarify" | "decline";
export interface Draft {
  kind: DraftKind;
  tone: "warm" | "direct";
  subject: string;
  body: string;
  /** The text as CREO first wrote it, kept so a human edit can be learned from. */
  aiBody: string;
}
export interface Inquiry {
  id: string;
  receivedAt: string;
  source: "paste" | "upload" | "screenshot";
  raw: string;
  status: "new" | "drafted" | "pending" | "approved" | "declined";
  extraction: Extraction;
  evaluation: Evaluation;
  draft: Draft | null;
}

export type MemoryRule =
  | { type: "hook-style"; value: "Result first" | "Direct" | "Curious" }
  | { type: "cta"; value: CtaKind }
  | { type: "note"; value: string };
export interface MemoryItem {
  id: string;
  kind: "preference" | "decision" | "correction" | "outcome";
  text: string;
  source: "studio" | "collab" | "trend" | "hq" | "manual";
  at: string;
  rule?: MemoryRule;
  detail?: { ai?: string; human?: string; reason?: string; accepted?: boolean; result?: string };
}

export interface Approval {
  id: string;
  kind: "studio" | "collab";
  refId: string;
  title: string;
  detail: string;
  risk: "Public" | "Commercial";
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
  reason?: string;
}

export interface Workspace {
  version: 1;
  mode: "sample" | "own";
  dna: CreatorDNA;
  patterns: TrendPattern[];
  packages: StudioPackage[];
  inquiries: Inquiry[];
  memory: MemoryItem[];
  approvals: Approval[];
}
