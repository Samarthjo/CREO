import { inr, round500 } from "./format.ts";
import { scopeText } from "./evaluate.ts";
import { USAGE_LABEL } from "./pricing.ts";
import type { CreatorDNA, Draft, DraftKind, Evaluation, Extraction } from "./types.ts";

export function makeDraft(kind: DraftKind, ex: Extraction, ev: Evaluation, dna: CreatorDNA, tone: Draft["tone"] = "warm"): Draft {
  const who = ex.contactName?.split(" ")[0] ?? "there";
  const brand = ex.brand ?? "your brand";
  const warm = tone === "warm";
  const scope = scopeText(ex.reels || 1, ex.stories, ex.posts);
  const sign = `Best,\n${dna.name.split(" ")[0]}`;
  const open = warm ? `Hi ${who},\n\nThanks for reaching out. ${brand} looks like a good fit for my audience of ${dna.audience.who.toLowerCase()}.` : `Hi ${who},\n\nThanks for the message.`;
  const subject = `Re: Collaboration with ${brand}`;
  const ask = round500(ev.quote.highInr);
  const c = ev.counter;

  let body = "";
  if (kind === "counter") {
    const usage = c.usage === "organic" || c.usage === "unknown" ? "organic use on my channel" : `${USAGE_LABEL[c.usage].toLowerCase()} plus organic use on my channel`;
    const terms = [
      `Usage: ${usage}. Longer paid usage is priced as an add-on.`,
      c.exclusivityDays ? `Exclusivity: ${c.exclusivityDays} days. Anything longer is priced separately.` : "Exclusivity: none included. It can be added for a fee.",
      "Payment: 50% to confirm, the balance within 7 days of posting.",
      "Revisions: one round included.",
    ];
    body = `${open}\n\nFor ${scope}, my fee is ${inr(ask)}. That covers concept, filming, one round of revisions and posting.\n\n${terms.map((t) => `- ${t}`).join("\n")}\n\nIf that works, please send the brief and your preferred go-live window${ex.goLive ? ` (you mentioned ${ex.goLive})` : ""} and I'll confirm dates.\n\n${sign}`;
  } else if (kind === "clarify") {
    body = `${open}\n\nBefore I can quote properly, could you share:\n\n${ex.missing.slice(0, 5).map((q) => `- ${q}`).join("\n")}\n\nOnce I have these I'll send a clear quote within a day.\n\n${sign}`;
  } else if (kind === "accept") {
    body = `${open}\n\nThe scope of ${scope} and the budget work for me. Please send the brief, the contract and the payment schedule, and I'll confirm dates${ex.goLive ? ` against your ${ex.goLive} go-live` : ""}.\n\n${sign}`;
  } else {
    body = `${warm ? `Hi ${who},\n\nThank you for thinking of me.` : `Hi ${who},`} This one isn't the right fit for me at the moment. If there is room in the budget for the scope, I'm happy to revisit.\n\n${sign}`;
  }
  return { kind, tone, subject, body, aiBody: body };
}
