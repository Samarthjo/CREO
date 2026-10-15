import { Treeline } from "../scene/backdrop";
import { Accent } from "../ui/kit";
import { buildFlowCases } from "./flow-cases";
import { FlowSlides } from "./flow-slides";
import { Reveal } from "./reveal";

/**
 * The core story in six steps: CREO sees, understands, recommends; you create; real results come back; CREO learns.
 * Shown as a slideshow (flow-slides.tsx): the creator's problem on the left, an example video of CREO solving it on the right.
 * Three made-up creators go through the same steps. Every number and line comes from the same engines as the app (see flow-cases.ts).
 */
export function Rail() {
  return (
    <section id="story" className="relative isolate px-5 pb-20 pt-10 max-sm:pb-12 sm:px-6 lg:pb-28">
      <Treeline shift={-180} />
      <Reveal>
        <div className="mx-auto mb-10 max-w-[76rem] text-center lg:mb-12">
          <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.04] tracking-[-0.04em]">Stop rebuilding your content strategy from <Accent>zero</Accent>.</h2>
          <p className="mx-auto mt-4 max-w-[42rem] text-[1.0625rem] leading-relaxed text-muted">Every script, edit, Reel, result and decision adds to your Creator Memory, so the next recommendation starts with what already worked — and what did not.</p>
        </div>
        <FlowSlides cases={buildFlowCases()} />
      </Reveal>
    </section>
  );
}
