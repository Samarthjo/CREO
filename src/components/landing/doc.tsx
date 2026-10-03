import type { ReactNode } from "react";
import { Eyebrow } from "../ui/kit";

/** A plain reading page: one heading, an intro, then short titled sections. Used by the story, contact and legal pages. */
export function Doc({ eyebrow, title, intro, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[44rem] px-5 pb-24 pt-10 sm:px-6 lg:pt-16">
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[clamp(2.3rem,5.2vw,4rem)] font-normal leading-[1.02] tracking-[-0.04em]">{title}</h2>
      {intro && <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted sm:text-[1.125rem]">{intro}</p>}
      {children && <div className="mt-10 flex flex-col gap-9">{children}</div>}
    </article>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</h3>
      <div className="mt-3 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-body">{children}</div>
    </section>
  );
}
