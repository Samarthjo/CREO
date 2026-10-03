import { deriveDna } from "@/lib/engine/dna";
import { Accent, Button, Chip, FitScore } from "../ui/kit";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";

const KNOWS = ["what you sound like", "what your audience responds to", "which hooks work for you", "which formats underperform", "what trends fit your style", "what you should make next"];

/**
 * The core story in six beats: CREO sees, understands, recommends; you create; real results come back; CREO learns.
 * Every number comes from the same engine as the app, on a made-up creator. Beat 5 uses an example post and says so.
 */
export function Rail() {
  const { ws, insights, brief } = getDemo();
  const top = brief.recommended;
  const proof = insights.hooksRanked[0]!;
  const base = ws.dna.posts.find((p) => p.hook === "proof-first");
  const lift = 2.2;
  const after = base ? deriveDna({ ...ws.dna, posts: [...ws.dna.posts, { ...base, id: "example", views: Math.round(insights.baseline * lift) }] }).hookLift["proof-first"] : undefined;

  const big = "tnum font-display text-[2.6rem] font-normal leading-none tracking-[-0.04em] text-ink";
  const beats = [
    { label: "CREO sees", caption: "A pattern is emerging.", body: (<div className="flex items-center gap-3"><FitScore score={top?.fit ?? 0} size={52} /><div className="min-w-0"><Chip tone="lime">Pattern matched</Chip><p className="mt-1.5 text-[0.8125rem] leading-snug text-muted">{top?.subject}</p></div></div>) },
    { label: "CREO understands", caption: "Why it fits you.", body: (<div><p className={big}>{proof.lift.toFixed(1)}x</p><p className="mt-1.5 text-[0.8125rem] text-muted">{proof.label} hooks, {proof.posts} posts</p></div>) },
    { label: "CREO recommends", caption: "Your next best move, drafted.", body: (<div className="flex flex-wrap gap-1.5"><Chip tone="lime">Hooks</Chip><Chip tone="lime">Script</Chip><Chip tone="lime">Shots</Chip><Chip tone="lime">Caption</Chip></div>) },
    { label: "You create", caption: "You edit, approve and publish.", body: (<div className="space-y-1.5 text-[0.8125rem]"><p className="font-medium text-ink">Approved by you</p><p className="text-muted">Reel, 24 seconds. You post it.</p><p className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="size-1.5 rounded-full bg-ok" /> Live</p></div>) },
    { label: "Real results", caption: "The post performs.", body: (<div><p className={big}>{lift.toFixed(1)}x</p><p className="mt-1.5 text-[0.8125rem] text-muted">views against your usual. Example post</p></div>) },
    { label: "CREO learns", caption: "Your results shape the next draft.", body: (<div><p className={big}>{proof.lift.toFixed(1)}x <span className="text-accent">to {after ? after.lift.toFixed(1) : "?"}x</span></p><p className="mt-1.5 text-[0.8125rem] text-muted">{proof.label} hooks, after that post</p></div>) },
  ];

  return (
    <section id="story" className="px-5 pb-20 pt-10 sm:px-6 lg:pb-28">
      <Reveal>
        <div className="mx-auto mb-10 max-w-[76rem] text-center lg:mb-12">
          <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.04] tracking-[-0.04em]">CREO doesn't start from zero every <Accent>time</Accent>.</h2>
          <p className="mx-auto mt-4 max-w-[38rem] text-[1.0625rem] leading-relaxed text-muted">Every script, edit, Reel, result and decision adds to your Creator Memory.</p>
        </div>
        <ol className="mx-auto grid max-w-[76rem] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beats.map((b, i) => (
            <li key={b.label} className="flex min-h-[13rem] flex-col justify-between rounded-panel border border-line bg-surface p-5 shadow-panel">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")} · {b.label}{i === beats.length - 1 ? " ↺" : ""}</p>
                <div className="mt-5">{b.body}</div>
              </div>
              <p className="mt-6 font-display text-[1.25rem] font-normal leading-tight tracking-[-0.02em] text-ink">{b.caption}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-12 max-w-[56rem] text-center">
          <p className="text-[0.9375rem] font-medium text-ink">The longer you work with CREO, the more it understands</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {KNOWS.map((k) => <li key={k}><Chip tone="outline" className="px-3 py-1 text-[0.8125rem]">{k}</Chip></li>)}
          </ul>
          <div className="mt-8"><Button variant="ghost" size="lg" href="/product">Explore CREO Intelligence</Button></div>
        </div>
      </Reveal>
    </section>
  );
}
