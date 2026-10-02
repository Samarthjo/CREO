"use client";

import type { CSSProperties } from "react";
import { Cloud } from "../scene/cloud";
import { Accent, Eyebrow, cn } from "../ui/kit";
import { usePinnedSteps } from "./use-pinned-steps";

const STEPS = [
  { n: "1", title: "AI drafts", body: "CREO builds the hook, script or reply from your Creator DNA, with its reasons beside it.", color: "var(--olive-800)" },
  { n: "2", title: "A strategist corrects", body: "In the founding cohort, a CREO strategist goes through weak drafts with you and fixes what the model got wrong.", color: "var(--fern-500)" },
  { n: "3", title: "CREO remembers why", body: "Every correction is saved with its reason, so the same mistake is not made twice. Support shrinks as CREO learns.", color: "var(--lime-400)" },
] as const;

/** Section 8: human in the loop. Three giant numerals; the active one opens. Scroll-pinned on large screens. */
export function HumanAiSection() {
  const { ref, pinned, active, go } = usePinnedSteps(STEPS.length);
  const cols = STEPS.map((_, i) => (i === active ? "3fr" : "1fr")).join(" ");

  return (
    <section id="human" ref={ref} className={cn("relative", pinned && "h-[320svh]")}>
      <div className={cn("relative overflow-hidden", pinned ? "sticky top-0 flex h-svh flex-col justify-center" : "py-20")}>
        <Cloud time="dusk" look="classic" seed={6} className="wind absolute -left-[5%] top-[4%] w-[17rem] sm:w-[26rem]" style={{ "--dur": "320s", "--run": "5vw" } as CSSProperties} />
        <Cloud time="dusk" look="classic" seed={9} className="wind absolute -right-[4%] top-[34%] w-[13rem] sm:w-[19rem]" style={{ "--dur": "420s", "--delay": "-150s", "--run": "5vw" } as CSSProperties} />

        <div className="relative mx-auto w-full max-w-[76rem] px-5 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <Eyebrow>Human in the loop</Eyebrow>
            <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.3rem,5.2vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.04em]">AI does the first pass. <Accent>People</Accent> make it right.</h2>
            <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-muted">CREO starts with AI and expert support. Over time you need less of the second, and we measure that.</p>
          </div>

          <ol className="mt-12 grid gap-6 lg:mt-14 lg:h-[24rem] lg:gap-0 lg:transition-[grid-template-columns] lg:duration-700 lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:[grid-template-columns:var(--cols)]" style={{ "--cols": cols } as CSSProperties}>
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.n} className="relative lg:overflow-hidden lg:border-l lg:border-line lg:first:border-l-0">
                  <button type="button" onClick={() => go(i)} aria-expanded={on} className="flex h-full w-full items-end gap-5 text-left lg:pl-3">
                    <span aria-hidden className="font-display font-semibold leading-[0.78] tracking-[-0.04em] text-[6.5rem] lg:text-[17rem]" style={{ color: s.color }}>{s.n}</span>
                    <span className={cn("max-w-[19rem] pb-2 transition-opacity duration-500 lg:pb-3", on ? "lg:opacity-100" : "lg:opacity-0")}>
                      <span className="block text-[1.25rem] font-medium leading-snug text-ink">{s.title}</span>
                      <span className="mt-2 block text-[0.9375rem] leading-relaxed text-muted">{s.body}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
