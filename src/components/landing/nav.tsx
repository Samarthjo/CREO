import Link from "next/link";
import { Logo } from "../product/logo";
import { Button } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#loop", label: "Learning loop" },
  { href: "#collab", label: "Collab Inbox" },
  { href: "#cohort", label: "Cohort" },
  { href: "#faq", label: "FAQ" },
];

/** A small floating pill, not a full-width bar. The scene stays visible behind it. */
export function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <div className="pointer-events-auto flex h-12 items-center gap-1 rounded-full border border-line bg-bg/80 py-1 pl-4 pr-1 shadow-panel backdrop-blur-xl sm:gap-3">
        <Link href="/" aria-label="CREO home" className="mr-1 sm:mr-3"><Logo /></Link>
        <nav aria-label="Sections" className="hidden items-center md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-muted transition hover:bg-sunk hover:text-ink">{l.label}</a>
          ))}
        </nav>
        <span className="hidden lg:block"><ThemeToggle /></span>
        <Button variant="primary" size="md" href="#cohort" className="ml-1">Join the cohort</Button>
      </div>
    </header>
  );
}
