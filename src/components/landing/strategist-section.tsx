import { Brain, ChatsCircle, PencilSimpleLine } from "@phosphor-icons/react/dist/ssr";
import { Accent, Panel } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const FLOW = [
  { icon: Brain, title: "CREO drafts", body: "Analysis, recommendations and scripts, built on your Creator Intelligence." },
  { icon: ChatsCircle, title: "A strategist reviews", body: "When judgment matters, a CREO strategist goes through it with you." },
  { icon: PencilSimpleLine, title: "The correction is kept", body: "What changed, and why, is saved to your Creator Memory." },
];

/** The human layer: CREO Intelligence does most of the work, CREO Strategist Support covers judgment calls. */
export function StrategistSection() {
  return (
    <Section id="strategist" band treeline={-640}>
      <SectionHead eyebrow="CREO Strategist Support" title={<>Intelligence first. <br className="hidden sm:block" />A strategist when it <Accent>matters</Accent>.</>} sub="CREO does most of the analysis and drafting. When judgment matters, a CREO strategist can review the recommendation, script or decision with you." />
      <Reveal>
        <Panel className="p-6 sm:p-8">
          <div className="flex h-3 gap-1" aria-hidden>
            <span className="w-[75%] rounded-full bg-lime-400" />
            <span className="w-[25%] rounded-full bg-ink/70" />
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-[0.8125rem]">
            <span className="text-ink"><span className="font-medium">CREO Intelligence</span> <span className="text-muted">about 70 to 80%</span></span>
            <span className="text-ink"><span className="font-medium">CREO strategists</span> <span className="text-muted">about 20 to 30%</span></span>
          </div>
          <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-3">
            {FLOW.map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mark-wash text-ink"><Icon size={20} /></span>
                  <div>
                    <p className="text-xs font-medium text-muted">Step {i + 1}</p>
                    <p className="mt-0.5 text-[1.0625rem] font-medium text-ink">{f.title}</p>
                    <p className="mt-1 text-[0.9375rem] leading-snug text-muted">{f.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </Reveal>
    </Section>
  );
}
