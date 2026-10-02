"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HOOK_TYPES } from "@/lib/engine/types";
import { useWorkspace } from "@/lib/store/workspace";
import { ActionRow, HeroAction } from "@/components/product/brief";
import { MemoryRow } from "@/components/product/memory";
import { Button, Chip, Empty, PageHeader, Panel, Skeleton } from "@/components/ui/kit";

export default function HqPage() {
  const { ws, brief, insights } = useWorkspace();
  const router = useRouter();
  if (!ws || !brief || !insights) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-72" /><Skeleton className="h-64" /></div>;

  const now = new Date();
  const hello = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const date = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const first = ws.dna.name.split(" ")[0]!;
  const pending = ws.approvals.filter((a) => a.status === "pending");
  const rest = brief.actions.filter((a) => a.id !== brief.recommended?.id);

  return (
    <>
      <PageHeader title={`${hello}, ${first}`} sub="One manager across growth, content and revenue. Everything below comes from your own numbers." />
      <HeroAction action={brief.recommended} found={brief.found} name={first} date={date} />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Panel as="section" className="p-6">
          <h2 className="font-display text-lg font-semibold">Next best actions</h2>
          {rest.length ? (
            <ul className="mt-1">{rest.map((a, i) => <ActionRow key={a.id} action={a} rank={i + 2} onGo={() => router.push(a.href)} />)}</ul>
          ) : (
            <div className="mt-4"><Empty title="You are caught up" body="Add a saved Reel in Trend or paste a brand message in Collab Inbox to give CREO more to work on."><Button size="sm" variant="ghost" href="/app/trend">Open Trend</Button></Empty></div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel as="section" className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Approvals</h2>
              <Link href="/app/approvals" className="text-[0.8125rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline">View all</Link>
            </div>
            {pending.length ? (
              <ul className="mt-3 divide-y divide-line">
                {pending.slice(0, 3).map((a) => (
                  <li key={a.id} className="py-3">
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{a.detail}</p>
                    <Chip tone="outline" className="mt-2">{a.risk}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Nothing is waiting. CREO asks before anything public or commercial goes out.</p>
            )}
          </Panel>

          <Panel as="section" className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Creator DNA</h2>
              <Link href="/app/dna" className="text-[0.8125rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Open</Link>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-body">
              {insights.lines.slice(0, 3).map((l) => <li key={l}>{l}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted">Best opener: {insights.hooksRanked[0] ? HOOK_TYPES[insights.hooksRanked[0].key as keyof typeof HOOK_TYPES] : "not enough posts yet"}</p>
          </Panel>

          <Panel as="section" className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Memory</h2>
              <Link href="/app/memory" className="text-[0.8125rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Open</Link>
            </div>
            {ws.memory.length ? <ul className="mt-2">{ws.memory.slice(0, 3).map((m) => <MemoryRow key={m.id} item={m} compact />)}</ul> : <p className="mt-3 text-sm text-muted">Approvals, edits and results will appear here and shape the next draft.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
