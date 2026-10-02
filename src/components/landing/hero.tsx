import { Cloud } from "../scene/cloud";
import { Landscape } from "../scene/landscape";
import { GlassTiles, tileSpots } from "../scene/tiles";
import { Accent, Button, Eyebrow } from "../ui/kit";
import { HeroProduct } from "./hero-product";

const TILES = tileSpots(3, [
  { x: 6, y: 52, n: 4, spread: 9 },
  { x: 93, y: 44, n: 3, spread: 7 },
  { x: 24, y: 80, n: 2, spread: 6 },
]);

export function Hero() {
  return (
    <section id="top" className="relative isolate pb-16 pt-28 sm:pt-32 lg:pb-24">
      <Landscape time="dawn" className="absolute inset-x-0 top-36 -z-10 h-[42rem] rounded-b-[2.5rem] sm:h-[50rem] lg:top-40 lg:h-[58.5rem] lg:rounded-b-[4rem]">
        <Cloud time="dawn" seed={2} className="drift-x absolute -left-[6%] top-[14%] w-[16rem] sm:w-[22rem]" style={{ "--dur": "90s" } as React.CSSProperties} />
        <Cloud time="dawn" seed={5} className="drift-x absolute -right-[5%] top-[22%] w-[15rem] sm:w-[21rem]" style={{ "--dur": "110s", "--delay": "-30s" } as React.CSSProperties} />
        <GlassTiles spots={TILES} />
      </Landscape>

      <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center px-5 text-center sm:px-6">
        <Eyebrow>Your AI creator strategist</Eyebrow>
        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.9rem,7.4vw,6.4rem)] font-normal leading-[0.98] tracking-[-0.045em]">
          CREO learns how <Accent>you</Accent> create.
        </h1>
        <p className="mt-6 max-w-[40rem] text-[1.0625rem] leading-relaxed text-muted sm:text-[1.1875rem]">
          From the content you make to the deals you close, CREO remembers what works for you and tells you what to do next.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" href="#cohort">Join the Founding Creator Cohort</Button>
          <Button variant="ghost" size="lg" href="#loop" className="bg-bg/60 backdrop-blur">See how CREO works</Button>
        </div>
        <p className="mt-4 text-[0.8125rem] text-muted">Founding price ₹499 for 30 days. 10 to 15 creators.</p>
      </div>

      <div id="product" className="mt-24 px-4 sm:px-6 lg:mt-40">
        <HeroProduct />
      </div>
    </section>
  );
}
