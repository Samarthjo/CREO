import { uid, isoNow } from "./format.ts";
import { HASHTAGS, HOOK_STYLES, THUMB_DIRECTIONS, TITLES, cap, captionBody, ctaLine, hookText, keywordFrom, payoffLine, stakesLine, stepLines, type Vars } from "./copy.ts";
import type { DnaInsights } from "./dna.ts";
import { FORMATS, HOOK_TYPES, type CreatorDNA, type CtaKind, type Hook, type HookType, type Language, type MemoryItem, type ScriptBeat, type Shot, type StudioPackage, type TrendPattern } from "./types.ts";

export interface StudioInput {
  topic: string;
  proof: string;
  lengthSec: 30 | 45 | 60;
  language: Language;
  pattern?: TrendPattern;
  dna: CreatorDNA;
  insights: DnaInsights;
  memory: MemoryItem[];
}

export const normTopic = (t: string): string => {
  const x = t.trim().replace(/[.!?]+$/, "");
  return x.length > 1 && x[1] === x[1]!.toLowerCase() ? x[0]!.toLowerCase() + x.slice(1) : x;
};

export const SPOKEN_WORDS_PER_SEC = 2.6;
// Highlighted [slots] stand in for your own words, so each counts as about seven spoken words.
export const spokenSeconds = (script: ScriptBeat[]): number =>
  Math.round(script.reduce((a, b) => a + b.line.replace(/\[[^\]]+\]/g, "slot slot slot slot slot slot slot").split(/\s+/).filter(Boolean).length, 0) / SPOKEN_WORDS_PER_SEC);

