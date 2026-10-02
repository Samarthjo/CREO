"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { FORMATS, NICHES } from "@/lib/engine/types";
import { Accent, Panel, cn } from "../ui/kit";
import { Tabs } from "../ui/interactive";
import { CountUp } from "../ui/count-up";
import { Ticket, TicketStrip } from "../ui/ticket";
import { getDemo } from "./demo";
import { Section, SectionHead } from "./section";

type Tab = "hooks" | "formats";

/** Section 2: CREO gets you. A Creator DNA read from the sample creator's posts, with the evidence behind it. */
export function DnaSection() {
  const { ws, insights } = getDemo();
  const reduce = useReducedMotion();
  const dna = ws.dna;
  const [tab, setTab] = useState<Tab>("hooks");

  const formats = Object.values(insights.formatLift).sort((a, b) => b.lift - a.lift);
  const bestHook = insights.hooksRanked[0]!;
  const bestFormat = formats[0]!;
  const rows = [
    ["Niche", NICHES[dna.niche].label],
    ["Audience", `${dna.audience.who}, ${dna.audience.ageBand}`],
    ["Voice", dna.tone.join(", ")],
    ["Best hook", `${bestHook.label}, ${bestHook.lift.toFixed(1)}x your baseline`],
    ["Best format", `${bestFormat.label}, ${bestFormat.lift.toFixed(1)}x`],
    ["Sweet spot", `${insights.typicalDurationSec} seconds`],
    ["Avoids", dna.avoidWords.slice(0, 3).join(", ") || "Nothing yet"],
  ] as const;

  const bars = tab === "hooks" ? insights.hooksRanked : formats;
  const max = Math.max(...bars.map((b) => b.lift), 1.2);

  return (
    <Section id="dna">
      <SectionHead eyebrow="CREO gets you" title={<>It is learning how <Accent>you</Accent> work.</>} sub="CREO is not just analyzing your account. It builds a Creator DNA from your posts, audience and deals, and every answer starts there." />

      <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Panel className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-medium tracking-tight">Creator DNA</h3>
            <span className="text-xs text-muted">Sample creator</span>
          </div>
          <dl className="mt-5 divide-y divide-line">
            {rows.map(([k, v], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3.5 text-[0.9375rem] sm:grid-cols-[8rem_minmax(0,1fr)]"
              >
                <dt className="text-muted">{k}</dt>
                <dd className={cn("font-medium text-ink", (k === "Best hook" || k === "Best format") && "text-accent")}>{v}</dd>
              </motion.div>
            ))}
          </dl>
        </Panel>

        <Panel className="flex flex-col p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-medium tracking-tight">Where that comes from</h3>
              <p className="mt-1 text-[0.8125rem] text-muted">Average views against your own baseline of {Math.round(insights.baseline).toLocaleString("en-IN")}.</p>
            </div>
            <Tabs<Tab> label="Evidence" value={tab} onChange={setTab} items={[{ id: "hooks", label: "Hooks" }, { id: "formats", label: "Formats" }]} />
          </div>
          <ul className="relative mt-6 flex flex-1 flex-col justify-center gap-3.5" key={tab}>
            <span aria-hidden className="absolute bottom-0 top-0 w-px bg-line-strong" style={{ left: `calc(7.75rem + (100% - 11.5rem) * ${1 / max})` }} />
            {bars.map((b, i) => (
              <li key={b.key} className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-3 text-[0.8125rem]">
                <span className={cn("truncate", i === 0 ? "font-medium text-ink" : "text-muted")}>{b.label}</span>
                <span className="relative h-5 overflow-hidden rounded-full bg-sunk">
                  <motion.span
                    className={cn("absolute inset-y-0 left-0 rounded-full", i === 0 ? "bg-lime-400" : "bg-line-strong")}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(b.lift / max) * 100}%` }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
                <span className="tnum text-right font-medium text-ink">{b.lift.toFixed(1)}x</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted">The line marks 1.0x, your usual. Hooks and formats come from {dna.posts.length} sample posts, so CREO would say "not enough data" before it guessed.</p>
        </Panel>
      </div>

      <div className="mt-10 lg:mt-14">
        <TicketStrip>
          <Ticket label="Posts CREO has read"><CountUp to={dna.posts.length} /></Ticket>
          <Ticket label="Best hook lift" note={bestHook.label}><CountUp to={bestHook.lift} decimals={1} suffix="x" /></Ticket>
          <Ticket label="Best format lift" note={FORMATS[bestFormat.key as keyof typeof FORMATS]}><CountUp to={bestFormat.lift} decimals={1} suffix="x" /></Ticket>
          <Ticket label="Your sweet spot" note="Median of your top posts"><CountUp to={insights.typicalDurationSec} suffix=" sec" /></Ticket>
        </TicketStrip>
        <p className="mt-4 text-center text-xs text-muted">Sample creator, real CREO engine. These are not results from live creators.</p>
      </div>
    </Section>
  );
}
