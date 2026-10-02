import { ActionRow, HeroAction } from "../product/brief";
import { Accent } from "../ui/kit";
import { getDemo } from "./demo";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

/** Section 7: HQ, one command center that reads like a manager's morning note. */
export function HqSection() {
  const { brief } = getDemo();
  return (
    <Section id="hq" band>
      <SectionHead eyebrow="CREO HQ" title={<>Tomorrow's brief is already <Accent>written</Accent>.</>} sub="One command center for the day: what is worth your attention, and the one thing to do next." />
      <Reveal>
        <div className="mx-auto max-w-[60rem] space-y-4">
          <HeroAction action={brief.recommended} found={brief.found} name="Creator" date="Tomorrow, 8:00" />
          <ul className="rounded-panel border border-line bg-surface px-5">
            {brief.actions.slice(1, 4).map((a, i) => <ActionRow key={a.id} action={a} rank={i + 2} compact />)}
          </ul>
          <p className="text-center text-xs text-muted">Sample creator on the real CREO engine. Nothing here is live data.</p>
        </div>
      </Reveal>
    </Section>
  );
}