export function buildPackage(input: StudioInput): StudioPackage {
  const { dna, insights, memory, pattern } = input;
  const L = input.lengthSec;
  const hookType: HookType = pattern?.mechanism.hook ?? insights.hooksRanked[0]?.key as HookType ?? "proof-first";
  const m = pattern?.mechanism;
  const topic = normTopic(input.topic) || "your topic";
  const v: Vars = {
    topic,
    proof: input.proof.trim(),
    n: hookType === "transformation" ? 7 : 3,
    secs: 20,
    keyword: keywordFrom(topic),
    lang: input.language,
  };

  // Memory and DNA decide which hook leads.
  const prefHook = memory.find((x) => x.rule?.type === "hook-style");
  const resultLift = insights.hookLift["proof-first"]?.lift ?? 0;
  const recommendedStyle = prefHook?.rule?.type === "hook-style" ? prefHook.rule.value : resultLift >= 1.4 ? "Result first" : "Direct";
  const hooks: Hook[] = HOOK_STYLES.map((style, i) => ({
    id: `h${i + 1}`,
    style,
    text: hookText(hookType, style, v),
    recommended: style === recommendedStyle,
  })).sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
  const chosen = hooks[0]!;

  const prefCta = memory.find((x) => x.rule?.type === "cta");
  const ctaKind: CtaKind = prefCta?.rule?.type === "cta" ? prefCta.rule.value : m?.cta ?? (dna.goals.includes("leads") ? "comment" : "save");
  const cta = ctaLine(ctaKind, v);

  // Script beats scaled to the chosen length. A 30 second video drops the stakes beat and keeps the payoff short.
  const compact = L <= 30;
  const e2 = compact ? 3 : Math.round(Math.max(8, L * 0.2));
  const e3 = L - (compact ? 8 : 12);
  const e4 = L - (compact ? 4 : 5);
  const steps = stepLines(hookType, v);
  const stepLen = (e3 - e2) / steps.length;
  const screen = (m?.formats ?? dna.formats).includes("screen-record");
  const face = (m?.formats ?? dna.formats).includes("facecam");
  const range = (a: number, b: number) => `${Math.round(a)}-${Math.round(b)}s`;

  const script: ScriptBeat[] = [
    { id: "hook", at: range(0, 3), label: "Hook", line: chosen.text, visual: m?.firstFrame ?? "Open on the result or the problem, no greeting." },
    ...(compact ? [] : [{ id: "stakes", at: range(3, e2), label: "Stakes", line: stakesLine(hookType, v), visual: face ? "To camera, one cut on the key word." : "B-roll of the problem, voiceover on top." }]),
    ...steps.map((line, i) => ({
      id: `step${i + 1}`,
      at: range(e2 + stepLen * i, e2 + stepLen * (i + 1)),
      label: `Step ${i + 1}`,
      line,
      visual: screen ? "Screen recording, zoom in on the action." : "B-roll of the action, text on screen for the key point.",
    })),
    { id: "payoff", at: range(e3, e4), label: "Payoff", line: payoffLine(v, compact), visual: "Show the result full-screen and hold for one second." },
    { id: "cta", at: range(e4, L), label: "CTA", line: cta, visual: ctaKind === "comment" ? "To camera, point at the comment button." : "To camera, finish on the last word." },
  ];

  const shots: Shot[] = [];
  let sid = 1;
  const add = (at: string, kind: Shot["kind"], note: string) => shots.push({ id: `s${sid++}`, at, kind, note });
  add(range(0, 3), face ? "A-roll" : "Screen", m?.firstFrame ?? "Result or problem on screen before you speak.");
  add(range(0, 3), "Overlay", `On-screen text: "${chosen.text.split(/\s+/).slice(0, 6).join(" ")}"`);
  if (!compact) add(range(3, e2), face ? "A-roll" : "B-roll", face ? "Tight to camera, no intro. Cut on the key word." : "Quick B-roll of the problem, 1 second each.");
  steps.forEach((_, i) => add(range(e2 + stepLen * i, e2 + stepLen * (i + 1)), screen ? "Screen" : "B-roll", screen ? `Record step ${i + 1} live, zoom 120% on the action.` : `Close-up of step ${i + 1}, hands in frame.`));
  add(range(e3, e4), "Overlay", "Result number or screen, large, with one line of text.");
  add(range(e4, L), "A-roll", ctaKind === "comment" ? `To camera. Show the comment keyword "${v.keyword}" on screen.` : "To camera. Hold the last frame for a beat.");

  const tags = HASHTAGS[dna.niche].slice(0, 4).join(" ");
  const caption = `${chosen.text}\n\n${captionBody(input.language)}\n\n${cta}\n\n${tags}`;
  const titleTexts = TITLES[hookType](v);
  const titles = titleTexts.map((text, i) => ({ text, thumb: THUMB_DIRECTIONS[i]! }));

  const proofShort = v.proof ? cap(v.proof).slice(0, 40) : "the result";
  const altOpenings = [
    `Open on the result with on-screen text "${proofShort}", then say: "${hooks[1]!.text}"`,
    `Open mid-action on ${topic} with no greeting, then say: "${hooks[2]!.text}"`,
  ];

  const applied: string[] = [];
  applied.push(pattern ? `Trend mechanism: ${pattern.title} (${HOOK_TYPES[hookType].toLowerCase()}, ${(m?.formats ?? []).map((f) => FORMATS[f].toLowerCase()).join(" and ")}).` : `No trend selected, so the hook type comes from your best performer: ${HOOK_TYPES[hookType].toLowerCase()}.`);
  const hl = insights.hookLift[hookType];
  if (hl) applied.push(`Creator DNA: your ${HOOK_TYPES[hookType].toLowerCase()} openings run ${hl.lift.toFixed(1)}x your baseline.`);
  if (prefHook) applied.push(`Memory: ${prefHook.text}`);
  if (prefCta) applied.push(`Memory: ${prefCta.text}`);
  if (input.language === "Hinglish") applied.push("Written in Hinglish to match how you talk on camera.");
  const joined = `${input.topic} ${input.proof}`.toLowerCase();
  for (const w of dna.avoidWords) if (joined.includes(w.toLowerCase())) applied.push(`Check: "${w}" is on your avoid list. Reword it before you shoot.`);
  if (/\[[^\]]+\]/.test(script.map((b) => b.line).join(" ") + chosen.text)) applied.push(`Highlighted brackets need your real details. CREO will not invent results.`);

  return {
    id: uid(),
    createdAt: isoNow(),
    topic,
    proof: input.proof.trim(),
    lengthSec: L,
    language: input.language,
    trendId: pattern?.id,
    trendTitle: pattern?.title,
    engine: "local",
    hooks,
    chosenHook: chosen.id,
    script,
    shots,
    caption,
    cta,
    keyword: v.keyword,
    titles,
    altOpenings,
    applied,
    status: "draft",
    corrections: [],
  };
}

export const packageText = (p: StudioPackage): string =>
  [
    `HOOK\n${p.hooks.find((h) => h.id === p.chosenHook)?.text ?? ""}`,
    `SCRIPT\n${p.script.map((b) => `${b.at}  ${b.line}`).join("\n")}`,
    `SHOT PLAN\n${p.shots.map((s) => `${s.at}  ${s.kind}: ${s.note}`).join("\n")}`,
    `CAPTION\n${p.caption}`,
    `TITLE OPTIONS\n${p.titles.map((t) => `${t.text} (${t.thumb})`).join("\n")}`,
  ].join("\n\n");
