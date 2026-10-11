import { Accent } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section } from "./section";

/**
 * What the 30 days are, in plain words, and what each price buys, shown before the application so nobody is surprised.
 * Every fact here is already on the Cohort page and in the FAQ.
 */
export function Programme() {
  return (
    <Section id="programme" className="pt-6 lg:pt-10">
      <Reveal>
        <div className="mx-auto max-w-[56rem]">
          <p className="text-sm font-medium text-accent">The 30-day programme</p>
          <h2 className="mt-3 max-w-[20ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-normal leading-[1.04] tracking-[-0.04em]">What you are applying for, <Accent>in plain words</Accent>.</h2>
          <p className="mt-5 max-w-[44rem] text-[1.0625rem] leading-relaxed text-body">
            A small group of creators starts together. For 30 days you bring ideas and your post history. CREO builds your Creator Intelligence from them while a CREO strategist works alongside you. We share progress on days 7, 14, 21 and 30.
          </p>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-panel sm:p-9">
              <p className="text-sm font-medium text-ink">The programme</p>
              <p className="tnum mt-3 font-display text-[clamp(3.5rem,6vw,5rem)] font-semibold leading-none tracking-[-0.04em] text-accent">₹499</p>
              <p className="mt-2 text-lg text-ink">for 30 days</p>
              <p className="mt-5 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">This is what you pay to join. Seats are limited per cohort so the team can stay hands-on.</p>
            </div>
            <div className="rounded-[1.75rem] border border-line bg-mark-wash/50 p-7 sm:p-9">
              <p className="text-sm font-medium text-ink">Only if you want to keep going</p>
              <p className="tnum mt-3 font-display text-[clamp(3.5rem,6vw,5rem)] font-semibold leading-none tracking-[-0.04em] text-ink">₹5,999</p>
              <p className="mt-2 text-lg text-ink">one time, separate</p>
              <p className="mt-5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-muted">After day 30 you can keep your Creator Intelligence and Creator Memory, with six months of strategist support. It is a separate plan, not part of the ₹499, and the choice is yours.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
