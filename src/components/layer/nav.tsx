import Link from "next/link";
import { Logo } from "../product/logo";
import { Button } from "../ui/kit";

/**
 * A small floating pill: the logo and one button. The button is an outline while the hero's own button is on screen
 * (see .layer-nav-cta in layer.css), so only one lime button competes at a time. The pill can wrap at large text sizes.
 */
export function Nav() {
  return (
    <header data-copy="marketing" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <div className="pointer-events-auto flex min-h-12 max-w-full items-center gap-3 rounded-full border border-line bg-bg/70 py-1 pl-4 pr-1 shadow-panel backdrop-blur-xl sm:gap-6">
        <Link href="/" aria-label="CREO home" className="layer-nav-logo shrink-0">
          <Logo />
        </Link>
        <div data-hp className="layer-nav-cta min-w-0">
          <Button variant="primary" size="md" href="#cohort" className="h-auto! min-h-9 min-w-0 shrink! whitespace-normal! py-2 text-center leading-tight">
            Apply for the cohort
          </Button>
        </div>
      </div>
    </header>
  );
}
