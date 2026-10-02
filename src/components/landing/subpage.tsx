import type { ReactNode } from "react";
import { cn } from "../ui/kit";
import { Footer } from "./footer";
import { Nav } from "./nav";

/**
 * One old section on its own page: the shared nav, an h1 for screen readers, the section, the footer.
 * One root element, so the router has a single node to scroll to the top after a link is followed.
 */
export function SubPage({ title, night, children }: { title: string; night?: boolean; children: ReactNode }) {
  return (
    <div>
      <Nav />
      <main className={cn("pt-20", night && "night min-h-svh bg-bg text-body")}>
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  );
}
