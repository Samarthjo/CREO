import { deriveDna } from "@/lib/engine/dna";
import { Treeline } from "../scene/backdrop";
import { Accent } from "../ui/kit";
import { getDemo } from "./demo";
import { FlowSlides } from "./flow-slides";
import { Reveal } from "./reveal";

/**
 * The core story in six steps: CREO sees, understands, recommends; you create; real results come back; CREO learns.
 * Shown as a slideshow (flow-slides.tsx). Every number comes from the same engine as the app, on a made-up creator. Step 5 uses an example post.
 */
export function Rail() {
  const { ws, insights, brief } = getDemo();
  const top = brief.recommended;
  const proof = insights.hooksRanked[0]!;
  const base = ws.dna.posts.find((p) => p.hook === "proof-first");
  const lift = 2.2;
  const after = base ? deriveDna({ ...ws.dna, posts: [...ws.dna.posts, { ...base, id: "example", views: Math.round(insights.baseline * lift) }] }).hookLift["proof-first"] : undefined;

  return (
    <section id="story" className="relative isolate px-5 pb-20 pt-10 sm:px-6 lg:pb-28">
      <Treeline shift={-180} />
      <Reveal>
        <div className="mx-auto mb-10 max-w-[76rem] text-center lg:mb-12">
          <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.04] tracking-[-0.04em]">Stop rebuilding your content strategy from <Accent>zero</Accent>.</h2>
          <p className="mx-auto mt-4 max-w-[42rem] text-[1.0625rem] leading-relaxed text-muted">Every script, edit, Reel, result and decision adds to your Creator Memory, so the next recommendation starts with what already worked — and what did not.</p>
        </div>
        <FlowSlides data={{ fit: top?.fit ?? 0, subject: top?.subject ?? "", hook: proof.label, lift: proof.lift, posts: proof.posts, result: lift, after: after ? after.lift : proof.lift }} />
      </Reveal>
    </section>
  );
}
