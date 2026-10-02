import { deriveDna } from "@/lib/engine/dna";
import { inr, round500 } from "@/lib/engine/format";
import { Chip, FitScore } from "../ui/kit";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";

/**
 * The whole product in five captions. Every number comes from the same engine as the app, on the sample creator.
 * Beat 5 uses a hypothetical extra post and says so.
 */
export function Rail() {
  const { ws, insights, brief } = getDemo();
  const top = brief.recommended;
  const proof = insights.hooksRanked[0]!;
  const q = ws.inquiries[0]!.evaluation.quote;

  const base = ws.dna.posts.find((p) => p.hook === "proof-first");
  const after = base ? deriveDna({ ...ws.dna, posts: [...ws.dna.posts, { ...base, id: "example", views: Math.round(insights.baseline * 2.2) }] }).hookLift["proof-first"] : undefined;

  const beats = [
    { label: "Sees", caption: "A pattern is emerging.", body: (<div className="flex items-center gap-3"><FitScore score={top?.fit ?? 0} size={52} /><div className="min-w-0"><Chip tone="lime">Pattern matched</Chip><p className="mt-1.5 text-[0.8125rem] leading-snug text-muted">{top?.subject}</p></div></div>) },
    { label: "Knows you", caption: "Why it fits you.", body: (<div><p className="tnum font-display text-[2.75rem] font-normal leading-none tracking-[-0.04em] text-ink">{proof.lift.toFixed(1)}x</p><p className="mt-1.5 text-[0.8125rem] text-muted">{proof.label} hooks, {proof.posts} posts</p></div>) },
    { label: "Creates", caption: "A shoot plan, drafted.", body: (<div className="flex flex-wrap gap-1.5"><Chip tone="lime">Hooks</Chip><Chip tone="lime">Script</Chip><Chip tone="lime">Shots</Chip><Chip tone="lime">Caption</Chip></div>) },
    { label: "Monetizes", caption: "An offer, priced.", body: (<div><p className="tnum font-display text-[1.5rem] font-normal leading-tight tracking-[-0.03em] text-ink">{inr(q.lowInr)} to {inr(q.highInr)}</p><p className="mt-1.5 text-[0.8125rem] text-muted">Walk away below {inr(round500(q.walkAwayInr))}</p></div>) },
    { label: "Learns", caption: "Your results shape the next draft.", body: (<div><p className="tnum font-display text-[2.75rem] font-normal leading-none tracking-[-0.04em] text-ink">{proof.lift.toFixed(1)}x <span className="text-accent">to {after ? after.lift.toFixed(1) : "?"}x</span></p><p className="mt-1.5 text-[0.8125rem] text-muted">Example: you add a result</p></div>) },
  ];

  return (
    <section id="story" className="px-5 pb-20 pt-10 sm:px-6 lg:pb-28">
      <Reveal>
        <ol className="mx-auto grid max-w-[76rem] gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {beats.map((b, i) => (
            <li key={b.label} className="flex min-h-[15rem] flex-col justify-between rounded-panel border border-line bg-surface p-5 shadow-panel">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")} · {b.label}</p>
                <div className="mt-5">{b.body}</div>
              </div>
              <p className="mt-6 font-display text-[1.25rem] font-normal leading-tight tracking-[-0.02em] text-ink">{b.caption}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-muted">Sample data</p>
      </Reveal>
    </section>
  );
}
