// Every change the workspace can make to itself. The reducer applies them; analytics describes them (without their text).
import type { Approval, CreatorDNA, Inquiry, MemoryItem, PastDeal, PastPost, StudioPackage, TrendPattern, Workspace } from "../engine/types.ts";

export type Action =
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
