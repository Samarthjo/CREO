import type { CSSProperties } from "react";
import { Cloud } from "../scene/cloud";
import { Landscape } from "../scene/landscape";
import { Accent, Eyebrow } from "../ui/kit";
import { Ticket, TicketStrip } from "../ui/ticket";

/**
 * Section 9: social proof, done honestly. There are no founding creators yet, so there are no quotes, logos or results.
 * The seats are shown as open tickets. When real creators exist, their tickets replace these.
 */
export function ProofSection() {
  return (
    <section id="proof" className="relative">
      <Landscape time="dusk" look="classic" fadeTop={false} className="h-[60rem] sm:h-[54rem] lg:h-[58rem]">
        <Cloud time="dusk" look="classic" seed={4} className="wind absolute -left-[6%] top-[27%] w-[14rem] sm:top-[5%] sm:-left-[4%] sm:w-[24rem]" style={{ "--dur": "70s", "--run": "7vw" } as CSSProperties} />
        <div className="night absolute inset-0 flex flex-col items-center px-5 pt-20 text-center sm:px-6 lg:pt-28">
          <Eyebrow>Founding creators</Eyebrow>
          <h2 className="mt-5 max-w-[14ch] font-display text-[clamp(2.4rem,5.4vw,4.75rem)] font-normal leading-[1.02] tracking-[-0.04em]">Be creator <Accent>#01</Accent>.</h2>
          <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink [text-shadow:0_1px_14px_rgb(40_30_90/0.55)]">We have no testimonials yet, and we will not invent any. These seats are open, and the first creators shape what CREO becomes.</p>
        </div>
        <div className="absolute inset-x-0 bottom-8 mx-auto w-full max-w-[76rem] px-5 sm:px-6 lg:bottom-12">
          <TicketStrip>
            {["01", "02", "03", "04"].map((n) => (
              <Ticket key={n} label={`Founding Creator #${n}`} note="Seat open">Your name</Ticket>
            ))}
          </TicketStrip>
          <p className="night mt-4 text-center text-xs text-ink [text-shadow:0_1px_10px_rgb(20_20_70/0.7)]">Limited seats per cohort.</p>
        </div>
      </Landscape>
      <div aria-hidden className="h-28 bg-gradient-to-b from-[#353f88] to-[#0c1030]" />
    </section>
  );
}
