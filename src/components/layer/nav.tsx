import Link from "next/link";
import { Logo } from "../product/logo";
import { Button } from "../ui/kit";

/** A small floating pill: the logo and one button. */
export function Nav() {
  return (
    <header data-copy="marketing" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <div className="pointer-events-auto flex h-12 items-center gap-6 rounded-full border border-line bg-bg/70 py-1 pl-4 pr-1 shadow-panel backdrop-blur-xl">
        <Link href="/" aria-label="CREO home"><Logo /></Link>
        <Button variant="primary" size="md" href="#cohort">Apply for the cohort</Button>
      </div>
    </header>
  );
}
