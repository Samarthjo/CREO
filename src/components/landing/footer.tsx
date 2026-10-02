import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "../product/logo";
import { NAV_LINKS } from "./nav-links";
import { Cloud } from "../scene/cloud";
import { Landscape } from "../scene/landscape";
import { GlassTiles, tileSpots } from "../scene/tiles";
import { Accent, Button, Eyebrow } from "../ui/kit";

const TILES = tileSpots(21, [{ x: 7, y: 64, n: 3, spread: 8 }, { x: 93, y: 58, n: 3, spread: 7 }, { x: 50, y: 84, n: 2, spread: 10 }]);

/** Section 12: the closing CTA, on the night scene, in a frosted panel. */
export function FinalCta() {
  return (
    <section className="night relative bg-bg">
      <Landscape time="night" fadeTop={false} className="h-[44rem] sm:h-[48rem] lg:h-[54rem]">
        <Cloud time="night" seed={11} className="drift-x absolute -left-[5%] top-[6%] w-[16rem] opacity-80 sm:w-[24rem]" style={{ "--dur": "120s" } as CSSProperties} />
        <GlassTiles spots={TILES} />
        <div className="absolute inset-0 grid place-items-center px-4 pb-16">
          <div className="glass w-full max-w-[46rem] rounded-[2.25rem] px-6 py-12 text-center sm:px-12 sm:py-16">
            <Eyebrow>Founding Creator Cohort</Eyebrow>
            <h2 className="mx-auto mt-5 max-w-[13ch] font-display text-[clamp(2.4rem,5.6vw,4.75rem)] font-normal leading-[1] tracking-[-0.04em]">Stop guessing what to <Accent>post</Accent>.</h2>
            <p className="mx-auto mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-body">10 to 15 creators. 30 days. ₹499. Direct access to the team, and a say in what we build.</p>
            <div className="mt-8 flex justify-center"><Button variant="primary" size="lg" href="#apply">Join the Founding Cohort</Button></div>
          </div>
        </div>
      </Landscape>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative -mt-8 rounded-t-[2rem] bg-lime-400 text-[#11140c]">
      <div className="mx-auto flex w-full max-w-[76rem] flex-wrap items-center justify-between gap-6 px-5 pb-10 pt-12 sm:px-6">
        <Logo inverse />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium">
          <Link href="/app" className="hover:underline">Workspace</Link>
          {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>)}
        </nav>
        <p className="w-full text-sm font-medium text-[#11140c]">Sample data. Works from what you add. Instagram Reels only. No testimonials yet.</p>
      </div>
    </footer>
  );
}
