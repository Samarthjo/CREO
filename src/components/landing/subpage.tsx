import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Nav } from "./nav";

/**
 * One old section on its own page: the shared nav, an h1 for screen readers, the section, the footer.
 * One root element, so the router has a single node to scroll to the top after a link is followed.
 * The root is a .day: one background that walks from dawn to dusk down the page. `flow` says how far the day goes
 * (short pages only reach morning; long ones reach dusk).
 */
export function SubPage({ title, flow = "mid", children }: { title: string; flow?: "short" | "mid" | "long" | "dusk"; children: ReactNode }) {
  return (
    <div className="day" data-flow={flow}>
      <Nav />
      <main className="min-h-svh pt-20">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  );
}
