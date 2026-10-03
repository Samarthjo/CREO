import Link from "next/link";
import { Logo } from "../product/logo";
import { NAV_LINKS } from "./nav-links";

const link = "inline-flex items-center leading-5 hover:underline pointer-coarse:min-h-11 pointer-coarse:min-w-11";

const EXPLORE = [{ href: "/app", label: "Workspace" }, ...NAV_LINKS];
const ABOUT = [
  { href: "/about", label: "Our Story" },
  { href: "/media", label: "Media Mentions" },
  { href: "/contact", label: "Contact Us" },
];
const LEGAL = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookies Settings" },
];

function Column({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
        {links.map((l) => <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>)}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="relative -mt-8 rounded-t-[2rem] bg-lime-400 text-[#11140c]">
      <div className="mx-auto w-full max-w-[76rem] px-5 pb-8 pt-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Logo inverse />
            <p className="max-w-[22ch] text-sm font-medium leading-relaxed">The Intelligence Layer for Creators.</p>
          </div>
          <Column title="Explore" links={EXPLORE} />
          <Column title="About Us" links={ABOUT} />
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-[#11140c]/20 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CREO. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-1 font-medium">
            {LEGAL.map((l) => <Link key={l.href} href={l.href} className={link}>{l.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
