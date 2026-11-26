// The free "what should I post next?" preview. Picks 3 ideas from CREO's curated pattern library for a niche, a goal and a way of filming.
// It never looks at an account: the answers are the only input, and a handle (if given) is only printed on the card.
// Pure and browser-free (relative .ts imports), so the tests can run it.
import { LIBRARY } from "./engine/trend.ts";
import { CTAS, FORMATS, GOALS, HOOK_TYPES, NICHES, type FormatKey, type Goal, type HookType, type NicheKey } from "./engine/types.ts";

export interface Answers {
  niche: NicheKey;
  goal: Goal;
  format: FormatKey;
  /** Printed on the share card only. Never put in a URL or an analytics event. */
  handle?: string;
}

export interface Idea {
  id: string;
  /** The post idea in one line. Anything in [brackets] is for the creator to fill in; CREO never invents a result. */
  line: string;
  hook: HookType;
  hookLabel: string;
  /** Why it fits: the hook, then the goal. */
  why: string;
  openWith: string;
  length: string;
  endWith: string;
  /** What the pattern is usually shot as, and whether that includes the way the creator likes to film. */
  shotAs: string;
  fitsFormat: boolean;
}

export const NICHE_KEYS = Object.keys(NICHES) as NicheKey[];
export const GOAL_KEYS = Object.keys(GOALS) as Goal[];
export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

/** The quiz's questions, in order. */
export const QUESTIONS = [
  { key: "niche", title: "What do you post about?", options: NICHE_KEYS.map((k) => ({ value: k, label: NICHES[k].label })) },
  { key: "goal", title: "What do you want from your posts?", options: GOAL_KEYS.map((k) => ({ value: k, label: GOALS[k] })) },
  { key: "format", title: "How do you like to film?", options: FORMAT_KEYS.map((k) => ({ value: k, label: FORMATS[k] })) },
] as const;

