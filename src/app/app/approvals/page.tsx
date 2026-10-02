"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "@/lib/store/workspace";
import { Button, Chip, Empty, Input, PageHeader, Panel, Skeleton } from "@/components/ui/kit";

export default function ApprovalsPage() {
  const { ws, dispatch } = useWorkspace();
  const reduce = useReducedMotion();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  if (!ws) return <Skeleton className="h-96" />;

  const pending = ws.approvals.filter((a) => a.status === "pending");
  const done = ws.approvals.filter((a) => a.status !== "pending");

  const preview = (refId: string, kind: "studio" | "collab") => {
    if (kind === "studio") {
      const p = ws.packages.find((x) => x.id === refId);
      return p ? { text: p.hooks.find((h) => h.id === p.chosenHook)?.text ?? "", href: "/app/studio", cta: "Open in Studio" } : null;
    }
    const q = ws.inquiries.find((x) => x.id === refId);
    return q?.draft ? { text: q.draft.body.split("\n").filter(Boolean).slice(0, 3).join(" "), href: `/app/collabs?id=${q.id}`, cta: "Open in Collab Inbox" } : null;
  };

  return (
    <>
      <PageHeader title="Approvals" sub="Nothing public or commercial leaves CREO without your approval. Your decisions and edits teach CREO what you would have chosen." />
      <section aria-label="Waiting for you" className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {pending.map((a) => {
            const pv = preview(a.refId, a.kind);
            return (
              <motion.div key={a.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 140, damping: 20 }}>
                <Panel className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><Chip tone="outline">{a.risk}</Chip><span className="text-xs text-muted">{a.kind === "studio" ? "Studio" : "Collab Inbox"}</span></div>
                      <h2 className="mt-2 font-display text-xl font-semibold leading-snug">{a.title}</h2>
                      <p className="mt-1 text-sm text-muted">{a.detail}</p>
                      {pv && <p className="mt-3 max-w-[70ch] rounded-control bg-sunk p-3.5 text-sm leading-relaxed text-ink">{pv.text}</p>}
                      {pv && <Link href={pv.href} className="mt-2 inline-block text-[0.8125rem] font-medium text-muted underline underline-offset-4 hover:text-ink">{pv.cta}</Link>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" onClick={() => dispatch({ type: "approval-decide", id: a.id, decision: "approved" })}>Approve</Button>
                      <Button variant="ghost" onClick={() => { setRejecting(rejecting === a.id ? null : a.id); setWhy(""); }}>Reject</Button>
                    </div>
                  </div>
                  {rejecting === a.id && (
                    <div className="mt-4 flex gap-2 border-t border-line pt-4">
                      <Input aria-label="Why are you rejecting this" placeholder="Why? CREO learns from this (optional)" value={why} onChange={(e) => setWhy(e.target.value)} />
                      <Button variant="dark" onClick={() => { dispatch({ type: "approval-decide", id: a.id, decision: "rejected", reason: why.trim() || undefined }); setRejecting(null); }}>Confirm</Button>
                    </div>
                  )}
                </Panel>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!pending.length && <Empty title="Nothing is waiting" body="When you send a Studio package or a Collab reply for approval, it shows up here before anything goes out."><Button variant="ghost" size="sm" href="/app/studio">Open Studio</Button></Empty>}
      </section>

      {done.length > 0 && (
        <section aria-label="History" className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold">History</h2>
          <Panel as="section" className="px-6">
            <ul className="divide-y divide-line">
              {done.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <Chip tone={a.status === "approved" ? "ok" : "risk"}>{a.status === "approved" ? "Approved" : "Rejected"}</Chip>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.title}</span>
                  {a.reason && <span className="text-[0.8125rem] text-muted">Why: {a.reason}</span>}
                  <span className="text-xs text-faint">{a.decidedAt ? new Date(a.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}
    </>
  );
}
