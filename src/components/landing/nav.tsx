"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../product/logo";
import { Button, cn } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";
import { NAV_LINKS } from "./nav-links";

/**
 * A small floating pill. Each link opens its own page. The button goes to the form on whichever page has one.
 * Below the md breakpoint the five links live in a menu, so they are reachable on a phone.
 */
export function Nav() {
  const path = usePathname();
  const cta = path === "/" ? { href: "#cohort", label: "Apply for the cohort" } : path === "/cohort" ? { href: "#apply", label: "Join the cohort" } : path === "/classic" ? { href: "#cohort", label: "Join the cohort" } : { href: "/cohort", label: "Join the cohort" };
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        <button
          ref={toggle}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition hover:bg-sunk md:hidden"
        >
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {open && (
        <>
          <div aria-hidden className="pointer-events-auto fixed inset-0 -z-10 md:hidden" onClick={() => setOpen(false)} />
          <nav id="mobile-menu" aria-label="Menu" className="pointer-events-auto fixed inset-x-3 top-[4.5rem] rounded-[1.5rem] border border-line bg-bg p-2 shadow-pop md:hidden">
            <ul>
              {NAV_LINKS.map((l) => {
                const here = path === l.href;
                return (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={here ? "page" : undefined} className={cn("flex h-12 items-center rounded-full px-4 text-base font-medium transition hover:bg-sunk", here ? "bg-sunk text-ink" : "text-body")}>{l.label}</Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-1 flex items-center justify-between border-t border-line px-4 pt-2">
              <span className="text-sm text-muted">Light or dark</span>
              <ThemeToggle />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
