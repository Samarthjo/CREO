import { ApplyForm } from "../landing/apply-form";
import { Accent } from "../ui/kit";

/** The one call to action. Opaque, so the fixed stage is hidden behind it. The limits of the product are stated here, where the visitor decides. */
export function Cta() {
  return (
    <section id="cohort" className="layer-cta relative">
      <div className="mx-auto grid w-full max-w-[76rem] grid-cols-[minmax(0,1fr)] gap-12 px-5 py-24 sm:px-10 lg:min-h-svh lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div data-copy="marketing">
          <h2 className="font-display [overflow-wrap:anywhere] text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[1] tracking-[-0.045em]">
            Tomorrow, it starts <Accent>smarter</Accent>.
          </h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-muted">
            Cohort: 10 to 15 creators, ₹499 for 30 days, direct team access.
          </p>
          <p className="mt-4 max-w-[30rem] text-sm leading-relaxed text-muted">
            Works from what you add. Instagram Reels only. No account connection yet. Trends hand-picked weekly.
          </p>
        </div>
        <div>
          <div data-copy="form" className="[&_form]:grid-cols-[minmax(0,1fr)] md:[&_form]:grid-cols-2 [&_button[type=submit]]:h-auto [&_button[type=submit]]:min-h-11 [&_button[type=submit]]:max-w-full [&_button[type=submit]]:whitespace-normal [&_button[type=submit]]:py-2.5 rounded-panel border border-line bg-surface p-6 shadow-panel sm:p-8">
            <ApplyForm />
          </div>
          <noscript>
            <p role="note" className="mt-4 text-sm text-muted">Applying needs JavaScript. Please turn it on and reload this page.</p>
          </noscript>
          <p data-copy="marketing" className="mt-5 text-xs text-muted">Nothing leaves CREO without your approval.</p>
        </div>
      </div>
    </section>
  );
}
