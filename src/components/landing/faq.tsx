import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Accent } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

export const FAQS = [
  { q: "What is CREO?", a: "CREO is an AI creator strategist. It learns your content, audience and deals, then tells you what to make next, turns trends into scripts, and prices brand offers. Anything that goes out under your name waits for your approval." },
  { q: "Who is CREO for?", a: "Individual creators in India who post consistently and are starting to earn from it, roughly 10K to 250K followers. That range is our starting guess, not a rule. If you cannot justify a full-time manager, you are who we are building for." },
  { q: "Does it replace a creator manager?", a: "No. It does the preparation a manager would: research, first drafts and deal math. You still make the calls, and in the founding cohort a CREO strategist works alongside you." },
  { q: "Which platforms does it support?", a: "Today CREO is built around Instagram Reels. You describe or paste a trend, and you paste a brand message from any channel. It does not connect to your accounts or scrape platforms yet. Other platforms are on the list, not promised." },
  { q: "Does CREO write content?", a: "Yes. Hooks, a script, a shot list, a caption, a CTA and titles in your voice, in English or Hinglish. You edit and approve. Gaps only you can fill, like your real result, stay highlighted instead of being invented." },
  { q: "How does creator memory work?", a: "Your approvals, edits, the reason for each edit and your post results are saved to a Memory that belongs to you. The next draft starts from it, and you can see everything CREO remembers on the Memory page." },
  { q: "Is there human support?", a: "In the founding cohort, yes: direct access to the team and weekly strategy support from a CREO creator strategist. We capture every correction, so the support you need should shrink as CREO learns." },
  { q: "How much does it cost?", a: "The Founding Creator Cohort is ₹499 for 30 days, for 10 to 15 creators. The founding rate renews only if the product earned continued use. Pricing after the cohort is not set yet." },
] as const;

export function Faq() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <Section id="faq" className="pt-10 lg:pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SectionHead eyebrow="FAQ" title={<>Questions, <Accent>answered</Accent>.</>} />
      <Reveal>
        <div className="mx-auto max-w-[48rem] divide-y divide-line rounded-panel border border-line bg-surface px-6 sm:px-8">
          {FAQS.map((f) => (
            <details key={f.q} name="faq" className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.0625rem] font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={18} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
