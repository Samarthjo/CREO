import { Landscape } from "../scene/landscape";
import { WindClouds } from "../scene/wind-clouds";
import { Accent, Button } from "../ui/kit";
import { HeroProduct } from "./hero-product";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-x-clip pb-14 pt-24 lg:pb-20">
      <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-28 -z-10 h-[36rem] rounded-b-[2.5rem] sm:h-[40rem] lg:top-24 lg:h-[46rem] lg:rounded-b-[4rem]" />

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">The Intelligence Layer for Creators</p>
        <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,5.2vw,5rem)] font-normal leading-[0.98] tracking-[-0.045em]">
          Stop guessing what to post <Accent>next.</Accent>
        </h1>
        <p className="mt-4 max-w-[44rem] text-[1.125rem] leading-relaxed text-body sm:text-[1.25rem]">
          CREO is a 30-day creator cohort that learns which hooks and formats work for your audience, then drafts your next post. You approve it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" href="/cohort#apply" data-track="join_cohort" data-track-where="hero">Join the 30-Day Founding Cohort</Button>
          <Button variant="ghost" size="lg" href="/learning-loop" className="bg-bg/60 backdrop-blur" data-track="see_learning_loop" data-track-where="hero">See how CREO learns</Button>
        </div>
        <p className="mt-3.5 max-w-[46rem] text-[0.8125rem] leading-relaxed text-body">
          <span className="font-semibold text-ink">What “cohort” means:</span> a small group of creators starting together. For 30 days, CREO builds your Creator Intelligence while a CREO strategist works alongside you.
        </p>
        <p className="mt-2 text-[0.8125rem] font-medium text-body">₹499 <span aria-hidden className="mx-1 text-faint">·</span> 30 days <span aria-hidden className="mx-1 text-faint">·</span> Limited seats per cohort</p>
      </div>

      <div id="product" className="mt-7 px-4 sm:px-6 lg:mt-8">
        <HeroProduct />
      </div>
    </section>
  );
}
