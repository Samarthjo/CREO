import { Landscape } from "../scene/landscape";
import { WindClouds } from "../scene/wind-clouds";
import { Accent, Button } from "../ui/kit";
import { HeroProduct } from "./hero-product";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-x-clip pb-14 pt-24 max-sm:pb-8 lg:pb-20">
      <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-28 -z-10 h-[36rem] rounded-b-[2.5rem] sm:h-[34rem] lg:top-24 lg:h-[38.5rem] lg:rounded-b-[4rem]" />

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">The Intelligence Layer for Creators</p>
        <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,5.2vw,5rem)] font-normal leading-[0.98] tracking-[-0.045em]">
          Stop guessing what to post <Accent>next.</Accent>
        </h1>
        <div className="mt-7 flex flex-col items-center gap-3 max-sm:mt-5">
          <Button href="/trial" variant="primary" size="lg" data-track="start_trial" data-track-where="hero">Try 14 days free</Button>
          <p className="text-[0.8125rem] text-body">No card needed. Or join the <a href="/cohort" className="font-medium text-ink underline underline-offset-4 hover:no-underline" data-track="join_cohort" data-track-where="hero">30-Day Founding Cohort</a>.</p>
        </div>
      </div>

      <div id="product" className="mt-9 px-4 max-sm:mt-6 sm:px-6 lg:mt-12">
        <HeroProduct guided />
      </div>
    </section>
  );
}
