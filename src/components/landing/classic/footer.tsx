import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "../../product/logo";
import { Cloud } from "../../scene/cloud";
import { Landscape } from "../../scene/landscape";
import { Accent, Button, Eyebrow } from "../../ui/kit";

/** Section 12: the closing CTA, on the night scene, in a frosted panel. */
export function ClassicFinalCta() {
  return (
    <section className="night relative bg-bg">
      <Landscape time="night" look="classic" fadeTop={false} className="h-[44rem] sm:h-[48rem] lg:h-[54rem]">
        <Cloud time="night" look="classic" seed={11} className="wind absolute -left-[5%] top-[6%] w-[16rem] opacity-80 sm:w-[24rem]" style={{ "--dur": "80s", "--run": "7vw" } as CSSProperties} />
        <div className="absolute inset-0 grid place-items-center px-4 pb-16">
          <div className="glass w-full max-w-[46rem] rounded-[2.25rem] px-6 py-12 text-center sm:px-12 sm:py-16">
            <Eyebrow>Founding Creator Cohort</Eyebrow>
            <h2 className="mx-auto mt-5 max-w-[13ch] font-display text-[clamp(2.4rem,5.6vw,4.75rem)] font-normal leading-[1] tracking-[-0.04em]">Stop guessing what to <Accent>post</Accent>.</h2>
            <p className="mx-auto mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-body">₹499 for 30 days. Limited seats per cohort. Hands-on CREO Strategist Support, and a say in what we build.</p>
            <div className="mt-8 flex justify-center"><Button variant="primary" size="lg" href="#apply">Join the Founding Cohort</Button></div>
          </div>
        </div>
      </Landscape>
    </section>
  );
}

export function ClassicFooter() {
  return (
    <footer className="relative -mt-8 rounded-t-[2rem] bg-lime-400 text-[#11140c]">
      <div className="mx-auto flex w-full max-w-[76rem] flex-wrap items-center justify-between gap-6 px-5 pb-10 pt-12 sm:px-6">
        <Logo inverse />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium">
          <Link href="/app" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Workspace</Link>
          <a href="#trend" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Trend</a>
          <a href="#studio" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Studio</a>
          <a href="#collab" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Collab Inbox</a>
          <a href="#cohort" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Cohort</a>
          <a href="#faq" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">FAQ</a>
        </nav>
        <p className="w-full text-xs text-[#11140c]/70">The creator, brands and numbers shown on this page are made-up samples running on the real CREO engine. No testimonials yet.</p>
      </div>
    </footer>
  );
}
