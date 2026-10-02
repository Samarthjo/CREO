import { clamp } from "./format.ts";
import { hookText, keywordFrom } from "./copy.ts";
import type { DnaInsights } from "./dna.ts";
import {
  CTAS, EMOTIONS, FORMATS, HOOK_TYPES,
  type CreatorDNA, type CtaKind, type Emotion, type Fit, type FormatKey, type HookType, type MemoryItem, type Mechanism, type Pacing, type TrendPattern,
} from "./types.ts";

const T = "2026-09-30T06:00:00.000Z";
const P = (
  id: string, title: string, example: string, summary: string, status: TrendPattern["status"], niches: TrendPattern["niches"], m: Mechanism,
): TrendPattern => ({ id, title, example, summary, status, niches, mechanism: m, source: "library", addedAt: T });

// Curated pattern library. During the cohort a CREO analyst reviews and refreshes these weekly.
export const LIBRARY: TrendPattern[] = [
  P("tp-replaced-7d", "I replaced X with AI for 7 days", "I replaced my morning routine with AI for 7 days", "A one-week swap that ends in a number. Proof lands in the first seconds, then a day-by-day cut.", "emerging", ["ai-tech", "education", "finance", "lifestyle"],
    { hook: "transformation", formats: ["facecam", "screen-record"], durationSec: [18, 25], pacing: "fast", firstFrame: "The result on screen before you say a word", editRhythm: "Cut every 1.5 seconds, zoom into the proof", cta: "comment", audio: "original-voice", emotion: "curiosity", proofBySec: 3 }),
  P("tp-result-reveal", "The 3-second result reveal", "This screenshot took 20 minutes to make", "Lead with the final number or screen, then rewind to how. Built for saves.", "emerging", "any",
    { hook: "proof-first", formats: ["screen-record", "text-overlay"], durationSec: [15, 22], pacing: "fast", firstFrame: "Final number full-screen with one line of text", editRhythm: "Hard cut to the how, return to the result at the end", cta: "save", audio: "music-bed", emotion: "surprise", proofBySec: 2 }),
  P("tp-stop-doing", "Stop doing X, do this instead", "Stop writing your weekly report from scratch", "A direct challenge to common advice, each claim captioned and cut tight.", "rising", "any",
    { hook: "contrarian", formats: ["facecam"], durationSec: [20, 30], pacing: "medium", firstFrame: "Direct eye contact, one hand raised", editRhythm: "Jump cut on every claim, caption each claim", cta: "comment", audio: "original-voice", emotion: "authority", proofBySec: 6 }),
  P("tp-intern", "POV: you're the intern the AI replaced", "POV: your manager asks for the report you automated", "A relatable workplace skit with a text POV pinned on top and one punchline.", "stable", ["lifestyle", "ai-tech", "education"],
    { hook: "pov", formats: ["skit", "text-overlay"], durationSec: [12, 20], pacing: "fast", firstFrame: "POV text pinned at the top, mid-action", editRhythm: "Three beats: setup, twist, punchline", cta: "share", audio: "trending-audio", emotion: "humour", proofBySec: 4 }),
  P("tp-five-tools", "5 tools, 1 job", "5 free ways to turn one recording into a week of content", "A fast list where the first item is already running on screen. Each item gets one line.", "rising", "any",
    { hook: "list", formats: ["voiceover-broll", "screen-record"], durationSec: [25, 40], pacing: "fast", firstFrame: "First item already running on screen", editRhythm: "One cut per item, a number on screen for each", cta: "save", audio: "voiceover", emotion: "curiosity", proofBySec: 4 }),
  P("tp-frame-by-frame", "Why this went viral, frame by frame", "Why this 40-second reel hit 2 million views", "A teardown of a known winner: freeze the key moment, then explain what carried it.", "stable", "any",
    { hook: "teardown", formats: ["screen-record", "facecam"], durationSec: [30, 45], pacing: "medium", firstFrame: "Freeze-frame of the viral moment", editRhythm: "Pause and annotate at each beat", cta: "follow", audio: "original-voice", emotion: "authority", proofBySec: 5 }),
  P("tp-twenty-seconds", "Do X in 20 seconds", "Clean up a messy spreadsheet in 20 seconds", "A visible countdown and one clear outcome. Tutorial stripped to its core.", "emerging", ["ai-tech", "finance", "education"],
    { hook: "tutorial", formats: ["screen-record", "text-overlay"], durationSec: [18, 24], pacing: "fast", firstFrame: "Timer on screen starting at 20", editRhythm: "Continuous screen capture, zoom on the key click", cta: "bio", audio: "music-bed", emotion: "relief", proofBySec: 3 }),
  P("tp-before-after", "Before and after, no filter", "Four weeks, same routine, no filter", "A split-screen reveal with a short honest voiceover. Aspirational but credible.", "rising", ["beauty", "fitness", "fashion", "food", "lifestyle"],
    { hook: "transformation", formats: ["facecam", "voiceover-broll"], durationSec: [15, 25], pacing: "fast", firstFrame: "Split screen, before and after side by side", editRhythm: "Quick wipe between states, slow on the final frame", cta: "follow", audio: "trending-audio", emotion: "aspiration", proofBySec: 2 }),
  P("tp-tier-list", "Tier list of X", "Ranking every note-taking habit I've tried", "A drag-and-drop ranking with a strong opinion at each tier.", "stable", "any",
    { hook: "list", formats: ["text-overlay", "facecam"], durationSec: [30, 45], pacing: "medium", firstFrame: "Empty tier grid, first item dropped in", editRhythm: "Reaction cut after each placement", cta: "comment", audio: "music-bed", emotion: "humour", proofBySec: 5 }),
  P("tp-tested-so-you-dont", "I tested N so you don't have to", "I tested 6 AI meeting-note apps for a month", "A structured verdict on several options, ending with one clear recommendation.", "rising", "any",
    { hook: "list", formats: ["facecam", "voiceover-broll"], durationSec: [30, 45], pacing: "medium", firstFrame: "All options laid out, one crossed off", editRhythm: "Verdict card after each option", cta: "save", audio: "original-voice", emotion: "curiosity", proofBySec: 5 }),
];

