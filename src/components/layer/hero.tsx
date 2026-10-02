import { Accent, Button } from "../ui/kit";

/** The hero is the explanation: the locked headline and tagline, one button, anchored low over the quiet floor of the scene. */
export function Hero() {
  return (
    <section id="top" data-copy="marketing" className="relative flex min-h-svh items-end px-5 pb-12 pt-28 sm:px-10 sm:pb-16 lg:pb-[clamp(2rem,7svh,5rem)]">
      <div data-hp className="layer-fade layer-hero mx-auto w-full max-w-[88rem]">
        <h1 className="layer-h1 font-display">
          The Intelligence Layer for <Accent>Creators.</Accent>
        </h1>
        <p className="layer-hero-tag max-w-[34rem] text-[clamp(1rem,1.25vw,1.2rem)] leading-normal text-muted">
          Your AI creator manager that remembers everything, analyzes everything, and turns it into your next best move.
        </p>
        <div className="layer-hero-cta">
          <Button variant="primary" size="lg" href="#cohort" className="h-auto! min-h-11 max-w-full whitespace-normal! py-2.5 text-center">Apply for the cohort</Button>
        </div>
      </div>
    </section>
  );
}
