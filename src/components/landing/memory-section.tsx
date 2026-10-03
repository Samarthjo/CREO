import { Accent, Chip, Panel } from "../ui/kit";
import { Reveal } from "./reveal";
import { Section, SectionHead } from "./section";

const DNA = [
  { label: "Proof-first hooks", strength: 0.86, strong: true },
  { label: "Tutorial Reels", strength: 0.74, strong: true },
  { label: "20 to 28 second videos", strength: 0.7, strong: true },
  { label: "Generic listicles", strength: 0.22, strong: false },
];
const LEARNED = [
  { day: "Day 9", text: "Your first 3 seconds perform better when the result appears before context." },
  { day: "Day 17", text: "Voice-over demos earn more saves than facecam tutorials." },
  { day: "Day 26", text: "Direct CTAs bring more comments but fewer shares." },
];
const STATS = [
  { n: 42, label: "posts analyzed" },
  { n: 18, label: "CREO recommendations" },
  { n: 11, label: "published" },
  { n: 7, label: "wins" },
  { n: 3, label: "new patterns learned" },
];

/** What CREO knows on each of the 30 days: a slow start, then each result adds more than the last. Illustrative. */
const KNOWN = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  return Math.round(4 + 40 * (1 - Math.exp(-d / 13)) + (d > 8 ? 6 : 0) + (d > 16 ? 7 : 0) + (d > 25 ? 6 : 0));
});
const WINS = new Set([9, 13, 17, 21, 24, 26, 29]);

function Compounding() {
  const max = Math.max(...KNOWN);
  return (
    <figure className="mt-6">
      <div className="flex h-24 items-end gap-[3px]" aria-hidden>
        {KNOWN.map((v, i) => (
          <span key={i} className={WINS.has(i + 1) ? "flex-1 rounded-t-[3px] bg-lime-400" : "flex-1 rounded-t-[3px] bg-ink/15"} style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.6875rem] text-muted" aria-hidden><span>Day 1</span><span>Day 30</span></div>
      <figcaption className="mt-2 text-xs text-muted">What CREO knows about you, day by day. Lime days are wins it learned from.</figcaption>
    </figure>
  );
}

/** Flagship: CREO remembers what actually works for you. Illustrative numbers. */
export function MemorySection() {
  return (
    <Section id="memory" motif="contours" treeline={-90}>
      <SectionHead eyebrow="Creator Memory" title={<>CREO remembers what actually works for <Accent>you</Accent>.</>} sub="Every script, edit, Reel, result and decision is kept, so each recommendation starts from your history instead of from zero." />
      <Reveal>
        <div className="glow grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
          <Panel className="flex flex-col p-6 sm:p-7">
            <h3 className="font-display text-xl font-semibold text-ink">Your Content DNA</h3>
            <ul className="mt-5 space-y-4">
              {DNA.map((r) => (
                <li key={r.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.9375rem] text-ink">{r.label}</span>
                    <Chip tone={r.strong ? "ok" : "risk"}>{r.strong ? "Strong" : "Weak"}</Chip>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk" aria-hidden>
                    <span className={r.strong ? "block h-full rounded-full bg-lime-400" : "block h-full rounded-full bg-risk/60"} style={{ width: `${r.strength * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-6 text-xs text-muted">Recalculated after every post you publish.</p>
          </Panel>

          <Panel className="flex flex-col p-6 sm:p-7">
            <h3 className="font-display text-xl font-semibold text-ink">CREO learned this month</h3>
            <ol className="mt-5 space-y-5">
              {LEARNED.map((l) => (
                <li key={l.day} className="border-l-2 border-lime-400 pl-4">
                  <p className="text-xs font-medium text-muted">{l.day}</p>
                  <p className="mt-1 text-[0.9375rem] leading-snug text-ink">{l.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-6 text-xs text-muted">Each one comes from your own posts, not a generic rule.</p>
          </Panel>

          <Panel className="p-6 sm:p-7">
            <h3 className="font-display text-xl font-semibold text-ink">Your 30-Day Intelligence</h3>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="tnum font-display text-[2rem] font-normal leading-none tracking-[-0.03em] text-ink">{s.n}</dd>
                  <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
            <Compounding />
          </Panel>
        </div>
      </Reveal>
    </Section>
  );
}
