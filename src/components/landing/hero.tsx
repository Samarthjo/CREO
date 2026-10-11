import { Landscape } from "../scene/landscape";
import { WindClouds } from "../scene/wind-clouds";
import { Accent, Button } from "../ui/kit";
import { GuidedDemo } from "./guided-demo";

/**
 * The headline is a split test (see HOOK_INIT in app/layout.tsx and the .hook-a / .hook-b rules in globals.css):
 * both versions are in the page, a script before first paint picks one at random, nothing is stored on the visitor's device,
 * and "?hook=a" or "?hook=b" in the address forces one for review. "a" is the control.
 */
export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-x-clip pb-14 pt-24 lg:pb-20">
      <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-28 -z-10 h-[36rem] rounded-b-[2.5rem] sm:h-[40rem] lg:top-24 lg:h-[46rem] lg:rounded-b-[4rem]" />

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">The Intelligence Layer for Creators</p>
        <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,5.2vw,5rem)] font-[680] leading-[0.98] tracking-[-0.038em]">
          <span className="hook-a">Stop guessing what to post <Accent>next.</Accent></span>
          <span className="hook-b">Your next Reel should feel like <Accent>you.</Accent></span>
        </h1>
        <p className="mt-5 max-w-[40rem] text-[1.125rem] leading-relaxed text-body sm:text-[1.25rem]">
          Bring an idea and your post history. CREO finds the angle, shapes the draft and learns from what you publish. You keep the final say.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-x-5 gap-y-3 sm:flex-row">
          <Button variant="primary" size="lg" href="/cohort#apply" data-track="join_cohort" data-track-where="hero">Apply for the 30-day programme</Button>
          <p className="text-[0.9375rem] font-medium text-ink">₹499 <span aria-hidden className="mx-1 text-faint">·</span> 30 days</p>
        </div>
      </div>

      <div id="product" className="mt-9 px-4 sm:px-6 lg:mt-10">
        <GuidedDemo />
      </div>
    </section>
  );
}