// ---------------------------------------------------------------------------------------------
// The ideas. One line per niche and pattern (the pattern id without "tp-"). A niche only gets ideas it has a line for,
// so a food creator never sees an idea written for a software maker. Brackets are slots the creator fills in.
// No dashes in the copy, and no numbers that pretend to be results.
// ---------------------------------------------------------------------------------------------
export const LINES: Record<NicheKey, Record<string, string>> = {
  "ai-tech": {
    "replaced-7d": "I replaced [a task you do every week] with AI for 7 days",
    "result-reveal": "This [screen or result] took me [time] with AI. Here is the exact flow",
    "stop-doing": "Stop writing [your weekly task] by hand. Do this instead",
    intern: "POV: your manager asks for the [report] you already automated",
    "five-tools": "5 free AI tools that replace one [boring job]",
    "frame-by-frame": "Why this [AI demo] got [views] views, frame by frame",
    "twenty-seconds": "Clean up [a messy file] with AI in 20 seconds",
    "before-after": "My [workflow] before and after AI, same task, no edits",
    "tier-list": "Tier list of every AI [writing or note taking] tool I have tried",
    "tested-so-you-dont": "I tested [how many] AI [tools] for a month so you don't have to",
  },
  beauty: {
    "result-reveal": "My skin after [time], no filter. Here is the routine",
    "stop-doing": "Stop layering [a product type] this way. Do this instead",
    "five-tools": "5 [budget] products I would rebuy for [skin concern]",
    "frame-by-frame": "Why this [routine] reel got [views] views, frame by frame",
    "tier-list": "Tier list of every [serum or sunscreen] I have used",
    "tested-so-you-dont": "I tested [how many] [sunscreens] for a month so you don't have to",
    "before-after": "Four weeks, same [routine], no filter",
    intern: "POV: you finally found the [product] your [skin type] needed",
  },
  fitness: {
    "result-reveal": "My [lift or measurement] after [time]. Here is the plan",
    "stop-doing": "Stop doing [an exercise] like this. Do this instead",
    "five-tools": "5 [exercises] that replace [a machine or a long session]",
    "frame-by-frame": "Why this [workout] reel got [views] views, frame by frame",
    "tier-list": "Tier list of every [exercise] for [muscle group]",
    "tested-so-you-dont": "I tested [how many] [protein or supplement] options so you don't have to",
    "before-after": "[Time] of the same routine, no filter",
    intern: "POV: it is [time] and you still have not done your [workout]",
  },
  food: {
    "result-reveal": "This [dish] took [time]. Here is the full recipe",
    "stop-doing": "Stop making [dish] this way. Do this instead",
    "five-tools": "5 [ingredients] that make [a meal] taste better",
    "frame-by-frame": "Why this [recipe] reel got [views] views, frame by frame",
    "tier-list": "Tier list of every [snack or street food] I have tried",
    "tested-so-you-dont": "I tested [how many] [cafes or recipes] so you don't have to",
    "before-after": "[Plain dish] to [restaurant style], same ingredients",
    intern: "POV: you open the fridge at [time] and make [dish]",
  },
  finance: {
    "replaced-7d": "I ran my [spending] through a budget app for 7 days",
    "result-reveal": "My [savings or SIP] after [time]. Here is the setup",
    "stop-doing": "Stop doing [a money habit]. Do this instead",
    "five-tools": "5 free [apps] for [tracking spends or filing tax]",
    "frame-by-frame": "Why this [money explainer] got [views] views, frame by frame",
    "twenty-seconds": "Understand [a money term] in 20 seconds",
    "tier-list": "Tier list of every [saving or investing] habit I have tried",
    "tested-so-you-dont": "I tested [how many] [budget apps] for a month so you don't have to",
  },
  education: {
    "replaced-7d": "I learned [a skill] with [a method] for 7 days",
    "result-reveal": "My [score or offer] after [time]. Here is how I studied",
    "stop-doing": "Stop studying [subject] like this. Do this instead",
    "five-tools": "5 free [resources] for [exam or skill]",
    "frame-by-frame": "Why this [study tip] reel got [views] views, frame by frame",
    "twenty-seconds": "Learn [a concept] in 20 seconds",
    "tier-list": "Tier list of every [study method] I have tried",
    intern: "POV: it is a week before [exam or interview]",
  },
  fashion: {
    "result-reveal": "This [outfit] cost [amount]. Here is where each piece is from",
    "stop-doing": "Stop wearing [item] like this. Do this instead",
    "five-tools": "5 [pieces] that make [an outfit] work",
    "frame-by-frame": "Why this [outfit] reel got [views] views, frame by frame",
    "tier-list": "Tier list of every [brand or thrift find] I have bought",
    "tested-so-you-dont": "I tested [how many] [jeans or sneakers] so you don't have to",
    "before-after": "Same [piece], [how many] ways, no filter",
    intern: "POV: you have five minutes and one [item]",
  },
  travel: {
    "replaced-7d": "I let [a tool] plan my [destination] trip",
    "result-reveal": "This [trip] cost [amount] in total. Here is the plan",
    "stop-doing": "Stop booking [a stay or flight] like this. Do this instead",
    "five-tools": "5 [apps] that saved my [trip]",
    "frame-by-frame": "Why this [place] reel got [views] views, frame by frame",
    "tier-list": "Tier list of every [stay or place] I have visited",
    "tested-so-you-dont": "I tested [how many] [stays] in [city] so you don't have to",
    intern: "POV: you land in [city] with one day",
  },
  lifestyle: {
    "result-reveal": "My [room or routine] after [time]. Here is what changed",
    "stop-doing": "Stop doing [a habit]. Do this instead",
    "five-tools": "5 [things] that make [your routine] easier",
    "frame-by-frame": "Why this [skit or vlog] got [views] views, frame by frame",
    "tier-list": "Tier list of every [habit] I have tried",
    "tested-so-you-dont": "I tested [how many] [products] for a month so you don't have to",
    "before-after": "[Time] of the same routine, no filter",
    intern: "POV: your [family member] asks what you do for [work]",
  },
};

/** Why a hook works, in plain words. */
export const HOOK_WHY: Record<HookType, string> = {
  transformation: "A visible before and after gives people a reason to watch to the end.",
  "proof-first": "Showing the result first earns the next three seconds.",
  contrarian: "A clear opinion invites replies, and replies tell the feed people care.",
  pov: "A relatable scene is easy to send to a friend.",
  list: "Lists are easy to scan and easy to save.",
  teardown: "Explaining a known win shows you understand why content works.",
  tutorial: "One clear job in a short time is easy to finish and easy to trust.",
};

/** How the goal shapes the choice, in plain words. */
export const GOAL_WHY: Record<Goal, string> = {
  grow: "You want follower growth, so this leans on shares and saves.",
  "brand-deals": "You want brand deals, so this shows a clear result a brand can picture.",
  leads: "You want leads and DMs, so this ends on a clear next step.",
  authority: "You want authority, so this shows you know the subject.",
  product: "You want to sell your own product, so this shows the result before the pitch.",
};

