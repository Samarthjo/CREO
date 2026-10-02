import Link from "next/link";
import { Logo } from "../product/logo";
import { Button } from "../ui/kit";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="border-t border-line">
      <Reveal className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-8 px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:py-28">
        <div>
          <h2 className="max-w-[16ch] font-display text-[clamp(2.25rem,4.4vw,4rem)] font-semibold leading-[1] tracking-[-0.03em]">Build your manager with us.</h2>
          <p className="mt-5 max-w-[44ch] text-[1.0625rem] text-muted">Seats are limited to 10 to 15 creators.</p>
        </div>
        <Button variant="primary" size="lg" href="#apply">Apply for the cohort</Button>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-6 px-6 py-10">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted">
          <Link href="/app" className="hover:text-ink">Workspace</Link>
          <a href="#trend" className="hover:text-ink">Trend</a>
          <a href="#studio" className="hover:text-ink">Studio</a>
          <a href="#collab" className="hover:text-ink">Collab Inbox</a>
          <a href="#memory" className="hover:text-ink">Memory</a>
        </nav>
        <p className="w-full text-xs text-faint">The creator, brands and numbers shown on this page are made-up samples running on the real CREO engine.</p>
      </div>
    </footer>
  );
}
