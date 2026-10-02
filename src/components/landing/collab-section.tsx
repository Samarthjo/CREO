"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { SAMPLE_INQUIRY, SAMPLE_SCAM, makeInquiry } from "@/lib/store/seed";
import { HEALTH_LABEL, healthTone } from "../product/brief";
import { MessageHighlight, QuotePanel, SignalList, TermsList } from "../product/collab";
import { Accent, Button, Chip, Panel, Textarea } from "../ui/kit";
import { Tabs } from "../ui/interactive";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

type Which = "offer" | "scam";

export function CollabSection() {
  const { ws } = getDemo();
  const [which, setWhich] = useState<Which>("offer");
  const [raw, setRaw] = useState(SAMPLE_INQUIRY);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(SAMPLE_INQUIRY);
  const [approved, setApproved] = useState(false);
  const q = useMemo(() => makeInquiry(raw, ws.dna, "paste", "landing-demo"), [raw, ws.dna]);
  const unsafe = q.extraction.signals.some((s) => s.severity === "risk");

  const choose = (w: Which) => { const t = w === "offer" ? SAMPLE_INQUIRY : SAMPLE_SCAM; setWhich(w); setRaw(t); setDraftText(t); setEditing(false); setApproved(false); };

  return (
    <Section id="collab">
      <SectionHead eyebrow="Collab Inbox" title={<>Paste the brand message. Get a <Accent>price</Accent>.</>} sub="CREO reads the terms, flags risks, sets a quote range and a walk-away price, and drafts a reply you approve." />
      <Pipeline />
      <Reveal>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col gap-6">
            <Panel className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sunk font-display text-sm font-semibold text-ink" aria-hidden>{which === "offer" ? "T" : "?"}</span>
                <div className="min-w-0"><p className="text-sm font-medium text-ink">{which === "offer" ? "Meera Rao, Tessera" : "Unknown sender"}</p><p className="text-[0.8125rem] text-muted">Sample brand message</p></div>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Tabs<Which> label="Sample message" value={which} onChange={choose} items={[{ id: "offer", label: "Brand offer" }, { id: "scam", label: "Pay-to-join message" }]} />
                <Button size="sm" variant="ghost" onClick={() => { setEditing((e) => !e); setDraftText(raw); }}>{editing ? "Cancel" : "Edit the message"}</Button>
              </div>
              {editing ? (
                <div className="flex flex-col gap-3">
                  <Textarea aria-label="Brand message" rows={13} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                  <div><Button variant="primary" size="sm" disabled={draftText.trim().length < 20} onClick={() => { setRaw(draftText); setEditing(false); setApproved(false); }}>Read the message</Button></div>
                </div>
              ) : (
                <MessageHighlight key={which + raw.length} raw={raw} spans={q.extraction.spans} sweep />
              )}
            </Panel>

            <Panel className="p-6">
              {q.draft && !unsafe ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-semibold">Draft reply</h3><Chip tone="outline">{q.draft.kind}</Chip></div>
                  <p className="line-clamp-7 whitespace-pre-line text-sm leading-relaxed text-ink">{q.draft.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button variant={approved ? "ghost" : "dark"} aria-pressed={approved} onClick={() => setApproved((a) => !a)}>{approved ? "Approved. You send it." : "Send for approval"}</Button>
                    <span className="text-[0.8125rem] text-muted">CREO never sends for you.</span>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-display text-lg font-semibold text-risk">Do not reply</h3>
                  <p className="mt-1.5 text-sm text-body">This message looks unsafe. Do not pay, click links or share personal details. CREO drafts nothing for it.</p>
                </div>
              )}
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            <Panel className="p-6">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="mr-auto font-display text-lg font-semibold">What CREO read</h3>
                <Chip tone={healthTone(q.evaluation.health)}>{HEALTH_LABEL[q.evaluation.health]}, {q.evaluation.score} of 100</Chip>
              </div>
              <TermsList ex={q.extraction} />
              <h4 className="mb-3 mt-5 text-sm font-semibold text-ink">Red flags</h4>
              <SignalList signals={q.extraction.signals} />
            </Panel>
            {!unsafe && <Panel className="p-6"><QuotePanel ev={q.evaluation} /></Panel>}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const PIPE = ["Message", "Terms", "Usage rights", "Budget", "Price", "Reply"];

/** The route a message takes through CREO. Lights up in order once, as it scrolls into view. */
function Pipeline() {
  return (
    <ol aria-label="What CREO does with a brand message" className="mx-auto -mt-4 mb-10 flex max-w-[52rem] flex-wrap items-center justify-center gap-x-2 gap-y-2 lg:mb-12">
      {PIPE.map((p, i) => (
        <motion.li key={p} className="flex items-center gap-2" initial={{ opacity: 0.25, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 1 }} transition={{ duration: 0.4, delay: i * 0.28 }}>
          <Chip tone={i === PIPE.length - 1 ? "mark" : "lime"}>{p}</Chip>
          {i < PIPE.length - 1 && <span aria-hidden className="text-faint">→</span>}
        </motion.li>
      ))}
    </ol>
  );
}
