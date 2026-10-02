import type { CtaKind, HookType, Language, NicheKey } from "./types.ts";

// Template grammar for Studio and Trend adaptations. Square brackets mark a slot only the creator can fill.
export interface Vars {
  topic: string;
  proof: string;
  n: number;
  secs: number;
  keyword: string;
  lang: Language;
}

export const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
export const slot = (lang: Language, en: string, hi: string): string => `[${lang === "Hinglish" ? hi : en}]`;
export const proofOf = (v: Pick<Vars, "proof" | "lang">): string => v.proof.trim() || slot(v.lang, "your result", "aapka result");

type Fn = (v: Vars) => string;
type HookSet = [direct: Fn, result: Fn, curious: Fn];

const EN: Record<HookType, HookSet> = {
  transformation: [
    (v) => `I let AI handle my ${v.topic} for ${v.n} days. Here's what changed.`,
    (v) => `${cap(proofOf(v))} after ${v.n} days of AI doing my ${v.topic}.`,
    (v) => `What happens when AI does your ${v.topic} for ${v.n} days?`,
  ],
  "proof-first": [
    (v) => `${cap(proofOf(v))}. Here's exactly how I did it.`,
    (v) => `The only thing I changed was my ${v.topic}. ${cap(proofOf(v))}.`,
    (v) => `Why did changing my ${v.topic} work so well?`,
  ],
  contrarian: [
    (v) => `Stop doing ${v.topic} the way everyone tells you to.`,
    (v) => `${cap(proofOf(v))} once I stopped doing ${v.topic} the usual way.`,
    (v) => `Everyone gets ${v.topic} wrong. Here's the part nobody mentions.`,
  ],
  pov: [
    (v) => `POV: you're still doing ${v.topic} by hand.`,
    (v) => `POV: ${proofOf(v)} and your ${v.topic} is already done.`,
    (v) => `POV: you finally fixed your ${v.topic}.`,
  ],
  list: [
    (v) => `${v.n} ${v.topic} mistakes I'd undo if I started over.`,
    (v) => `${v.n} changes to my ${v.topic}. ${cap(proofOf(v))}.`,
    (v) => `The ${v.n} ${v.topic} habits that quietly cost me the most.`,
  ],
  teardown: [
    (v) => `I broke down why this ${v.topic} setup works. Watch the first 3 seconds.`,
    (v) => `This ${v.topic} setup works. ${cap(proofOf(v))}. Here's the teardown.`,
    (v) => `Why does this ${v.topic} setup work when nothing else did?`,
  ],
  tutorial: [
    (v) => `How to sort your ${v.topic} in ${v.secs} seconds.`,
    (v) => `${cap(proofOf(v))}. Here's the exact ${v.topic} setup.`,
    (v) => `The ${v.topic} trick I took far too long to find.`,
  ],
};

const HI: Record<HookType, HookSet> = {
  transformation: [
    (v) => `Maine ${v.n} din tak ${v.topic} AI se karwaya. Result dekhiye.`,
    (v) => `${v.n} din mein ${proofOf(v)}, jab AI ne mera ${v.topic} sambhala.`,
    (v) => `Agar AI ${v.n} din tak aapka ${v.topic} kare, toh kya hoga?`,
  ],
  "proof-first": [
    (v) => `${cap(proofOf(v))}. Ye raha exact tareeka.`,
    (v) => `Maine bas apna ${v.topic} badla. ${cap(proofOf(v))}.`,
    (v) => `${cap(v.topic)} badalne se itna fark kyun pada?`,
  ],
  contrarian: [
    (v) => `${cap(v.topic)} wahi tareeke se karna band kijiye jo sab bolte hain.`,
    (v) => `${cap(proofOf(v))}, jab maine ${v.topic} ka purana tareeka chhoda.`,
    (v) => `${cap(v.topic)} mein sab ek cheez galat karte hain. Wo part koi nahi batata.`,
  ],
  pov: [
    (v) => `POV: aap abhi bhi ${v.topic} haath se kar rahe ho.`,
    (v) => `POV: ${proofOf(v)} aur aapka ${v.topic} ho chuka hai.`,
    (v) => `POV: aapne finally apna ${v.topic} theek kar liya.`,
  ],
  list: [
    (v) => `${v.n} ${v.topic} galtiyan jo main pehle din se na karta.`,
    (v) => `Mere ${v.topic} mein ${v.n} badlav. ${cap(proofOf(v))}.`,
    (v) => `${v.n} ${v.topic} aadatein jo chupke se sabse zyada nuksaan karti hain.`,
  ],
  teardown: [
    (v) => `Ye ${v.topic} setup kaam kyun karta hai, pehle 3 second dekhiye.`,
    (v) => `Ye ${v.topic} setup chalta hai. ${cap(proofOf(v))}. Poora teardown ye raha.`,
    (v) => `Ye ${v.topic} setup chala, jabki baaki kuch nahi chala. Kyun?`,
  ],
  tutorial: [
    (v) => `${v.secs} second mein ${v.topic} kaise sort karein.`,
    (v) => `${cap(proofOf(v))}. Ye raha exact ${v.topic} setup.`,
    (v) => `${cap(v.topic)} ka wo trick jo mujhe dhoondhne mein bahut time laga.`,
  ],
};

