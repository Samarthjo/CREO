import type { ReactNode } from "react";
import { Eyebrow, cn } from "../ui/kit";
import { Reveal } from "./reveal";

export function Section({ id, className, children, band }: { id?: string; className?: string; children: ReactNode; band?: boolean }) {
  return (
    <section id={id} className={cn(band && "bg-sunk/60")}>
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
