"use client";

import { useState } from "react";
import { Slots, cn } from "@/components/ui/kit";
import type { StudioData } from "./data";

/**
 * The Studio panel: three hook options, and the shoot plan drawn from the same engine as the app. Picking a hook rewrites
 * the opening line. The timeline is drawn to scale (seconds per script beat) and the shot strip has one cell per shot.
 */
export function StudioCard({ studio }: { studio: StudioData }) {
  const [chosen, setChosen] = useState(studio.chosen);
  const hook = studio.hooks.find((h) => h.id === chosen) ?? studio.hooks[0]!;

  return (
    <div className="studio">
      <header className="beat-head">
        <div className="studio-hooks" role="group" aria-label="Hook options">
          {studio.hooks.map((h) => (
            <button key={h.id} type="button" className="studio-pill" aria-pressed={h.id === chosen} onClick={() => setChosen(h.id)}>
              {h.style}
            </button>
          ))}
        </div>
        <span className="beat-tag">Sample data</span>
      </header>
      <div className="studio-body">
        <figure className="studio-frame">
          <span className="studio-frame-bar" aria-hidden />
          <p key={hook.id} className="studio-line swap-in">
            <Slots text={hook.short} />
          </p>
          <span className="studio-frame-foot" aria-hidden />
        </figure>
        <div className="studio-plan">
          <div className="studio-timeline" aria-hidden>
            {studio.segments.map((s, i) => (
              <span key={i === 0 ? `hook-${chosen}` : s.id} className={cn("studio-seg", i === 0 && "studio-seg-hook")} style={{ flexGrow: s.sec }} />
            ))}
          </div>
          <div className="studio-shots" aria-hidden>
            {studio.shots.map((k, i) => (
              <span key={i} className="studio-shot" data-kind={k} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
