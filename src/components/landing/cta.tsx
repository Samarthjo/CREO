import { Landscape } from "../scene/landscape";
import { NIGHT_CLOUDS, WindClouds } from "../scene/wind-clouds";
import { Accent } from "../ui/kit";
import { ApplyForm } from "./apply-form";

/** The one call to action: the offer once, and the application on a solid panel. The night scene stays at the edges. */
export function Cta() {
  return (
    <section id="cohort" className="night relative bg-bg">
      <Landscape time="night" fadeTop={false} sky={<WindClouds time="night" clouds={NIGHT_CLOUDS} />} className="min-h-[56rem]">
        <div className="relative mx-auto flex w-full max-w-[76rem] justify-center px-4 pb-24 pt-20 sm:pt-28">
          <div className="w-full max-w-[36rem] rounded-[2.25rem] border border-line bg-surface px-6 py-10 shadow-pop sm:px-10 sm:py-12">
            <p className="text-sm font-medium text-accent">30-Day Founding Cohort</p>
            <h2 className="mt-3 font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-normal leading-[1] tracking-[-0.04em]">Join the next Founding Creator <Accent>Cohort</Accent>.</h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-body">₹499 for 30 days. CREO builds your Creator Intelligence while a CREO strategist works alongside you. Limited seats per cohort.</p>
            <div className="mt-7"><ApplyForm /></div>
            <p className="mt-5 text-[0.8125rem] text-body">Nothing leaves CREO without your approval.</p>
          </div>
        </div>
      </Landscape>
    </section>
  );
}
