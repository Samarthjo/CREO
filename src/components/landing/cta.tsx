import { Accent } from "../ui/kit";
import { ApplyForm } from "./apply-form";

/** The one call to action: the offer once, and the application on a plain night ground. */
export function Cta() {
  return (
    <section id="cohort" className="night relative bg-bg bg-[radial-gradient(60rem_28rem_at_50%_0%,rgb(47_61_143/0.45),transparent)]">
      <div className="relative mx-auto flex w-full max-w-[76rem] justify-center px-4 pb-24 pt-20 sm:pt-28">
        <div className="w-full max-w-[36rem] rounded-[2.25rem] border border-line bg-surface px-6 py-10 shadow-panel sm:px-10 sm:py-12">
          <h2 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-normal leading-[1] tracking-[-0.04em]">Tomorrow, it starts <Accent>smarter</Accent>.</h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-body">₹499 for 30 days. 10 to 15 creators. Direct access to the team.</p>
          <div className="mt-7"><ApplyForm /></div>
          <p className="mt-5 text-[0.8125rem] text-body">Nothing leaves CREO without your approval.</p>
        </div>
      </div>
    </section>
  );
}
