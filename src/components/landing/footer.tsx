import Link from "next/link";
import { Logo } from "../product/logo";
import { NAV_LINKS } from "./nav-links";

export function Footer() {
  return (
    <footer className="relative -mt-8 rounded-t-[2rem] bg-lime-400 text-[#11140c]">
      <div className="mx-auto flex w-full max-w-[76rem] flex-wrap items-center justify-between gap-6 px-5 pb-10 pt-12 sm:px-6">
        <Logo inverse />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium">
          <Link href="/app" className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">Workspace</Link>
          {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} className="inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center">{l.label}</Link>)}
        </nav>
        <p className="w-full text-sm font-medium text-[#11140c]">Works from what you add. Instagram Reels only. No testimonials yet.</p>
      </div>
    </footer>
  );
}
