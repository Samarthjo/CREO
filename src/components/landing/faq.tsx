import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Accent } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

export const FAQS = [
  { q: "What is CREO?", a: "CREO is an AI Creator Manager and intelligence system. It analyzes your content, performance, creative patterns, trends and commercial opportunities, then uses persistent Creator Memory to make increasingly creator-specific recommendations." },
  { q: "Who is CREO for?", a: "Individual creators in India who post consistently and are starting to earn from it, roughly 10K to 250K followers. That range is our starting guess, not a rule. If you cannot justify a full-time manager, you are who we are building for." },
  { q: "Does CREO remember my work?", a: "Yes. CREO builds persistent Creator Memory from your content, scripts, performance, decisions and outcomes so future analysis starts with what it already knows about you." },
  { q: "Is CREO fully automated?", a: "CREO automates most analysis and drafting. During the Founding Cohort, CREO strategists work alongside the system when human judgment improves the result." },
  { q: "Does CREO write content?", a: "Yes. Hooks, a script, a shot list, a caption, a CTA and titles in your voice, in English or Hinglish. You edit and approve. Gaps only you can fill, like your real result, stay highlighted instead of being invented." },
  { q: "Which platforms does it support?", a: "Today CREO is built around Instagram Reels. You describe or paste a trend, and you paste a brand message from any channel. It does not connect to your accounts or scrape platforms yet. Other platforms are on the list, not promised." },
  { q: "What does the cohort cost?", a: "₹499 for 30 days." },
  { q: "How many creators can join?", a: "Seats are limited per cohort so the team can stay hands-on." },
  { q: "What happens after the 30-day cohort?", a: "Founding creators who want to continue can move to the one-time Personalized CREO founding plan for ₹5,999, keeping the intelligence and Creator Memory built during the cohort and receiving six months of CREO Strategist Support." },
] as const;

export function Faq() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <Section id="faq" className="pt-10 lg:pt-16" treeline={-300}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SectionHead eyebrow="FAQ" title={<>Questions, <Accent>answered</Accent>.</>} />
      <Reveal>
        <div className="mx-auto max-w-[48rem] divide-y divide-line rounded-panel border border-line bg-surface px-6 sm:px-8">
          {FAQS.map((f) => (
            <details key={f.q} name="faq" className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.0625rem] font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={20} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="-mt-2 max-w-[60ch] pb-5 text-[0.9375rem] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
