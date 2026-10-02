"use client";

import { useMemo, useState } from "react";
import { adaptations } from "@/lib/engine/trend";
import { AdaptationList, FitBreakdown, MechanismGrid, TrendRow } from "../product/trend";
import { Accent, Button, FitScore, Panel } from "../ui/kit";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

export function TrendSection() {
  const { ws, insights, ranked } = getDemo();
  const [sel, setSel] = useState(0);
  const list = ranked.slice(0, 5);
  const cur = list[sel]!;
  const ideas = useMemo(() => adaptations(cur.pattern, ws.dna, insights, 2), [cur, ws.dna, insights]);

  return (
    <Section id="trend">
      <SectionHead eyebrow="CREO Trend" title={<>Trends scored against <Accent>your</Accent> numbers.</>} sub="CREO explains why a pattern works, how well it fits your history, and gives you original ways to make it." />
      <Reveal>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2.5" aria-label="Trends ranked by creator fit">
            {list.map((r, i) => <li key={r.pattern.id}><TrendRow pattern={r.pattern} fit={r.fit.score} selected={sel === i} onSelect={() => setSel(i)} /></li>)}
          </ul>
          <Panel className="p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="max-w-[24ch] font-display text-[1.625rem] font-semibold leading-tight tracking-tight">{cur.pattern.title}</h3>
                <p className="mt-2 max-w-[48ch] text-sm text-muted">{cur.pattern.summary}</p>
              </div>
              <FitScore score={cur.fit.score} size={72} />
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <h4 className="mb-1 text-sm font-semibold text-ink">Why it fits, or does not</h4>
                <FitBreakdown fit={cur.fit} />
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-ink">What is working</h4>
                <MechanismGrid pattern={cur.pattern} />
              </div>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <h4 className="text-sm font-semibold text-ink">Original versions for you</h4>
              <AdaptationList items={ideas} />
              <div className="mt-5"><Button variant="primary" href="#studio">Turn this into my content</Button></div>
            </div>
          </Panel>
        </div>
      </Reveal>
    </Section>
  );
}
