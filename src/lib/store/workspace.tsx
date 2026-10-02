"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { buildBrief, type Brief } from "../engine/brief.ts";
import { deriveDna, type DnaInsights } from "../engine/dna.ts";
import { isoNow, uid } from "../engine/format.ts";
import { rankPatterns } from "../engine/trend.ts";
import type { Approval, CreatorDNA, Draft, Inquiry, MemoryItem, PastDeal, PastPost, StudioPackage, TrendPattern, Workspace } from "../engine/types.ts";
import { blankWorkspace, makeInquiry, sampleDna, sampleWorkspace } from "./seed.ts";

const KEY = "creo.workspace.v1";

type Action =
  | { type: "load"; ws: Workspace }
  | { type: "dna"; patch: Partial<CreatorDNA> }
  | { type: "post-add"; post: PastPost }
  | { type: "post-remove"; id: string }
  | { type: "deal-add"; deal: PastDeal }
  | { type: "deal-remove"; id: string }
  | { type: "pattern-add"; pattern: TrendPattern }
  | { type: "pattern-remove"; id: string }
  | { type: "pkg-add"; pkg: StudioPackage }
  | { type: "pkg-patch"; id: string; patch: Partial<StudioPackage> }
  | { type: "pkg-edit"; id: string; field: string; ai: string; human: string; reason: string; apply: Partial<StudioPackage> }
  | { type: "pkg-remove"; id: string }
  | { type: "inq-add"; inquiry: Inquiry }
  | { type: "inq-patch"; id: string; patch: Partial<Inquiry> }
  | { type: "inq-remove"; id: string }
  | { type: "approval-request"; approval: Approval }
  | { type: "approval-decide"; id: string; decision: "approved" | "rejected"; reason?: string }
  | { type: "memory-add"; item: MemoryItem }
  | { type: "memory-remove"; id: string };

const mem = (kind: MemoryItem["kind"], text: string, source: MemoryItem["source"], detail?: MemoryItem["detail"]): MemoryItem => ({ id: uid(), kind, text, source, at: isoNow(), detail });

function reducer(ws: Workspace, a: Action): Workspace {
  switch (a.type) {
    case "load": return a.ws;
    case "dna": return { ...ws, dna: { ...ws.dna, ...a.patch } };
    case "post-add": return { ...ws, dna: { ...ws.dna, posts: [a.post, ...ws.dna.posts] } };
    case "post-remove": return { ...ws, dna: { ...ws.dna, posts: ws.dna.posts.filter((p) => p.id !== a.id) } };
    case "deal-add": return { ...ws, dna: { ...ws.dna, deals: [a.deal, ...ws.dna.deals] } };
    case "deal-remove": return { ...ws, dna: { ...ws.dna, deals: ws.dna.deals.filter((d) => d.id !== a.id) } };
    case "pattern-add": return { ...ws, patterns: [a.pattern, ...ws.patterns] };
    case "pattern-remove": return { ...ws, patterns: ws.patterns.filter((p) => p.id !== a.id) };
    case "pkg-add": return { ...ws, packages: [a.pkg, ...ws.packages] };
    case "pkg-patch": return { ...ws, packages: ws.packages.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };
    case "pkg-edit": {
      const correction = { id: uid(), field: a.field, ai: a.ai, human: a.human, reason: a.reason, at: isoNow() };
      return {
        ...ws,
        packages: ws.packages.map((p) => (p.id === a.id ? { ...p, ...a.apply, corrections: [correction, ...p.corrections] } : p)),
        memory: [mem("correction", `Edited ${a.field}.`, "studio", { ai: a.ai, human: a.human, reason: a.reason || "No reason given.", accepted: true }), ...ws.memory],
      };
    }
    case "pkg-remove": return { ...ws, packages: ws.packages.filter((p) => p.id !== a.id), approvals: ws.approvals.filter((x) => x.refId !== a.id) };
    case "inq-add": return { ...ws, inquiries: [a.inquiry, ...ws.inquiries] };
    case "inq-patch": return { ...ws, inquiries: ws.inquiries.map((q) => (q.id === a.id ? { ...q, ...a.patch } : q)) };
    case "inq-remove": return { ...ws, inquiries: ws.inquiries.filter((q) => q.id !== a.id), approvals: ws.approvals.filter((x) => x.refId !== a.id) };
    case "approval-request": {
      const rest = ws.approvals.filter((x) => !(x.refId === a.approval.refId && x.status === "pending"));
      return {
        ...ws,
        approvals: [a.approval, ...rest],
        packages: ws.packages.map((p) => (p.id === a.approval.refId ? { ...p, status: "pending" } : p)),
        inquiries: ws.inquiries.map((q) => (q.id === a.approval.refId ? { ...q, status: "pending" } : q)),
      };
    }
    case "approval-decide": {
      const ap = ws.approvals.find((x) => x.id === a.id);
      if (!ap) return ws;
      const ok = a.decision === "approved";
      const pkg = ws.packages.find((p) => p.id === ap.refId);
      const inq = ws.inquiries.find((q) => q.id === ap.refId);
      let note: MemoryItem | null = null;
      if (pkg) {
        const hook = pkg.hooks.find((h) => h.id === pkg.chosenHook);
        note = mem("decision", ok ? `Approved the "${hook?.style ?? "chosen"}" hook for "${pkg.topic}".` : `Rejected the package for "${pkg.topic}".`, "studio", { accepted: ok, reason: a.reason });
      } else if (inq) {
        note = mem("decision", ok ? `Approved a ${inq.draft?.kind ?? "reply"} to ${inq.extraction.brand ?? "a brand"}.` : `Rejected the draft to ${inq.extraction.brand ?? "a brand"}.`, "collab", { accepted: ok, reason: a.reason });
      }
      const edited = ok && inq?.draft && inq.draft.aiBody !== inq.draft.body ? mem("correction", `Reworded the ${inq.draft.kind} to ${inq.extraction.brand ?? "a brand"} before approving.`, "collab", { ai: inq.draft.aiBody.slice(0, 220), human: inq.draft.body.slice(0, 220), reason: a.reason || "No reason given.", accepted: true }) : null;
      return {
        ...ws,
        approvals: ws.approvals.map((x) => (x.id === a.id ? { ...x, status: a.decision, decidedAt: isoNow(), reason: a.reason } : x)),
        packages: ws.packages.map((p) => (p.id === ap.refId ? { ...p, status: ok ? "approved" : "rejected" } : p)),
        inquiries: ws.inquiries.map((q) => (q.id === ap.refId ? { ...q, status: ok ? "approved" : "drafted" } : q)),
        memory: [...(edited ? [edited] : []), ...(note ? [note] : []), ...ws.memory],
      };
    }
    case "memory-add": return { ...ws, memory: [a.item, ...ws.memory] };
    case "memory-remove": return { ...ws, memory: ws.memory.filter((m) => m.id !== a.id) };
  }
}

