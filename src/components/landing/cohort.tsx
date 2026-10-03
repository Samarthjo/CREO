import { Check } from "@phosphor-icons/react/dist/ssr";
import { Accent, Button, Mark, Panel } from "../ui/kit";
import { ApplyForm } from "./apply-form";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const DURING = [
  "CREO analyzes your existing content and performance",
  "Builds your Creator DNA",
  "Finds and explains the creative patterns that fit you",
  "Turns opportunities into scripts and content packages",
  "Learns from what you edit, accept, reject and publish",
  "Tracks how those decisions perform",
  "Hands-on CREO Strategist Support while the system learns",
];
const ASK = [
  "Use CREO and give honest feedback every week",
  "Permission to quote your results and testimonials",
  "Tell us what is still weak, so we fix it first",
];
const KEEP = [
  "Your accumulated Creator Memory",
  "Ongoing access to your CREO Intelligence",
  "Trend, Studio and collaboration intelligence",
  "Six months of CREO Strategist Support",
  "A target of 2 to 3 support touchpoints a week",
  "Continued product and intelligence improvements under plan terms",
];

function List({ title, items, tick }: { title: string; items: string[]; tick?: boolean }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-3 text-pretty text-[0.9375rem] leading-snug text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5">
            {tick && <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" />}
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The 30-day Founding Cohort: what happens during it, what we ask, what you can keep after it, and the application. */
export function Cohort() {
  return (
    <Section id="cohort" treeline={520}>
      <SectionHead eyebrow="30-Day Founding Cohort" title={<>30 days to build the AI Creator Manager around <Accent>you</Accent>.</>} sub="Limited seats per cohort so the team can stay hands-on." />

      <Reveal className="glow">
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-pop">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="border-b border-line p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <p className="text-sm text-muted">Founding Creator Cohort</p>
              <p className="mt-3 font-display text-[clamp(4.5rem,8.5vw,7rem)] font-semibold leading-none tracking-[-0.04em] text-accent">₹499</p>
              <p className="mt-3 text-xl text-ink">for <Mark>30 days</Mark></p>
              <p className="mt-7 text-[0.9375rem] font-medium text-ink">Limited seats per cohort.</p>
              <p className="mt-2 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">CREO handles about 70 to 80 percent of the analysis, intelligence and drafting. CREO strategists support the rest while it learns you.</p>
            </div>
            <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:p-12">
              <List title="During the cohort" items={DURING} tick />
              <List title="What we ask" items={ASK} />
            </div>
          </div>
          <p className="border-t border-line px-8 py-6 text-sm leading-relaxed text-muted sm:px-10 lg:px-12">
            Every script, edit and result becomes part of your Creator Memory, so the product gets more personal every week. We share progress on days 7, 14, 21 and 30.
          </p>
        </div>
      </Reveal>

      <div id="after-30-days" className="mt-20 scroll-mt-24 lg:mt-28"><AfterCohort applyHref="#apply" /></div>

      <div id="apply" className="mt-20 grid scroll-mt-24 grid-cols-[minmax(0,1fr)] items-start gap-10 lg:mt-28 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Reveal>
          <h3 className="max-w-[14ch] font-display text-[clamp(1.9rem,3vw,2.6rem)] font-normal leading-tight tracking-[-0.03em]">Apply for the next <Accent>cohort</Accent>.</h3>
          <p className="mt-4 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">Limited seats per cohort so the team can stay hands-on. We read every application and reach out to the creators we can help most.</p>
        </Reveal>
        <Reveal delay={0.08}><Panel className="p-7 lg:p-8"><ApplyForm variant="full" /></Panel></Reveal>
      </div>
    </Section>
  );
}

/** Day 30: the cohort is not a disposable trial. What the creator keeps, and for how much. Used on the home page and on /cohort. */
export function AfterCohort({ applyHref }: { applyHref: string }) {
  return (
    <>
      <SectionHead eyebrow="After 30 days" title={<>After 30 days, CREO already knows <Accent>you</Accent>.</>} sub="Your cohort isn't a disposable trial. CREO has spent 30 days learning your content history, style, performance patterns, decisions and goals." />
      <Reveal className="glow">
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-panel">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="border-b border-line bg-mark-wash/50 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <p className="text-sm font-medium text-ink">Keep your personalized CREO Intelligence</p>
              <p className="mt-3 font-display text-[clamp(3.5rem,6.5vw,5.5rem)] font-semibold leading-none tracking-[-0.04em] text-ink">₹5,999</p>
              <p className="mt-2 text-lg text-ink">one-time founding plan</p>
              <p className="mt-6 max-w-[38ch] text-[0.9375rem] leading-relaxed text-muted">Your personalized CREO Intelligence — built around 30 days of your content, decisions and performance.</p>
              <div className="mt-7"><Button variant="primary" size="lg" href={applyHref} className="max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:py-2.5 max-sm:text-center">Build my CREO first — ₹499 cohort</Button></div>
            </div>
            <div className="p-8 sm:p-10 lg:p-12">
              <List title="Included" items={KEEP} tick />
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}
