"use client";

import { FilmSlate } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { inr, round500 } from "@/lib/engine/format";
import { Button, Chip, FitScore, Mark, Panel, cn } from "../ui/kit";
import { getDemo } from "./demo";

export function Hero() {
  return (
    <section className="relative overflow-x-clip">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,34.5rem)] lg:gap-12 lg:pb-28 lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,4.2vw,3.9rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <span className="block">Know <Mark sweep>what to post.</Mark></span>
            <span className="mt-2 block">Know <Mark sweep delay={450}>what to charge.</Mark></span>
          </h1>
          <p className="mt-7 max-w-[33rem] text-[1.125rem] leading-relaxed text-muted">
            CREO is the AI creator manager that turns trends into scripts and brand DMs into priced replies, with your approval.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" href="#cohort">Apply for the cohort</Button>
            <Button variant="ghost" size="lg" href="/app">Open the workspace</Button>
          </div>
        </div>
        <HeroManager />
      </div>
    </section>
  );
}

function HeroManager() {
  const { brief, ranked, ws } = getDemo();
  const reduce = useReducedMotion();
  const rows = brief.actions.filter((a) => a.kind === "create").slice(0, 2);
  const [open, setOpen] = useState(rows[0]!.id);
  const q = ws.inquiries[0]!;
  const [approved, setApproved] = useState(false);

  const detail = (id: string): string[] => {
    if (id.startsWith("create-")) return ranked.find((r) => `create-${r.pattern.id}` === id)?.fit.parts.slice(0, 3).map((p) => p.note) ?? [];
    return q.evaluation.reasoning.slice(0, 3);
  };

  return (
    <div className="relative lg:pl-6">
      <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.15 }}>
        <Panel className="p-5 pb-10 shadow-pop">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-semibold text-bg">AK</span>
              <div>
                <p className="text-sm font-medium text-ink">Arjun's morning brief</p>
                <p className="text-xs text-muted">Sample creator, 27K followers</p>
              </div>
            </div>
            <Chip tone="outline">{brief.found.patterns} patterns, {brief.found.drafts} drafts, {brief.found.inquiries} inquiry</Chip>
          </div>
          <ul>
            {rows.map((a, i) => {
              const on = open === a.id;
              const Icon = FilmSlate;
              return (
                <motion.li key={a.id} layout={reduce ? false : "position"} initial={reduce ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.45 + i * 0.16 }} className="border-b border-line last:border-b-0">
                  <button type="button" aria-expanded={on} onClick={() => setOpen(a.id)} className="flex w-full items-start gap-3.5 py-4 text-left">
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full transition", on ? "bg-mark text-on-mark" : "bg-sunk text-ink")}><Icon size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-medium text-ink">{a.title}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{a.subject}</span>
                    </span>
                    {a.fit ? <FitScore score={a.fit} size={44} /> : null}
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="pb-4 pl-[3.125rem]">
                        <p className="text-[0.8125rem] font-medium text-ink"><Mark sweep>Why now</Mark></p>
                        <ul className="mt-2 space-y-1 text-[0.8125rem] leading-snug text-muted">{detail(a.id).map((d) => <li key={d}>{d}</li>)}</ul>
                        <Link href={a.href} className="mt-3 inline-block text-[0.8125rem] font-medium text-ink underline underline-offset-4 hover:no-underline">{a.cta}</Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        </Panel>
      </motion.div>

      <motion.div initial={reduce ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20, delay: 1.1 }} className="relative -mt-8 w-[20.5rem] max-w-full lg:-ml-8">
        <Panel className="p-4 shadow-pop">
          <p className="text-xs font-medium text-muted">Waiting for your approval</p>
          <p className="mt-1 text-sm font-medium text-ink">Counter to {q.extraction.brand}</p>
          <p className="tnum mt-1 font-display text-xl font-semibold text-ink">{inr(q.evaluation.quote.lowInr)} to {inr(q.evaluation.quote.highInr)}</p>
          <p className="mt-0.5 text-xs text-muted">Walk away below {inr(round500(q.evaluation.quote.walkAwayInr))}. Nothing is sent until you approve.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant={approved ? "ghost" : "dark"} onClick={() => setApproved((a) => !a)} aria-pressed={approved}>{approved ? "Approved" : "Approve"}</Button>
            <Button size="sm" variant="ghost" href="/app/collabs?id=inq-tessera">Edit first</Button>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
