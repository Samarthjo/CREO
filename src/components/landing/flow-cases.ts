import { buildBrief } from "../../lib/engine/brief.ts";
import { deriveDna } from "../../lib/engine/dna.ts";
import { mean } from "../../lib/engine/format.ts";
import { buildPackage } from "../../lib/engine/studio.ts";
import { LIBRARY, rankPatterns } from "../../lib/engine/trend.ts";
import { HOOK_TYPES, type CreatorDNA, type HookType, type Language, type MemoryItem, type PastPost, type TrendPattern, type Workspace } from "../../lib/engine/types.ts";
import { sampleDna, sampleMemory } from "../../lib/store/seed.ts";

/**
 * The cases behind the "how CREO works" slideshow: three made-up creators, each taken through the real engines
 * (the same Trend, Studio and Creator DNA code the app runs). Every fit score, reason, hook, script beat and lift
 * below is what that code returns for the creator's posts. Only the things a creator would type or the numbers
 * an example result needs are written by hand, and the slideshow labels the whole thing as an example.
 */

export type FlowCaseId = "tech" | "fitness" | "food";
export type TrendRow = { title: string; status: TrendPattern["status"]; top: boolean };

export type FlowCase = {
  id: FlowCaseId;
  /** The product's own niche label. */
  niche: string;
  who: string;
  /** Five rows for the Trend scene. Exactly one is `top`, the pattern CREO picks. */
  trends: TrendRow[];
  saved: number;
  fit: { title: string; status: TrendPattern["status"]; score: number; why: string[]; verdict: string };
  hook: { style: string; before: string; slot: string; after: string; filled: string };
  /** The script as a ribbon: each beat and how many seconds it takes. */
  plan: { label: string; sec: number }[];
  lengthSec: number;
  shots: number;
  titles: number;
  result: { usual: number; views: number; lift: number; topic: string };
  learn: { hook: string; from: number; to: number; note: string };
  /** One line per step, in the creator's own words: [lead, rest]. */
  problems: [string, string?][];
};

type Seed = {
  id: FlowCaseId;
  dna: CreatorDNA;
  memory: MemoryItem[];
  topic: string;
  language: Language;
  /** What the creator types into the highlighted slot. */
  filled: string;
  /** The example result, as a multiple of the creator's usual views. */
  lift: number;
  who: string;
  problems: FlowCase["problems"];
};

const post = (n: number, title: string, hook: PastPost["hook"], format: PastPost["format"], durationSec: number, views: number, saves: number, shares: number, comments: number, postedOn: string): PastPost =>
  ({ id: `post-${n}`, title, hook, format, durationSec, views, saves, shares, comments, postedOn });

const FITNESS_POSTS: PastPost[] = [
  post(1, "Stop doing crunches for abs", "contrarian", "facecam", 24, 15600, 1500, 900, 320, "2026-09-27"),
  post(2, "My 20-minute home workout, no equipment", "tutorial", "voiceover-broll", 21, 8900, 900, 380, 110, "2026-09-20"),
  post(3, "I ran every day for 14 days", "transformation", "facecam", 26, 9400, 700, 310, 140, "2026-09-13"),
  post(4, "5 protein mistakes beginners make", "list", "voiceover-broll", 33, 6100, 520, 260, 90, "2026-09-06"),
  post(5, "POV: it's the first week of January at the gym", "pov", "skit", 14, 4300, 160, 410, 60, "2026-08-30"),
  post(6, "Why this 10-minute routine works, frame by frame", "teardown", "facecam", 38, 4800, 380, 150, 55, "2026-08-23"),
  post(7, "12 more push-ups in 6 weeks", "proof-first", "facecam", 22, 15800, 1700, 620, 210, "2026-09-23"),
  post(8, "Stop stretching before every workout", "contrarian", "facecam", 27, 13400, 1300, 700, 280, "2026-09-10"),
  post(9, "How I plan my week of workouts", "tutorial", "voiceover-broll", 28, 7200, 760, 290, 85, "2026-08-16"),
  post(10, "3 gym myths I believed for years", "list", "facecam", 31, 6800, 590, 270, 120, "2026-08-26"),
  post(11, "4 weeks, same routine, no filter", "transformation", "voiceover-broll", 20, 10900, 880, 450, 190, "2026-08-12"),
  post(12, "What I eat after training", "tutorial", "voiceover-broll", 24, 8200, 940, 330, 100, "2026-09-02"),
];

