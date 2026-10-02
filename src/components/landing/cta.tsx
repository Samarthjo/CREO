import type { CSSProperties } from "react";
import { Cloud } from "../scene/cloud";
import { Landscape } from "../scene/landscape";
import { GlassTiles, tileSpots } from "../scene/tiles";
import { Accent } from "../ui/kit";
import { ApplyForm } from "./apply-form";

const TILES = tileSpots(21, [{ x: 6, y: 20, n: 3, spread: 8 }, { x: 94, y: 30, n: 3, spread: 7 }]);

/** The one call to action: the offer once, and the application in a frosted panel on the night scene. */
export function Cta() {
  return (
    <section id="cohort" className="night relative bg-bg">
      <Landscape time="night" fadeTop={false} className="min-h-[56rem]">
        <Cloud time="night" seed={11} className="drift-x absolute -left-[5%] top-[4%] w-[15rem] opacity-80 sm:w-[22rem]" style={{ "--dur": "120s" } as CSSProperties} />
        <GlassTiles spots={TILES} />
        <div className="relative mx-auto flex w-full max-w-[76rem] justify-center px-4 pb-24 pt-20 sm:pt-28">
          <div className="glass w-full max-w-[36rem] rounded-[2.25rem] px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-normal leading-[1] tracking-[-0.04em]">Tomorrow, it starts <Accent>smarter</Accent>.</h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-body">₹499 for 30 days. 10 to 15 creators. Direct access to the team.</p>
            <div className="mt-7"><ApplyForm /></div>
            <p className="mt-5 text-xs text-muted">Nothing leaves CREO without your approval.</p>
          </div>
        </div>
      </Landscape>
    </section>
  );
}
