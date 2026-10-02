"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { MemoryItem } from "@/lib/engine/types";
import { MemoryRow } from "../product/memory";
import { Button, Chip, Mark, Panel } from "../ui/kit";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const LOOP = [
  { t: "AI answer", d: "CREO drafts the hook, script or reply." },
  { t: "Human correction", d: "You, or a CREO strategist, change what is weak." },
  { t: "Reason", d: "The why is saved with the edit." },
  { t: "Accepted or rejected", d: "Your decision is logged." },
  { t: "Actual result", d: "Views, saves and replies come back." },
  { t: "Memory", d: "The next draft starts from all of it." },
];

interface Pending { id: string; title: string; detail: string; risk: "Public" | "Commercial"; memory: string }
const PENDING: Pending[] = [
  { id: "p1", title: "Approve the package for client reports", detail: "Result first hook, 30 second script", risk: "Public", memory: "Approved the \"Result first\" hook for \"client reports\"." },
  { id: "p2", title: "Approve the counter to Tessera", detail: "1 Reel and 2 Stories, commercial terms", risk: "Commercial", memory: "Approved a counter to Tessera." },
];

export function MemorySection() {
  const { ws } = getDemo();
  const reduce = useReducedMotion();
  const base = ws.memory.filter((m) => m.kind === "correction" || m.kind === "outcome");
  const [pending, setPending] = useState(PENDING);
  const [feed, setFeed] = useState<MemoryItem[]>(base);
  const [fresh, setFresh] = useState<string | null>(null);

  const decide = (p: Pending, ok: boolean) => {
    setPending((x) => x.filter((i) => i.id !== p.id));
    const item: MemoryItem = { id: `new-${p.id}`, kind: "decision", source: p.risk === "Public" ? "studio" : "collab", at: new Date().toISOString(), text: ok ? p.memory : `Rejected: ${p.title.replace("Approve", "approve").toLowerCase()}.`, detail: { accepted: ok } };
    setFeed((f) => [item, ...f]);
    setFresh(item.id);
  };

  return (
    <Section id="memory" band>
      <SectionHead title="Every edit makes the next draft better." sub="Approvals, corrections and results go into Memory. HQ turns them into the next best action, so you never start cold." />
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Reveal>
          <ol className="relative">
            {LOOP.map((s, i) => (
              <li key={s.t} className="relative flex gap-5 pb-7 last:pb-0">
                {i < LOOP.length - 1 && <span aria-hidden className="absolute left-[0.6875rem] top-7 h-[calc(100%-1.75rem)] w-px bg-line-strong" />}
                <span className="tnum relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-xs font-semibold text-ink">{i + 1}</span>
                <div>
                  <p className="text-[0.9375rem] font-medium text-ink">{i === LOOP.length - 1 ? <Mark>{s.t}</Mark> : s.t}</p>
                  <p className="text-sm text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6">
          <Panel className="p-6">
            <div className="mb-1 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Approvals</h3><Chip tone="outline">{pending.length} waiting</Chip></div>
            <ul className="min-h-[7.5rem]">
              <AnimatePresence initial={false}>
                {pending.map((p) => (
                  <motion.li key={p.id} layout={!reduce} exit={reduce ? undefined : { opacity: 0, x: 24 }} transition={{ duration: 0.3 }} className="flex flex-wrap items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{p.title}</p><p className="text-xs text-muted">{p.detail}</p></div>
                    <Chip tone="outline">{p.risk}</Chip>
                    <Button size="sm" variant="primary" onClick={() => decide(p, true)}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(p, false)}>Reject</Button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!pending.length && <li className="py-3 text-sm text-muted">Nothing is waiting. Your decisions were saved to Memory below.</li>}
            </ul>
            {pending.length < PENDING.length && <button type="button" className="mt-2 text-[0.8125rem] text-muted underline underline-offset-4 hover:text-ink" onClick={() => { setPending(PENDING); setFeed(base); setFresh(null); }}>Reset the demo</button>}
          </Panel>

          <Panel className="px-6 pb-2 pt-6">
            <h3 className="font-display text-lg font-semibold">Memory</h3>
            <ul className="mt-1">
              <AnimatePresence initial={false}>
                {feed.map((m) => (
                  <motion.div key={m.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    {m.id === fresh ? <div className="-mx-3 rounded-control bg-mark-wash px-3"><MemoryRow item={m} /></div> : <MemoryRow item={m} />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </ul>
          </Panel>
        </Reveal>
      </div>
    </Section>
  );
}
