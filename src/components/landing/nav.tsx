"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../product/logo";
import { Button, cn } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";
import { NAV_LINKS } from "./nav-links";

/** A small floating pill. Each link opens its own page. The button goes to the form on whichever page has one. */
export function Nav() {
  const path = usePathname();
  const cta = path === "/" ? { href: "#cohort", label: "Apply for the cohort" } : path === "/cohort" ? { href: "#apply", label: "Join the cohort" } : path === "/classic" ? { href: "#cohort", label: "Join the cohort" } : { href: "/cohort", label: "Join the cohort" };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <div className="pointer-events-auto flex h-12 items-center gap-1 rounded-full border border-line bg-bg/80 py-1 pl-4 pr-1 shadow-panel backdrop-blur-xl sm:gap-3">
        <Link href="/" aria-label="CREO home" className="mr-1 sm:mr-3"><Logo /></Link>
        <nav aria-label="Pages" className="hidden items-center md:flex">
          {NAV_LINKS.map((l) => {
            const here = path === l.href;
            return (
              <Link key={l.href} href={l.href} aria-current={here ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition hover:bg-sunk hover:text-ink", here ? "bg-sunk text-ink" : "text-muted")}>{l.label}</Link>
            );
          })}
        </nav>
        <span className="hidden lg:block"><ThemeToggle /></span>
        <Button variant="primary" size="md" href={cta.href} className="ml-1">{cta.label}</Button>
      </div>
    </header>
  );
}