export const HOOK_STYLES = ["Direct", "Result first", "Curious"] as const;
export const hookText = (type: HookType, style: (typeof HOOK_STYLES)[number], v: Vars): string =>
  (v.lang === "Hinglish" ? HI : EN)[type][HOOK_STYLES.indexOf(style)]!(v);

const STAKES_EN: Record<HookType, Fn> = {
  transformation: (v) => `I lose hours every week to ${v.topic}. So for ${v.n} days I handed it to AI and tracked what changed.`,
  "proof-first": () => `You can copy this setup today. It takes about ten minutes.`,
  contrarian: (v) => `Most advice on ${v.topic} sounds smart and wastes your week.`,
  pov: (v) => `You know the feeling. Every Monday starts with ${v.topic}.`,
  list: (v) => `I've tried a lot of ${v.topic} habits. These ${v.n} are the ones that moved the needle.`,
  teardown: () => `I went through it step by step so you can see what actually does the work.`,
  tutorial: () => `You only need what's already on your phone and laptop.`,
};
const STAKES_HI: Record<HookType, Fn> = {
  transformation: (v) => `${cap(v.topic)} mein mera har hafte ghanton lagta hai. Isliye ${v.n} din maine ye AI ko de diya aur track kiya kya badla.`,
  "proof-first": () => `Ye setup aap aaj hi copy kar sakte ho. Das minute lagte hain.`,
  contrarian: (v) => `${cap(v.topic)} par zyaadatar advice smart lagti hai, par hafta barbaad karti hai.`,
  pov: (v) => `Wo feeling pata hai na. Har Monday ${v.topic} se hi shuru hota hai.`,
  list: (v) => `Maine ${v.topic} ki bahut aadatein try ki. Ye ${v.n} sach mein kaam aayi.`,
  teardown: () => `Maine ise step by step dekha, taaki aap dekh sako asli kaam kaun karta hai.`,
  tutorial: () => `Bas wahi chahiye jo aapke phone aur laptop mein pehle se hai.`,
};
export const stakesLine = (type: HookType, v: Vars): string => (v.lang === "Hinglish" ? STAKES_HI : STAKES_EN)[type](v);

const STEPS_EN: Record<HookType, (v: Vars) => string[]> = {
  transformation: (v) => [`Day 1: [what you handed over to AI].`, `Day 4: [what broke or surprised you].`, `Day ${v.n}: [the before and after, in one number].`],
  "proof-first": () => [`Step 1: [the first thing you changed].`, `Step 2: [the tool or prompt you used].`, `Step 3: [how you checked it worked].`],
  contrarian: () => [`The usual advice: [what everyone says].`, `Why it fails: [the real reason].`, `Do this instead: [your method, in one line].`],
  pov: () => [`Setup: [the relatable moment].`, `Twist: [what goes wrong or right].`, `Punchline: [one line that lands].`],
  list: () => [`One: [first item and why it matters].`, `Two: [second item and why it matters].`, `Three: [third item and why it matters].`],
  teardown: () => [`First frame: [what the viewer sees and why it stops the scroll].`, `Middle: [the move that keeps them watching].`, `Ending: [the line that earns the share].`],
  tutorial: () => [`Open [the tool or screen].`, `Do [the one action that matters].`, `Check [the result, on screen].`],
};
const STEPS_HI: Record<HookType, (v: Vars) => string[]> = {
  transformation: (v) => [`Din 1: [aapne AI ko kya diya].`, `Din 4: [kya toota ya chauka diya].`, `Din ${v.n}: [pehle aur baad, ek number mein].`],
  "proof-first": () => [`Step 1: [pehli cheez jo aapne badli].`, `Step 2: [kaunsa tool ya prompt use kiya].`, `Step 3: [kaise check kiya ki kaam kiya].`],
  contrarian: () => [`Aam salah: [jo sab bolte hain].`, `Kyun fail hoti hai: [asli wajah].`, `Iski jagah ye karo: [aapka tareeka, ek line mein].`],
  pov: () => [`Setup: [wo relatable moment].`, `Twist: [kya ulta hua].`, `Punchline: [ek line jo chipak jaye].`],
  list: () => [`Ek: [pehli cheez aur wo kyun matter karti hai].`, `Do: [doosri cheez aur wo kyun matter karti hai].`, `Teen: [teesri cheez aur wo kyun matter karti hai].`],
  teardown: () => [`Pehla frame: [viewer kya dekhta hai aur scroll kyun rukta hai].`, `Beech mein: [wo move jo dekhne par majboor kare].`, `End: [wo line jo share karwaye].`],
  tutorial: () => [`Kholiye [tool ya screen].`, `Kijiye [wo ek action jo matter karta hai].`, `Dekhiye [result, screen par].`],
};
export const stepLines = (type: HookType, v: Vars): string[] => (v.lang === "Hinglish" ? STEPS_HI : STEPS_EN)[type](v);

