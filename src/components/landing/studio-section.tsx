"use client";

import { ChatsCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { Language } from "@/lib/engine/types";
import { LivePackage } from "./live-package";
import { Accent, Field, Input, Panel, Select } from "../ui/kit";
import { Tabs } from "../ui/interactive";
import { demoPackage, getDemo } from "./demo";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const TOPICS = ["competitor research", "client reports", "inbox triage", "cold outreach"];

export function StudioSection() {
  const { ranked } = getDemo();
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [trend, setTrend] = useState("tp-replaced-7d");
  const [proof, setProof] = useState("");
  const [lang, setLang] = useState<Language>("English");
  const [len, setLen] = useState<"30" | "45" | "60">("30");
  const pkg = useMemo(() => demoPackage({ topic, proof, lengthSec: Number(len) as 30 | 45 | 60, language: lang, trendId: trend }), [topic, proof, lang, len, trend]);

  return (
    <Section id="studio" band treeline={260}>
      <SectionHead eyebrow="CREO Studio" title={<>Turn intelligence into something worth <Accent>publishing</Accent>.</>} sub="Three hooks to open with, a script, a shot and B-roll plan, caption, CTA and title options. In your voice, in English or Hinglish. Gaps only you can fill stay highlighted." />
      <Reveal>
        <Panel className="overflow-hidden">
          <div className="grid gap-4 border-b border-line bg-sunk/60 p-5 md:grid-cols-[1.35fr_1fr_1.1fr_auto_auto] md:items-end">
            <Field label="Trend"><Select value={trend} onChange={(e) => setTrend(e.target.value)}>{ranked.slice(0, 4).map((r) => <option key={r.pattern.id} value={r.pattern.id}>{r.pattern.title}</option>)}</Select></Field>
            <Field label="Topic"><Select value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Your real result" hint="Leave blank and CREO marks the gap."><Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. saved 6 hours" /></Field>
            <div className="flex flex-col gap-1.5"><span className="text-[0.8125rem] font-medium text-ink">Length</span><Tabs<"30" | "45" | "60"> label="Length" value={len} onChange={setLen} items={[{ id: "30", label: "30s" }, { id: "45", label: "45s" }, { id: "60", label: "60s" }]} /></div>
            <div className="flex flex-col gap-1.5"><span className="text-[0.8125rem] font-medium text-ink">Language</span><Tabs<Language> label="Language" value={lang} onChange={setLang} items={[{ id: "English", label: "English" }, { id: "Hinglish", label: "Hinglish" }]} /></div>
          </div>
          <div className="p-6"><LivePackage key={pkg.id} pkg={pkg} /></div>
          <div className="flex gap-3.5 border-t border-line bg-soft/60 px-6 py-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mark-wash text-ink"><ChatsCircle size={18} /></span>
            <div>
              <p className="text-xs font-medium text-muted">Strategist note</p>
              <p className="mt-1 max-w-[62ch] text-[0.9375rem] leading-snug text-ink">Show the result on screen before you explain it. Your proof-first openings hold viewers longer than the ones that start with context.</p>
            </div>
          </div>
        </Panel>
      </Reveal>
    </Section>
  );
}