/** How much each goal likes each hook, 0 to 3. */
export const GOAL_HOOKS: Record<Goal, Record<HookType, number>> = {
  grow: { pov: 3, list: 3, transformation: 2, "proof-first": 2, contrarian: 2, tutorial: 1, teardown: 1 },
  "brand-deals": { "proof-first": 3, transformation: 3, tutorial: 2, list: 2, teardown: 1, contrarian: 1, pov: 0 },
  leads: { tutorial: 3, "proof-first": 3, list: 2, contrarian: 2, transformation: 1, teardown: 1, pov: 0 },
  authority: { contrarian: 3, teardown: 3, list: 2, "proof-first": 2, tutorial: 2, transformation: 1, pov: 0 },
  product: { transformation: 3, "proof-first": 3, tutorial: 2, list: 1, contrarian: 1, teardown: 0, pov: 0 },
};

/** The call to action each goal likes best. */
export const GOAL_CTA: Record<Goal, keyof typeof CTAS> = { grow: "share", "brand-deals": "follow", leads: "comment", authority: "follow", product: "bio" };

/** The result reveal's library first frame says "final number", which does not fit every niche, so it gets a plainer line. */
const OPEN_WITH: Record<string, string> = { "tp-result-reveal": "The result on screen with one line of text" };

export function lineFor(niche: NicheKey, patternId: string): string | undefined {
  return LINES[niche][patternId.replace(/^tp-/, "")];
}

/** Three ideas for the answers. Deterministic: the same answers always give the same three, in the same order. */
export function pickIdeas(a: Answers): Idea[] {
  const scored = LIBRARY.flatMap((p, order) => {
    const line = lineFor(a.niche, p.id);
    if (!line) return [];
    const m = p.mechanism;
    const nicheBonus = p.niches === "any" ? 1 : p.niches.includes(a.niche) ? 2 : 0;
    const fits = m.formats.includes(a.format);
    const score = GOAL_HOOKS[a.goal][m.hook] + nicheBonus + (fits ? 3 : 0) + (m.cta === GOAL_CTA[a.goal] ? 2 : 0);
    return [{ p, line, fits, score, order }];
  }).sort((x, y) => y.score - x.score || x.order - y.order);

  // One idea per hook type first, so the three feel different; fill from the rest if a niche has fewer than three types.
  const chosen: typeof scored = [];
  const seen = new Set<HookType>();
  for (const s of scored) {
    if (chosen.length === 3) break;
    if (!seen.has(s.p.mechanism.hook)) { chosen.push(s); seen.add(s.p.mechanism.hook); }
  }
  for (const s of scored) {
    if (chosen.length === 3) break;
    if (!chosen.includes(s)) chosen.push(s);
  }

  return chosen.map(({ p, line, fits }) => {
    const m = p.mechanism;
    return {
      id: p.id,
      line,
      hook: m.hook,
      hookLabel: HOOK_TYPES[m.hook],
      why: `${HOOK_WHY[m.hook]} ${GOAL_WHY[a.goal]}`,
      openWith: OPEN_WITH[p.id] ?? m.firstFrame,
      length: `${m.durationSec[0]} to ${m.durationSec[1]} seconds`,
      endWith: CTAS[m.cta],
      shotAs: m.formats.map((f) => FORMATS[f]).join(" or "),
      fitsFormat: fits,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Answers in a link, and the handle
// ---------------------------------------------------------------------------------------------

/** A handle for the card: letters, digits, dots and underscores, up to 30. Anything else gives undefined. */
export function cleanHandle(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const h = v.trim().replace(/^https?:\/\/(www\.)?(instagram\.com|x\.com|twitter\.com|youtube\.com\/@?|linkedin\.com\/in)\//i, "").replace(/\/$/, "").replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : undefined;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The answers from a shared link, or null if any is missing or not one of the options. The link never carries a handle. */
export function parseAnswers(q: Record<string, string | string[] | undefined>): Answers | null {
  const niche = NICHE_KEYS.find((k) => k === one(q.n));
  const goal = GOAL_KEYS.find((k) => k === one(q.g));
  const format = FORMAT_KEYS.find((k) => k === one(q.f));
  return niche && goal && format ? { niche, goal, format } : null;
}

/** The query string for a shared link. Choices only. */
export function answersQuery(a: Pick<Answers, "niche" | "goal" | "format">): string {
  return `n=${a.niche}&g=${a.goal}&f=${a.format}`;
}

export const previewTitle = (a: Pick<Answers, "niche">): string => `3 post ideas: ${NICHES[a.niche].label}`;

/** Breaks text into lines that each fit `max`, as measured by `measure`. A word longer than a line gets a line of its own. */
export function wrapText(text: string, measure: (s: string) => number, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > max) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