export interface Ctx {
  ws: Workspace | null;
  insights: DnaInsights | null;
  brief: Brief | null;
  ranked: ReturnType<typeof rankPatterns>;
  pendingCount: number;
  dispatch: (a: Action) => void;
  resetSample: () => void;
  startOwn: (dna: CreatorDNA) => void;
  addInquiry: (raw: string, source?: Inquiry["source"]) => Inquiry;
  requestApproval: (a: Omit<Approval, "id" | "requestedAt" | "status">) => void;
}

const C = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, dispatchRaw] = useReducer(reducer, null as unknown as Workspace);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let loaded: Workspace | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Workspace;
        if (p?.version === 1 && p.dna && Array.isArray(p.patterns) && Array.isArray(p.packages) && Array.isArray(p.inquiries) && Array.isArray(p.memory) && Array.isArray(p.approvals)) loaded = p;
        // A sample workspace saved before the sample creator was renamed is replaced by the current sample.
        if (loaded?.mode === "sample" && loaded.dna.id !== sampleDna().id) loaded = null;
      }
    } catch {
      loaded = null;
    }
    dispatchRaw({ type: "load", ws: loaded ?? sampleWorkspace() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !ws) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(ws));
    } catch {
      /* storage full or blocked: the session still works, it just will not persist */
    }
  }, [ws, ready]);

  const insights = useMemo(() => (ws ? deriveDna(ws.dna) : null), [ws]);
  const brief = useMemo(() => (ws && insights ? buildBrief(ws, insights) : null), [ws, insights]);
  const ranked = useMemo(() => (ws && insights ? rankPatterns(ws.patterns, ws.dna, insights, ws.memory) : []), [ws, insights]);
  const dispatch = useCallback((a: Action) => dispatchRaw(a), []);
  const resetSample = useCallback(() => dispatchRaw({ type: "load", ws: sampleWorkspace() }), []);
  const startOwn = useCallback((dna: CreatorDNA) => dispatchRaw({ type: "load", ws: blankWorkspace(dna) }), []);
  const addInquiry = useCallback(
    (raw: string, source: Inquiry["source"] = "paste") => {
      const q = makeInquiry(raw, ws!.dna, source, uid());
      dispatchRaw({ type: "inq-add", inquiry: q });
      return q;
    },
    [ws],
  );
  const requestApproval = useCallback((a: Omit<Approval, "id" | "requestedAt" | "status">) => dispatchRaw({ type: "approval-request", approval: { ...a, id: uid(), requestedAt: isoNow(), status: "pending" } }), []);

  const value = useMemo<Ctx>(
    () => ({ ws: ready ? ws : null, insights, brief, ranked, pendingCount: ws?.approvals.filter((a) => a.status === "pending").length ?? 0, dispatch, resetSample, startOwn, addInquiry, requestApproval }),
    [ws, ready, insights, brief, ranked, dispatch, resetSample, startOwn, addInquiry, requestApproval],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useWorkspace(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return c;
}

export type { Draft };
