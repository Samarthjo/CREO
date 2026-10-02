import type { ReactNode } from "react";
import { cn } from "../ui/kit";
import { Reveal } from "./reveal";

export function Section({ id, className, children, band }: { id?: string; className?: string; children: ReactNode; band?: boolean }) {
  return (
    <section id={id} className={cn(band && "border-y border-line bg-surface")}>
      <div className={cn("mx-auto w-full max-w-[1240px] px-6 py-24 lg:py-32", className)}>{children}</div>
    </section>
  );
}

export function SectionHead({ title, sub, className }: { title: string; sub: string; className?: string }) {
  return (
    <Reveal className={cn("mb-12 lg:mb-14", className)}>
      <h2 className="max-w-[17ch] font-display text-[clamp(2.1rem,3.6vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.025em]">{title}</h2>
      <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted">{sub}</p>
    </Reveal>
  );
}
