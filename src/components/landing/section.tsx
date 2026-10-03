import type { ReactNode } from "react";
import { Contours, Sky, Treeline, Wave } from "../scene/backdrop";
import { Eyebrow, cn } from "../ui/kit";
import { Reveal } from "./reveal";

/**
 * A page section. Decorations are opt-in and sit behind the content:
 *  - motif: one quiet picture ("contours" for memory, "wave" for trends)
 *  - treeline: a treeline along the bottom edge; the number slides the pattern so neighbours differ
 *  - band: a rounded, tinted slab (see .band in globals.css)
 * In the dark theme every section also gets a still sky along its top edge.
 */
export function Section({ id, className, children, band, motif, treeline }: { id?: string; className?: string; children: ReactNode; band?: boolean; motif?: "contours" | "wave"; treeline?: number }) {
  return (
    <section id={id} className={cn("relative isolate overflow-x-clip", band && "band bg-sunk/60")}>
      <Sky />
      {motif === "contours" && <Contours />}
      {motif === "wave" && <Wave />}
      {treeline !== undefined && <Treeline shift={treeline} />}
      <div className={cn("mx-auto w-full max-w-[76rem] px-5 py-20 sm:px-6 lg:py-32", className)}>{children}</div>
    </section>
  );
}

/** Centered section header: a pill label, one big line with at most one italic word, and a short supporting line. */
export function SectionHead({ eyebrow, title, sub, className, align = "center" }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; className?: string; align?: "center" | "left" }) {
  const center = align === "center";
  return (
    <Reveal className={cn("mb-12 flex flex-col lg:mb-16", center ? "items-center text-center" : "items-start text-left", className)}>
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <h2 className="max-w-[18ch] font-display text-[clamp(2.3rem,5.2vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.04em]">{title}</h2>
      {sub && <p className={cn("mt-5 max-w-[40rem] text-[1.0625rem] leading-relaxed text-muted sm:text-[1.125rem]", center && "mx-auto")}>{sub}</p>}
    </Reveal>
  );
}