const has = (t: string, re: RegExp): number => (t.match(new RegExp(re.source, "gi")) ?? []).length;

const HOOK_RULES: [HookType, RegExp][] = [
  ["transformation", /\b(?:for|in|over)\s+\d+\s+(?:days?|weeks?|months?)\b|\breplaced\b|\bbefore\s+and\s+after\b|\b\d+[- ]day\b|\bchallenge\b|\bswap(?:ped)?\b/],
  ["list", /\b\d+\s+(?:tools?|ways?|tips?|mistakes?|habits?|things?|hacks?|apps?|ideas?|options?)\b|\btier list\b|\btop \d+\b|\btested \d+\b/],
  ["contrarian", /\bstop\b|\bdon'?t\b|\bnever\b|\bwrong\b|\bmyth\b|\boverrated\b|\bunpopular opinion\b|\bnobody tells\b|\binstead\b/],
  ["pov", /\bpov\b|\bwhen you\b|\bme when\b|\bskit\b|\brelatable\b/],
  ["teardown", /\bbreak(?:ing)? ?down\b|\bwhy (?:this|it) (?:works|went viral|blew up)\b|\bframe by frame\b|\btear ?down\b|\banaly[sz]e/],
  ["tutorial", /\bhow to\b|\bstep[- ]by[- ]step\b|\btutorial\b|\bin \d+\s*(?:seconds?|secs?|minutes?)\b|\bwalkthrough\b|\bsetup\b/],
  ["proof-first", /^\s*[\d₹$]|\b(?:i|we)\s+(?:made|earned|saved|got|hit)\b|\bresult\b|\bproof\b|\b\d+x\b/],
];
const FORMAT_RULES: [FormatKey, RegExp][] = [
  ["facecam", /face ?cam|to camera|talking head|selfie|on camera|talks? to the camera/],
  ["screen-record", /screen[- ]?record|screen share|screen capture|dashboard|walkthrough|on screen app/],
  ["voiceover-broll", /voice ?over|b-?roll|montage|footage/],
  ["skit", /skit|acting|character/],
  ["text-overlay", /text on screen|on-screen text|text overlay|kinetic text|captions? only/],
];
const EMOTION_RULES: [Emotion, RegExp][] = [
  ["curiosity", /\bwhy\b|\bhow\b|what happens|secret|nobody|truth/],
  ["surprise", /shock|didn'?t expect|unexpected|insane|crazy|wild|surpris/],
  ["relief", /finally|\beasy\b|simple|save[sd]? time|saved/],
  ["aspiration", /glow|level up|dream|upgrade|before and after/],
  ["fomo", /everyone|before it|miss out|too late|already/],
  ["humour", /funny|joke|\bpov\b|\blol\b|relatable|skit/],
  ["authority", /expert|years|tested|proved|data|analysis|mistake/],
];

export interface Extracted {
  pattern: Omit<TrendPattern, "id" | "addedAt" | "source">;
  confidence: "high" | "medium" | "low";
}

export function extractPattern(text: string, opts: { url?: string; niche: CreatorDNA["niche"] }): Extracted {
  const raw = text.trim();
  const t = raw.toLowerCase();
  const signals: string[] = [];

  const ranked = HOOK_RULES.map(([k, re], i) => ({ k, n: has(t, re), i })).sort((a, b) => b.n - a.n || a.i - b.i);
  const top = ranked[0]!;
  const hook: HookType = top.n > 0 ? top.k : "tutorial";
  if (top.n > 0) signals.push(`Hook reads as ${HOOK_TYPES[hook].toLowerCase()}`);

  const formats = FORMAT_RULES.filter(([, re]) => re.test(t)).map(([k]) => k);
  if (!formats.length) formats.push("facecam");
  else signals.push(`Formats: ${formats.map((f) => FORMATS[f].toLowerCase()).join(", ")}`);

  let durationSec: [number, number] = [15, 25];
  const range = t.match(/(\d{1,3})\s*(?:-|to)\s*(\d{1,3})\s*(?:sec|s\b|seconds)/);
  const single = t.match(/(\d{1,3})\s*(?:sec|s\b|seconds)\b/);
  const mins = t.match(/(\d{1,2})\s*(?:min|minutes)\b/);
  if (range) durationSec = [Number(range[1]), Number(range[2])];
  else if (single) durationSec = [Math.max(5, Number(single[1]) - 3), Number(single[1]) + 3];
  else if (mins) durationSec = [Number(mins[1]) * 60 - 10, Number(mins[1]) * 60 + 10];
  if (range || single || mins) signals.push(`Length about ${durationSec[0]} to ${durationSec[1]} seconds`);

  const mid = (durationSec[0] + durationSec[1]) / 2;
  let pacing: Pacing = mid <= 25 ? "fast" : mid <= 40 ? "medium" : "slow";
  if (/fast cuts|quick cuts|rapid|jump cuts|snappy/.test(t)) pacing = "fast";
  else if (/single take|one take|slow|calm/.test(t)) pacing = "slow";

  const cm = t.match(/comment\s+["“'‘]?([a-z0-9]{3,})/);
  let cta: CtaKind = "save";
  if (cm) cta = "comment";
  else if (/save (?:this|it)/.test(t)) cta = "save";
  else if (/(send|share|tag).{0,30}(friend|someone|colleague)/.test(t)) cta = "share";
  else if (/link in bio|in my bio/.test(t)) cta = "bio";
  else if (/follow/.test(t)) cta = "follow";
  signals.push(`CTA looks like: ${CTAS[cta].toLowerCase()}`);

  const audio = /trending (?:audio|sound)|viral sound/.test(t) ? "trending-audio" : /voice ?over/.test(t) ? "voiceover" : /music|beat|instrumental/.test(t) ? "music-bed" : "original-voice";
  const emotion = EMOTION_RULES.map(([k, re]) => ({ k, n: has(t, re) })).sort((a, b) => b.n - a.n)[0]!;
  const sentences = raw.split(/(?<=[.!?\n])\s+/).map((s) => s.trim()).filter(Boolean);
  const first = sentences[0] ?? raw;
  const firstFrameMatch = raw.match(/(?:opens?|starts?|begins?)\s+with\s+([^.\n]{8,100})/i);
  const proofBySec = /proof|result|number|screenshot/.test(first.toLowerCase()) ? 3 : pacing === "fast" ? 4 : 6;
  const editRhythm = pacing === "fast" ? "Cut every 1 to 2 seconds, zoom into the proof" : pacing === "medium" ? "Cut every 2 to 4 seconds, caption each claim" : "Long takes, cut on the beat";

  const confidence: Extracted["confidence"] = top.n >= 2 && raw.length > 60 ? "high" : top.n >= 1 ? "medium" : "low";
  const title = first.replace(/^["“']|["”']$/g, "").slice(0, 70);

  return {
    confidence,
    pattern: {
      title: title || "Saved Reel pattern",
      example: first.slice(0, 120),
      summary: `${HOOK_TYPES[hook]} hook, ${formats.map((f) => FORMATS[f].toLowerCase()).join(" and ")}, about ${Math.round(mid)} seconds.`,
      status: "emerging",
      niches: [opts.niche],
      sourceUrl: opts.url,
      signals: signals.slice(0, 6),
      mechanism: {
        hook, formats, durationSec, pacing,
        firstFrame: firstFrameMatch ? firstFrameMatch[1]!.trim() : first.slice(0, 90),
        editRhythm, cta, audio, emotion: emotion.n > 0 ? emotion.k : "curiosity", proofBySec,
      },
    },
  };
}

const TONE_EMOTIONS: Record<string, Emotion[]> = {
  analytical: ["curiosity", "authority", "surprise"],
  "dry humour": ["humour", "surprise"],
  direct: ["authority", "relief"],
  warm: ["aspiration", "relief"],
  energetic: ["fomo", "surprise", "humour"],
};
const GOAL_CTAS: Record<string, CtaKind[]> = {
  "brand-deals": ["follow", "save", "share"],
  leads: ["comment", "bio"],
  grow: ["follow", "share", "comment"],
  authority: ["save", "follow"],
  product: ["bio", "comment"],
};

export function scoreFit(p: TrendPattern, dna: CreatorDNA, ins: DnaInsights, memory: MemoryItem[] = []): Fit {
  const m = p.mechanism;
  const parts: Fit["parts"] = [];

  const nicheValue = p.niches === "any" ? 0.8 : p.niches.includes(dna.niche) ? 1 : 0.35;
  parts.push({ key: "niche", label: "Niche and topic", weight: 20, value: nicheValue, note: p.niches === "any" ? "Works across niches, so it needs your topic to land." : nicheValue === 1 ? "Already proven in your niche." : "Mostly seen outside your niche." });

  const hl = ins.hookLift[m.hook];
  let hookValue = 0.5;
  let hookNote = `No ${HOOK_TYPES[m.hook].toLowerCase()} posts yet, so this is a fresh test.`;
  if (hl) {
    hookValue = hl.lift >= 1.6 ? 1 : hl.lift >= 1.3 ? 0.85 : hl.lift >= 1.0 ? 0.65 : hl.lift >= 0.7 ? 0.4 : 0.2;
    hookNote = `Your ${HOOK_TYPES[m.hook].toLowerCase()} openings run ${hl.lift.toFixed(1)}x your baseline.`;
  }
  parts.push({ key: "hook", label: "Hook history", weight: 25, value: hookValue, note: hookNote });

  const mine = m.formats.filter((f) => dna.formats.includes(f)).length;
  const formatValue = mine === m.formats.length ? 1 : mine > 0 ? 0.65 : 0.25;
  parts.push({ key: "format", label: "Format", weight: 20, value: formatValue, note: mine === m.formats.length ? "You already shoot this way." : mine > 0 ? "One part is new for you." : "A new way of shooting for you." });

  const mid = (m.durationSec[0] + m.durationSec[1]) / 2;
  const diff = Math.abs(mid - ins.typicalDurationSec);
  const durValue = diff <= 6 ? 1 : diff <= 12 ? 0.6 : 0.3;
  parts.push({ key: "duration", label: "Length", weight: 10, value: durValue, note: `Pattern runs about ${Math.round(mid)}s. Your best posts run about ${ins.typicalDurationSec}s.` });

  const fits = dna.tone.some((t) => TONE_EMOTIONS[t]?.includes(m.emotion));
  parts.push({ key: "voice", label: "Voice", weight: 10, value: fits ? 1 : 0.45, note: fits ? `${EMOTIONS[m.emotion]} suits how you sound.` : `${EMOTIONS[m.emotion]} is off your usual tone.` });

  const goalCtas = new Set(dna.goals.flatMap((g) => GOAL_CTAS[g] ?? []));
  const goalValue = goalCtas.has(m.cta) ? 1 : 0.55;
  parts.push({ key: "goal", label: "Goal", weight: 15, value: goalValue, note: goalValue === 1 ? `${CTAS[m.cta]} supports your goals.` : `${CTAS[m.cta]} does little for your stated goals.` });

  let score = parts.reduce((a, x) => a + x.weight * x.value, 0);
  const pref = memory.find((x) => x.rule?.type === "cta" && x.rule.value === m.cta);
  if (pref) score += 3;
  score = Math.round(clamp(score, 0, 99));

  const weakest = [...parts].sort((a, b) => a.value * a.weight - b.value * b.weight || b.weight - a.weight)[0]!;
  const verdict =
    score >= 85 ? "Strong fit. Make this first." : score >= 70 ? `Good fit. Watch the ${weakest.label.toLowerCase()}.` : score >= 55 ? `Possible, but outside your strengths: ${weakest.label.toLowerCase()}.` : "Weak fit. Skip unless the goal matches.";
  return { score, parts, verdict };
}

export interface Adaptation {
  topic: string;
  hook: string;
  angle: string;
  why: string;
}

export function adaptations(p: TrendPattern, dna: CreatorDNA, ins: DnaInsights, count = 3): Adaptation[] {
  const seed = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const topics = dna.topics.length ? dna.topics : ["your main topic"];
  const lang = dna.languages[0] ?? "English";
  const styles = ["Direct", "Result first", "Curious"] as const;
  const hl = ins.hookLift[p.mechanism.hook];
  const first = p.mechanism.formats[0]!;
  const angleFor = (f: FormatKey, i: number): string => {
    const opener = i === 0 ? "Open on the result, then" : i === 1 ? "Open on the problem, then" : "Open mid-action, then";
    return f === "screen-record" ? `${opener} show the workflow on screen.` : f === "skit" ? `${opener} play it as one tight scene.` : f === "text-overlay" ? `${opener} let on-screen text carry the story.` : f === "voiceover-broll" ? `${opener} cover it with B-roll and a short voiceover.` : `${opener} talk straight to camera.`;
  };
  return Array.from({ length: Math.min(count, topics.length) }, (_, i) => {
    const topic = topics[(seed + i * 2) % topics.length]!;
    const style = styles[i % styles.length]!;
    const hook = hookText(p.mechanism.hook, style, { topic, proof: "", n: 7, secs: 20, keyword: keywordFrom(topic), lang });
    return {
      topic,
      hook,
      angle: angleFor(first, i),
      why: hl && hl.lift >= 1.15 ? `Your ${HOOK_TYPES[p.mechanism.hook].toLowerCase()} posts beat your baseline by ${hl.lift.toFixed(1)}x. This keeps the mechanism and uses your topic.` : `Same mechanism, your topic. Treat it as a test and log the result.`,
    };
  });
}

export function rankPatterns(patterns: TrendPattern[], dna: CreatorDNA, ins: DnaInsights, memory: MemoryItem[] = []) {
  return patterns
    .map((p) => ({ pattern: p, fit: scoreFit(p, dna, ins, memory) }))
    .sort((a, b) => b.fit.score - a.fit.score);
}

