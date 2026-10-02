import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Nav } from "./nav";

/**
 * One old section on its own page: the shared nav, an h1 for screen readers, the section, the footer.
 * One root element, so the router has a single node to scroll to the top after a link is followed.
 */
export function SubPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <Nav />
      <main className="min-h-svh pt-20">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  );
}
