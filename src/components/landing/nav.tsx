import Link from "next/link";
import { Logo } from "../product/logo";
import { Button } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";

const LINKS = [
  { href: "#experience", label: "Product" },
  { href: "#trend", label: "Trend" },
  { href: "#studio", label: "Studio" },
  { href: "#collab", label: "Collab Inbox" },
  { href: "#memory", label: "Memory" },
  { href: "#cohort", label: "Cohort" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-8 px-6">
        <Link href="/" aria-label="CREO home"><Logo /></Link>
        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition hover:bg-sunk hover:text-ink">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/app" className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-sunk sm:inline-block">Open the workspace</Link>
          <Button variant="primary" href="#cohort">Apply for the cohort</Button>
        </div>
      </div>
    </header>
  );
}
