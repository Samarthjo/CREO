import { ApplyForm } from "../landing/apply-form";
import { Accent } from "../ui/kit";

/** The one call to action. Opaque, so the fixed stage is hidden behind it. */
export function Cta() {
  return (
    <section id="cohort" className="layer-cta relative">
      <div className="mx-auto grid w-full max-w-[76rem] gap-12 px-5 py-24 sm:px-10 lg:min-h-svh lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div data-copy="marketing">
          <h2 className="font-display text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[1] tracking-[-0.045em]">
            Tomorrow, it starts <Accent>smarter</Accent>.
          </h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-muted">
            ₹499 for 30 days. 10 to 15 creators. Direct access to the team.
          </p>
        </div>
        <div>
          <div data-copy="form" className="rounded-panel border border-line bg-surface p-6 shadow-panel sm:p-8">
            <ApplyForm />
          </div>
          <p data-copy="marketing" className="mt-5 text-xs text-muted">Nothing leaves CREO without your approval.</p>
        </div>
      </div>
    </section>
  );
}
