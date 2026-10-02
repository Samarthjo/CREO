import type { Extraction, Signal, Span, SpanKind, UsageKind } from "./types.ts";

const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const toNum = (s: string): number => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()] ?? 0);
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
const FEE_CONTEXT = /(registration|joining|onboarding|membership|processing|verification|security|refundable|deposit|shipping|courier)\s*(fee|charges?|amount|deposit)?/i;
const PERSONAL_MAIL = /@(gmail|yahoo|outlook|hotmail|rediffmail|proton|icloud)\./i;
const STOP_BRANDS = new Set(["Instagram", "Hi", "Hello", "Hey", "India", "The", "Your", "Reels", "Reel", "Stories", "Please", "Let", "Thanks", "Regards", "Best", "Dear", "Also", "Our", "We"]);

const DURATION = /(\d+)\s*[- ]?\s*(days?|weeks?|months?|years?)/i;
const daysOf = (n: number, unit: string): number => (/^year/i.test(unit) ? n * 365 : /^month/i.test(unit) ? n * 30 : /^week/i.test(unit) ? n * 7 : n);

export function extractInquiry(raw: string): Extraction {
  const text = raw.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const spans: Span[] = [];
  const signals: Signal[] = [];
  // Look for a duration only inside the sentence or line that holds the keyword, preferring text after it.
  const durationNear = (idx: number, len: number): { days: number; at: number; len: number } | null => {
    const head = text.slice(0, idx);
    const a = Math.max(head.lastIndexOf("\n"), head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? ")) + 1;
    const rest = text.slice(idx);
    const ends = [rest.indexOf("\n"), rest.indexOf(". "), rest.indexOf("! "), rest.indexOf("? ")].filter((n) => n >= 0);
    const b = idx + (ends.length ? Math.min(...ends) : rest.length);
    const after = DURATION.exec(text.slice(idx + len, b));
    if (after) return { days: daysOf(Number(after[1]), after[2]!), at: idx + len + after.index, len: after[0].length };
    const before = DURATION.exec(text.slice(a, idx));
    return before ? { days: daysOf(Number(before[1]), before[2]!), at: a + before.index, len: before[0].length } : null;
  };
  // Highlight the whole clause from the keyword to its duration, so the creator sees exactly what was asked.
  const markClause = (kw: RegExpMatchArray, d: { at: number; len: number } | null, kind: SpanKind, label: string) => {
    const k0 = kw.index ?? 0;
    const k1 = k0 + kw[0].length;
    if (!d) return spans.push({ start: k0, end: k1, kind, label });
    spans.push({ start: Math.min(k0, d.at), end: Math.max(k1, d.at + d.len), kind, label });
  };

  const mark = (m: RegExpMatchArray | { index: number; len: number }, kind: SpanKind, label: string) => {
    const start = "len" in m ? m.index : m.index ?? 0;
    const end = "len" in m ? m.index + m.len : start + m[0].length;
    spans.push({ start, end, kind, label });
  };
  const signal = (id: string, severity: Signal["severity"], label: string, detail: string) => {
    if (!signals.some((x) => x.id === id)) signals.push({ id, severity, label, detail });
  };

  // Deliverables
  let reels = 0, stories = 0, posts = 0;
  const otherAsks: string[] = [];
  for (const m of text.matchAll(/\b(\d{1,2}|a|an|one|two|three|four|five|six)\s*(?:x\s*)?(?:instagram\s+|ig\s+)?(reels?|stories|story(?:\s+frames?)?|static\s+posts?|posts?|carousels?)\b/gi)) {
    const n = toNum(m[1]!);
    const k = m[2]!.toLowerCase();
    if (!n) continue;
    if (k.startsWith("reel")) reels += n;
    else if (k.startsWith("stor")) stories += n;
    else posts += n;
    mark(m, "deliverable", k.startsWith("reel") ? "Reel" : k.startsWith("stor") ? "Stories" : "Post");
  }
  if (!reels && !stories && !posts) {
    for (const m of text.matchAll(/\b(reel|stories|story)\b/gi)) {
      const k = m[1]!.toLowerCase();
      if (k === "reel" && !reels) reels = 1;
      if ((k === "story" || k === "stories") && !stories) stories = 1;
      mark(m, "deliverable", k === "reel" ? "Reel" : "Stories");
    }
  }
  for (const m of text.matchAll(/\b(youtube|yt video|linkedin|blog post|whatsapp status|tiktok)\b/gi)) otherAsks.push(m[1]!);

  // Money
  type Money = { amount: number; index: number; len: number; ctx: string; perUnit: boolean };
  const moneys: Money[] = [];
  const moneyRe = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(k|l|lakhs?|lacs?)?(?![\w])|([\d,]+(?:\.\d+)?)\s*(k|l|lakhs?|lacs?)?\s*(?:₹|rupees|inr)\b/gi;
  for (const m of text.matchAll(moneyRe)) {
    const digits = (m[1] ?? m[3] ?? "").replace(/,/g, "");
    const suffix = (m[2] ?? m[4] ?? "").toLowerCase();
    let amount = parseFloat(digits);
    if (!isFinite(amount)) continue;
    if (suffix === "k") amount *= 1000;
    else if (suffix) amount *= 100000;
    const idx = m.index ?? 0;
    const ctx = lower.slice(Math.max(0, idx - 60), idx + m[0].length + 45);
    moneys.push({ amount, index: idx, len: m[0].length, ctx, perUnit: /per\s+(reel|post|story|deliverable)|\beach\b|\/\s*(reel|post)/.test(lower.slice(idx, idx + m[0].length + 25)) });
  }
  let budgetInr: number | null = null;
  let budgetPerUnit = false;
  const candidates: (Money & { score: number })[] = [];
  for (const mo of moneys) {
    if (FEE_CONTEXT.test(mo.ctx) && /(pay|send|transfer|charge|fee|deposit)/.test(mo.ctx) && !/we (?:will|can|would) pay|budget|offer/.test(mo.ctx)) {
      mark({ index: mo.index, len: mo.len }, "risk", "Fee asked from you");
      signal("pay-to-join", "risk", "Asks you to pay", "A real brand pays you. Fees to join, verify or receive a product are a common scam pattern.");
      continue;
    }
    const score = (/budget|offer|pay(?:ing)? you|we can pay|fee|compensation|rate|remuneration|for the collab/.test(mo.ctx) ? 3 : 1) + (mo.perUnit ? 0.5 : 0);
    candidates.push({ ...mo, score });
  }
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const pick = candidates[0];
  if (pick) {
    budgetInr = pick.amount;
    budgetPerUnit = pick.perUnit;
    mark({ index: pick.index, len: pick.len }, "budget", pick.perUnit ? "Budget per deliverable" : "Budget");
  }

  const barter = /free product|gifting|gifted|barter|complimentary|product only|collab only|no monetary|no budget|unpaid|pr package|hamper|in exchange for (?:the )?product|send you (?:our|the) product/i;
  const commission = /commission|affiliate|per sale|revenue share|% of sales|performance[- ]based/i;
  let budgetKind: Extraction["budgetKind"] = "unknown";
  if (budgetInr) budgetKind = "cash";
  else if (barter.test(text)) budgetKind = "barter";
  else if (commission.test(text)) budgetKind = "commission";
  for (const m of text.matchAll(new RegExp(`${barter.source}|${commission.source}`, "gi"))) mark(m, "budget", /commission|affiliate|sale|share|performance/i.test(m[0]) ? "Commission only" : "No cash budget");

  // Dates
  let goLive: string | null = null;
  const dateRe = new RegExp(`\\b(?:by|before|on|until|deadline(?:\\s+is)?|go[- ]?live\\s+(?:by|on)|go[- ]?live|live\\s+(?:by|on)|due)\\s*:?\\s*((?:\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})[a-z]*(?:\\s+\\d{4})?)|(?:(?:${MONTHS})[a-z]*\\s+\\d{1,2}(?:st|nd|rd|th)?)|next\\s+(?:week|month|monday|friday)|tomorrow|tonight|this\\s+(?:week|weekend)|asap|immediately)`, "gi");
  const dm = dateRe.exec(text);
  if (dm) {
    goLive = dm[1]!.trim();
    mark(dm, "date", "Timeline");
  }
  const urgent = /\basap\b|\burgent\b|immediately|tomorrow|tonight|within\s+(?:24|48|72)\s*hours?|by\s+(?:eod|end of day)/i.test(text);
  if (urgent) signal("urgent", "info", "Tight timeline", "They want this fast. A rush fee of 20% is built into the quote.");

  // Usage rights
  let usage: UsageKind = "unknown";
  let usageDays: number | null = null;
  const perp = /(?:in\s+)?perpetuity|perpetual|forever|lifetime usage|unlimited (?:usage|use)/i.exec(text);
  const paid = /paid (?:ads?|media|promotion|usage|partnership)|whitelist(?:ing)?|spark ads?|boost(?:ing|ed)?|partnership ads?|run (?:it |them |the content )?as (?:an )?ads?|ad usage|usage rights?/i.exec(text);
  const organic = /organic (?:only|use)|no (?:paid )?ads|no usage/i.exec(text);
  if (perp) {
    usage = "perpetual";
    mark(perp, "usage", "Perpetual usage");
    signal("perpetual", "warn", "Perpetual usage", "They could run your content as ads forever. Price it at least double or cap it at 90 days.");
  } else if (paid) {
    const d = durationNear(paid.index ?? 0, paid[0].length);
    usageDays = d?.days ?? null;
    usage = usageDays === null ? "paid-unspecified" : usageDays <= 30 ? "paid-30" : "paid-90";
    markClause(paid, d, "usage", usage === "paid-unspecified" ? "Paid usage, no length" : `Paid usage, ${usageDays} days`);
  } else if (organic) {
    usage = "organic";
    mark(organic, "usage", "Organic only");
  }

  // Exclusivity
  let exclusivityAsked = false;
  let exclusivityDays: number | null = null;
  let ex = /exclusiv\w*|non-?compete|not (?:work|collaborat\w*|partner\w*) with (?:any )?(?:competing|competitor|other)/i.exec(text);
  // "No exclusivity" is a promise, not a demand.
  if (ex && /\b(?:no|without|not|zero)\s+(?:\w+\s+)?$/i.test(text.slice(Math.max(0, (ex.index ?? 0) - 16), ex.index ?? 0)) && /^exclusiv/i.test(ex[0])) ex = null;
  if (ex) {
    exclusivityAsked = true;
    const d = durationNear(ex.index ?? 0, ex[0].length);
    exclusivityDays = d?.days ?? null;
    markClause(ex, d, "exclusivity", exclusivityDays ? `Exclusive, ${exclusivityDays} days` : "Exclusivity, no length");
    if (exclusivityDays && exclusivityDays > 90) signal("long-exclusivity", "warn", "Long exclusivity", `${exclusivityDays} days blocks you from competing brands for a long stretch. It should be priced separately.`);
  }

  // Payment and revisions
  const pay = /net\s*\d{1,3}|\d{1,3}\s*days?\s+(?:after|from|post)\s+(?:invoice|posting|go-?live|delivery|publish\w*)|within\s+\d{1,3}\s*days?(?:\s+of\s+\w+)?|\d{1,3}\s*%\s*(?:advance|upfront)|advance payment|payment on delivery/i.exec(text);
  const paymentTerms = pay ? pay[0] : null;
  if (pay) mark(pay, "payment", "Payment terms");
  const rev = /(\d+|one|two|three)\s*(?:rounds?\s+of\s+)?(?:revisions?|edits?)/i.exec(text);
  const unlimitedRevisions = /unlimited\s+(?:revisions?|edits?|changes?)/i.test(text);
  if (unlimitedRevisions) signal("unlimited-revisions", "warn", "Unlimited revisions", "Cap revisions at one round or price extra rounds.");

  // Contact and brand
  const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(text)?.[0] ?? null;
  let brand: string | null = null;
  for (const m of text.matchAll(/(?:\bfrom|\bat|\bwith|representing|team at|we(?:'|’)re|we are|this is|i(?:'|’)m with)\s+((?:[A-Z][\w&.-]*)(?:\s+[A-Z][\w&.-]*){0,2})/g)) {
    const cand = m[1]!.replace(/[.,]$/, "");
    if (!STOP_BRANDS.has(cand.split(" ")[0]!) && cand.length > 2) {
      brand = cand;
      mark({ index: (m.index ?? 0) + m[0].length - m[1]!.length, len: m[1]!.length }, "brand", "Brand");
      break;
    }
  }
  if (!brand && email && !PERSONAL_MAIL.test(email)) brand = email.split("@")[1]!.split(".")[0]!.replace(/^./, (c) => c.toUpperCase());
  const contactName = /\b(?:i(?:'|’)m|i am|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/.exec(text)?.[1] ?? /(?:regards|thanks|cheers|best|warmly),?\s*\n\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i.exec(text)?.[1] ?? null;

  // Suspicious signals
  if (/\b(otp|password|cvv|card number|net banking|aadhaar|upi pin)\b/i.test(text)) {
    const m = /\b(otp|password|cvv|card number|net banking|aadhaar|upi pin)\b/i.exec(text)!;
    mark(m, "risk", "Sensitive detail asked");
    signal("sensitive", "risk", "Asks for private details", "No brand needs your OTP, password or card details. Do not reply with them.");
  }
  if (/\b(click|tap)\s+(?:on\s+)?(?:this|the)\s+link|bit\.ly|tinyurl|wa\.me\/|t\.me\//i.test(text)) signal("link", "warn", "Pushes a link", "Open links from unknown senders with care. Ask for a company email and a brief instead.");
  if (/\b(exposure|visibility|for the love|portfolio building|unpaid)\b/i.test(text) && !budgetInr) signal("exposure", "warn", "Pays in exposure", "Exposure is not a budget. Ask what they pay.");
  if (budgetKind === "barter" && reels + stories + posts > 0) signal("barter", "warn", "Gifting only", "A free product for full content is a trade of your time. Counter with a paid or hybrid fee.");
  if (budgetKind === "commission") signal("commission", "warn", "Commission only", "No fee up front means you carry the risk. Ask for a fixed fee plus commission.");
  const pressure = /\b(limited time|offer expires|reply within \d+ (?:hour|hr|minute)|today only|last chance|slots? (?:are )?filling)\b/i.exec(text);
  if (pressure) {
    mark(pressure, "risk", "Pressure tactic");
    signal("pressure", "warn", "Pressure to reply fast", "Real campaigns have time for questions.");
  }
  if (/dear (?:creator|influencer|sir|madam)|hello creator/i.test(text)) signal("generic", "info", "Generic greeting", "Check that they have actually seen your content before you invest time.");
  if (email && PERSONAL_MAIL.test(email) && /\b(we|our|brand|company|team)\b/i.test(text)) signal("personal-email", "warn", "Personal email", "A brand writing from a personal email address. Ask for a company address.");

  const missing: string[] = [];
  if (!brand) missing.push("Company name");
  if (reels + stories + posts === 0) missing.push("Deliverables (format and count)");
  if (budgetKind === "unknown") missing.push("Budget");
  if (!goLive) missing.push("Go-live date");
  if (usage === "unknown") missing.push("Usage rights (organic or paid ads, and how long)");
  if (usage === "paid-unspecified") missing.push("How long they will run it as ads");
  if (exclusivityAsked && !exclusivityDays) missing.push("Exclusivity length");
  if (!paymentTerms) missing.push("Payment terms and timeline");
  if (!rev && !unlimitedRevisions) missing.push("Number of revisions");
  if (!/brief|talking points|key message|guidelines|deck/i.test(text)) missing.push("Creative brief or talking points");

  // Resolve overlaps: keep earlier start, risk spans win ties.
  spans.sort((a, b) => a.start - b.start || (b.kind === "risk" ? 1 : 0) - (a.kind === "risk" ? 1 : 0) || b.end - a.end);
  const clean: Span[] = [];
  for (const s of spans) if (!clean.length || s.start >= clean[clean.length - 1]!.end) clean.push(s);

  return {
    brand, contactName, email, reels, stories, posts, otherAsks: [...new Set(otherAsks)],
    budgetInr, budgetPerUnit, budgetKind, goLive, urgent, usage, usageDays,
    exclusivityDays, exclusivityAsked, paymentTerms, revisions: rev ? toNum(rev[1]!) : null,
    unlimitedRevisions, missing, signals, spans: clean,
  };
}