const FOOD_POSTS: PastPost[] = [
  post(1, "5 tiffin ideas under 10 minutes", "list", "voiceover-broll", 34, 38000, 2600, 1100, 240, "2026-09-26"),
  post(2, "A week of dinners for under ₹800", "proof-first", "voiceover-broll", 28, 36500, 4300, 2100, 520, "2026-09-19"),
  post(3, "My Sunday meal prep, start to finish", "tutorial", "voiceover-broll", 41, 14800, 1900, 640, 150, "2026-09-12"),
  post(4, "POV: your mom packs your tiffin", "pov", "skit", 15, 9200, 380, 1500, 210, "2026-09-05"),
  post(5, "Why this dal tastes better, frame by frame", "teardown", "facecam", 36, 8100, 700, 320, 90, "2026-08-29"),
  post(6, "3 pantry mistakes I'd undo", "list", "facecam", 29, 34500, 2400, 980, 260, "2026-08-22"),
  post(7, "I tried one new recipe every day for 7 days", "transformation", "facecam", 26, 13400, 1100, 540, 230, "2026-08-15"),
  post(8, "Dinner for 4 under ₹300", "proof-first", "voiceover-broll", 25, 31800, 3900, 1800, 410, "2026-09-09"),
  post(9, "Stop buying ready-made masala", "contrarian", "facecam", 24, 12700, 900, 480, 310, "2026-08-18"),
  post(10, "How to chop onions in 20 seconds", "tutorial", "voiceover-broll", 19, 15900, 1400, 770, 130, "2026-08-25"),
  post(11, "Rating street food at home", "list", "facecam", 33, 26000, 1500, 690, 200, "2026-09-16"),
  post(12, "Kitchen reset in 15 minutes", "tutorial", "voiceover-broll", 21, 11000, 1200, 420, 95, "2026-08-11"),
];

const made = (o: Pick<CreatorDNA, "id" | "niche" | "city" | "followers" | "topics" | "goals" | "languages" | "tone" | "formats" | "posts">): CreatorDNA => ({
  name: "Creator", handle: "@creator", avgViews: Math.round(mean(o.posts.map((p) => p.views))), avoidWords: [], signature: "",
  audience: { cities: [], ageBand: "", who: "" }, peers: [], rules: { minReelInr: 5000, maxExclusivityDays: 30, allowBarter: false, maxUsage: "paid-30" }, deals: [], ...o,
});

const SEEDS: Seed[] = [
  {
    id: "tech",
    dna: sampleDna(),
    memory: sampleMemory(),
    topic: "competitor research",
    language: "English",
    filled: "6 hours saved a week",
    lift: 2.2,
    who: "Pune, 27K followers",
    problems: [
      ["Ten saved trends.", "None says which one is mine."],
      ["Everyone says it works.", "Will it work for me?"],
      ["Now I stare at a blank page", "for hours."],
      ["I don't want AI", "posting as me."],
      ["Posted it.", "Now I just wait and hope."],
      ["Every week I start", "from zero again."],
    ],
  },
  {
    id: "fitness",
    dna: made({ id: "fitness", niche: "fitness", city: "Mumbai", followers: 18600, topics: ["cardio", "crunches", "home workouts", "protein", "beginner plans"], goals: ["leads", "product"], languages: ["English"], tone: ["direct", "energetic"], formats: ["facecam", "voiceover-broll"], posts: FITNESS_POSTS }),
    memory: [],
    topic: "cardio",
    language: "English",
    filled: "5 km without stopping in 3 weeks",
    lift: 2.6,
    who: "Mumbai, 19K followers",
    problems: [
      ["Ten saved trends.", "None says which one my clients want."],
      ["It worked for them.", "Will it work for my audience?"],
      ["Now I lose my evening", "writing the script."],
      ["It has to sound like me,", "not a robot."],
      ["Did it really work,", "or was it luck?"],
      ["Next week, same guessing", "all over again."],
    ],
  },
  {
    id: "food",
    dna: made({ id: "food", niche: "food", city: "Jaipur", followers: 41200, topics: ["meal prep", "tiffin ideas", "30 minute dinners", "budget groceries", "street food at home"], goals: ["grow", "brand-deals"], languages: ["Hinglish", "English"], tone: ["warm", "analytical"], formats: ["facecam", "voiceover-broll"], posts: FOOD_POSTS }),
    memory: [],
    topic: "meal prep",
    language: "Hinglish",
    filled: "Hafte ke dinner ₹800 mein",
    lift: 2.4,
    who: "Jaipur, 41K followers",
    problems: [
      ["Ten saved trends.", "None says which one fits my kitchen."],
      ["It went viral for them.", "Will it work for me?"],
      ["Now comes the script,", "the shots and the caption."],
      ["It must still sound like me,", "in my own Hinglish."],
      ["Views went up.", "Was it the hook or luck?"],
      ["Every post feels", "like starting over."],
    ],
  },
];

