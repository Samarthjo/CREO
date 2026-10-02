import { Landscape } from "../scene/landscape";
import { WindClouds } from "../scene/wind-clouds";
import { Accent, Button } from "../ui/kit";
import { HeroProduct } from "./hero-product";

export function Hero() {
  return (
    <section id="top" className="relative isolate pb-14 pt-24 lg:pb-20">
      <Landscape time="dawn" fadeTop="long" sky={<WindClouds time="dawn" />} className="absolute inset-x-0 top-28 -z-10 h-[36rem] rounded-b-[2.5rem] sm:h-[40rem] lg:top-24 lg:h-[46rem] lg:rounded-b-[4rem]" />

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <h1 className="max-w-[22ch] font-display text-[clamp(2.5rem,5.2vw,5rem)] font-normal leading-[0.98] tracking-[-0.045em]">
          The Intelligence <br className="hidden sm:block" />Layer for <Accent>Creators.</Accent>
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
