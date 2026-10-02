import "@fontsource-variable/geist-mono";
import type { ReactNode } from "react";
import "./layer.css";
import { Stage } from "./stage";

/** The dark scope for the landing page: tokens, the fixed stage behind everything, and the page on top. */
export function LayerRoot({ children }: { children: ReactNode }) {
  return (
    <div className="layer">
      <Stage />
      {children}
    </div>
  );
}