const NICHE_LABEL = { "ai-tech": "AI and tech", fitness: "Fitness", food: "Food" } as const;
const k = (n: number) => Math.round(n / 100) / 10;

function build(s: Seed): FlowCase {
  const { dna, memory } = s;
  const insights = deriveDna(dna);
  const ws: Workspace = { version: 1, mode: "sample", dna, patterns: LIBRARY, packages: [], inquiries: [], memory, approvals: [] };

  // The same pick the app's HQ makes: the first "create" action in the brief.
  const brief = buildBrief(ws, insights);
  const action = brief.actions.find((a) => a.kind === "create");
  const ranked = rankPatterns(LIBRARY, dna, insights, memory);
  const top = ranked.find((r) => r.pattern.id === action?.id.replace("create-", "")) ?? ranked[0]!;
  const pattern = top.pattern;
  const hookType: HookType = pattern.mechanism.hook;

  // Why it fits: the reasons the engine scored strongest, in its own words.
  const why = top.fit.parts.filter((p) => p.value >= 0.85).sort((a, b) => b.weight * b.value - a.weight * a.value).slice(0, 3).map((p) => p.note);

  // Five trends for the first scene: the pick and four others from the library that suit the creator's niche,
  // spread across the ranking. The pick sits third, so the list has something above and below it.
  const rest = ranked.filter((r) => r.pattern.id !== pattern.id).map((r) => r.pattern);
  const near = rest.filter((p) => p.niches === "any" || p.niches.includes(dna.niche));
  const pool = near.length >= 4 ? near : rest;
  const four = [0, 1, 2, 3].map((i) => pool[Math.floor((i * (pool.length - 1)) / 3)]!);
  const trends: TrendRow[] = [four[0]!, four[1]!, pattern, four[2]!, four[3]!].map((p) => ({ title: p.title, status: p.status, top: p.id === pattern.id }));

  const pkg = buildPackage({ topic: s.topic, proof: "", lengthSec: 30, language: s.language, pattern, dna, insights, memory });
  const hook = pkg.hooks.find((h) => h.id === pkg.chosenHook)!;
  const m = hook.text.match(/\[[^\]]+\]/);
  const at = m ? m.index ?? 0 : hook.text.length;
  const slot = m ? m[0] : "";
  const plan = pkg.script.map((b) => {
    const [from, to] = b.at.replace("s", "").split("-").map(Number);
    return { label: b.label, sec: Math.max(1, (to ?? 0) - (from ?? 0)) };
  });

  // The example result, and what it does to the creator's own numbers once CREO has learned it.
  const views = Math.round((insights.baseline * s.lift) / 100) * 100;
  const example: PastPost = { id: "example", title: s.topic, hook: hookType, format: pattern.mechanism.formats[0]!, durationSec: 24, views, saves: 0, shares: 0, comments: 0, postedOn: "2026-10-04" };
  const before = insights.hookLift[hookType]?.lift ?? 1;
  const afterLift = deriveDna({ ...dna, posts: [...dna.posts, example] }).hookLift[hookType]?.lift ?? before;
  const label = HOOK_TYPES[hookType];
  const topic = s.topic[0]!.toUpperCase() + s.topic.slice(1);

  return {
    id: s.id,
    niche: NICHE_LABEL[dna.niche as keyof typeof NICHE_LABEL],
    who: s.who,
    trends,
    saved: LIBRARY.length,
    fit: { title: pattern.title, status: pattern.status, score: top.fit.score, why, verdict: top.fit.verdict },
    hook: { style: hook.style, before: hook.text.slice(0, at), slot, after: m ? hook.text.slice(at + slot.length) : "", filled: s.filled },
    plan,
    lengthSec: pkg.lengthSec,
    shots: pkg.shots.length,
    titles: pkg.titles.length,
    result: { usual: Math.round(insights.baseline), views, lift: s.lift, topic: s.topic },
    learn: { hook: label, from: Math.round(before * 10) / 10, to: Math.round(afterLift * 10) / 10, note: `${topic} reached ${k(views).toFixed(1)}K views, ${s.lift.toFixed(1)}x baseline. ${label} opening confirmed.` },
    problems: s.problems,
  };
}

export const buildFlowCases = (): FlowCase[] => SEEDS.map(build);
