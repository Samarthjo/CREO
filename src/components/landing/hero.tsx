import { Accent, Button, Eyebrow } from "../ui/kit";
import { HeroProduct } from "./hero-product";

export function Hero() {
  return (
    <section id="top" className="relative isolate pb-14 pt-[5.25rem] lg:pb-20">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[linear-gradient(to_bottom,var(--bg),var(--soft)_55%,var(--bg))] lg:h-[40rem]" />

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <Eyebrow className="mb-3 py-0.5">The Intelligence Layer for Creators</Eyebrow>
        <h1 className="max-w-[22ch] font-display text-[clamp(2.25rem,4.8vw,4.6rem)] font-normal leading-[0.98] tracking-[-0.045em]">
          Know what to post. <br className="hidden sm:block" />Know what to <Accent>charge</Accent>.
        </h1>
        <p className="mt-4 max-w-[42rem] text-[1.125rem] leading-relaxed text-body sm:text-[1.25rem]">
          Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.
        </p>
        <div className="mt-5">
          <Button variant="primary" size="lg" href="#cohort">Apply for the founding cohort</Button>
        </div>
      </div>

      <div id="product" className="mt-7 px-4 sm:px-6 lg:mt-8">
        <HeroProduct />
      </div>
    </section>
  );
}