export const payoffLine = (v: Vars, compact = false): string =>
  compact
    ? `${cap(proofOf(v))}.`
    : v.lang === "Hinglish"
    ? `${cap(proofOf(v))}. Agar ${v.topic} aapka hafta kha raha hai, toh bas ek step se shuru kijiye.`
    : `${cap(proofOf(v))}. If ${v.topic} is eating your week, start with just one of these steps.`;

const CTA_EN: Record<CtaKind, Fn> = {
  comment: (v) => `Comment "${v.keyword}" and I'll send you the exact ${v.topic} workflow.`,
  save: (v) => `Save this for the next time ${v.topic} eats your week.`,
  follow: () => `Follow for one workflow like this every week.`,
  share: (v) => `Send this to the friend who still does ${v.topic} by hand.`,
  bio: () => `The template is in my bio.`,
};
const CTA_HI: Record<CtaKind, Fn> = {
  comment: (v) => `Comment mein "${v.keyword}" likhiye, main exact ${v.topic} workflow bhej dunga.`,
  save: (v) => `Ise save kar lijiye, jab agli baar ${v.topic} aapka hafta khaye.`,
  follow: () => `Har hafte aisa ek workflow chahiye toh follow kijiye.`,
  share: (v) => `Ye us dost ko bhejiye jo abhi bhi ${v.topic} haath se karta hai.`,
  bio: () => `Template meri bio mein hai.`,
};
export const ctaLine = (kind: CtaKind, v: Vars): string => (v.lang === "Hinglish" ? CTA_HI : CTA_EN)[kind](v);

export const captionBody = (lang: Language): string =>
  lang === "Hinglish"
    ? "Poora workflow video mein hai, exact steps aur agli baar main kya badlunga, sab ke saath."
    : "The whole workflow is in the video, with the exact steps and what I'd change next time.";

export const HASHTAGS: Record<NicheKey, string[]> = {
  "ai-tech": ["#aitools", "#productivity", "#workflow", "#techreels"],
  beauty: ["#skincareroutine", "#beautyindia", "#skincaretips", "#glowup"],
  fitness: ["#fitnessindia", "#workoutroutine", "#gymreels", "#healthyhabits"],
  food: ["#foodreels", "#easyrecipes", "#indianfood", "#homecooking"],
  finance: ["#personalfinance", "#moneytips", "#investingindia", "#budgeting"],
  education: ["#careertips", "#upskilling", "#studytips", "#jobsearch"],
  fashion: ["#fashionindia", "#styleinspo", "#ootd", "#thriftfinds"],
  travel: ["#travelindia", "#itinerary", "#budgettravel", "#traveltips"],
  lifestyle: ["#lifestyle", "#dayinmylife", "#relatable", "#reelsindia"],
};

export const TITLES: Record<HookType, (v: Vars) => string[]> = {
  transformation: (v) => [`${v.n} days of AI ${v.topic}`, `I stopped doing ${v.topic}`, `Before and after`],
  "proof-first": (v) => [v.proof.trim() ? cap(v.proof.trim()).slice(0, 36) : "The real result", `How ${v.topic} paid off`, `The exact setup`],
  contrarian: (v) => [`Stop doing ${v.topic} this way`, `The ${v.topic} myth`, `Do this instead`],
  pov: (v) => [`POV: ${v.topic}`, `Still doing this by hand?`, `Be honest`],
  list: (v) => [`${v.n} ${v.topic} mistakes`, `Undo these ${v.n}`, `${v.n} habits that cost me`],
  teardown: (v) => [`Why this works`, `Frame by frame`, `The ${v.topic} teardown`],
  tutorial: (v) => [`${cap(v.topic)} in ${v.secs}s`, `Do this once`, `The exact setup`],
};
export const THUMB_DIRECTIONS = [
  "Face to camera with one clear emotion, the result visible behind you.",
  "Split frame: before on the left, after on the right.",
  "One big word or number, high contrast, no face.",
];

export function keywordFrom(topic: string): string {
  const stop = new Set(["the", "and", "for", "with", "your", "my", "of", "to", "in", "on", "a", "an", "by", "how"]);
  const words = topic.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !stop.has(w));
  const pick = words.sort((a, b) => b.length - a.length)[0];
  return (pick ?? "guide").toUpperCase();
}
