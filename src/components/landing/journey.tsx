import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Treeline } from "../scene/backdrop";
import { Reveal } from "./reveal";

const STEPS = [
  { title: "Find your angle", body: "Bring an idea and your post history. CREO shows which angle fits you, and why." },
  { title: "Make it yours", body: "CREO shapes the draft in your voice. You edit it and approve it." },
  { title: "Learn for next time", body: "Bring back the result. CREO keeps what worked, so the next draft starts further ahead." },
] as const;

/** The whole idea in one line and three steps. The six steps behind it are in the guided demo above. */
export function Journey() {
  return (
    <section id="how" className="relative isolate px-5 pb-16 pt-14 sm:px-6 lg:pb-24 lg:pt-20">
      <Treeline shift={-180} />
      <Reveal>
        <ol aria-label="How CREO works" className="mx-auto grid max-w-[76rem] items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
          {STEPS.flatMap((s, i) => [
            <li key={s.title} className="rounded-panel border border-line bg-surface p-6 shadow-panel sm:p-7">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-[650] leading-[1.05] tracking-[-0.03em] text-ink">{s.title}</h3>
              <p className="mt-3 max-w-[32ch] text-[0.9375rem] leading-relaxed text-muted">{s.body}</p>
            </li>,
            i < STEPS.length - 1 ? <li key={`${s.title}-arrow`} aria-hidden className="hidden items-center md:flex"><ArrowRight size={22} className="text-faint" /></li> : null,
          ])}
        </ol>
      </Reveal>
    </section>
  );
}
