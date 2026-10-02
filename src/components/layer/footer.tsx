import Link from "next/link";

/** Two lines: the limits of the sample, and the one link that exists. */
export function Footer() {
  return (
    <footer data-copy="marketing" className="relative border-t border-line bg-bg">
      <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-2 px-5 py-8 text-xs text-muted sm:px-10">
        <p>Sample data. Works from what you add. Instagram Reels only. No testimonials yet.</p>
        <nav aria-label="Footer">
          <Link href="/app" className="hover:text-ink">Workspace</Link>
        </nav>
      </div>
    </footer>
  );
}
