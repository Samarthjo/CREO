import type { CSSProperties, ReactNode } from "react";
import { Chip, FitScore, Mark } from "@/components/ui/kit";
import "../story.css";
import { getStoryData } from "./data";
import { DnaNetwork } from "./network";
import { StoryScroll } from "./scroll";
import { StudioCard } from "./studio";

const RAIL = [
  { label: "Sees", caption: "A pattern is emerging." },
  { label: "Knows you", caption: "Why it fits you." },
  { label: "Creates", caption: "A shoot plan, drafted." },
  { label: "Monetizes", caption: "An offer, priced." },
  { label: "Learns", caption: "Your results shape the next draft." },
];

const s = (n: number) => ({ "--s": n }) as CSSProperties;

/** One beat: a glass card over the fixed stage. The card is the only place sample text lives, and it carries one "Sample data" label. */
function Beat({ i, head, bare, children }: { i: number; head?: ReactNode; bare?: boolean; children: ReactNode }) {
  const r = RAIL[i]!;
  return (
    <section id={`beat-${i}`} className="beat" data-beat={i} data-active={String(i === 0)} data-pos={i === 0 ? "now" : "next"} aria-labelledby={`rail-${i}`}>
      {/* The rail's own label and caption, shown above the card where the rail is not (stacked layout, reduced motion).
          Hidden from assistive tech: the section is already named by the rail heading it points at. */}
      <p className="beat-cap" data-copy="marketing" aria-hidden="true">
        <span className="beat-cap-n">{r.label}</span>
        <span className="beat-cap-t">{r.caption}</span>
      </p>
      <div className="beat-card" data-copy="sample">
        {!bare && (
          <header className="beat-head">
            {head ?? <span />}
            <span className="beat-tag">Sample data</span>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * The five-beat story: Sees, Knows you, Creates, Monetizes, Learns. One DOM for every viewport. From 1024px with motion
 * allowed it is a pinned scene (400 screen-heights, a sticky 100svh viewport) driven by scroll; otherwise the same markup
 * stacks. The switch is pure CSS (story.css), so server and client markup match and the height is reserved.
 */
export function Story() {
  const d = getStoryData();
  const { sees, network, studio, deal, learns } = d;

  return (
    <section id="story" className="story">
      <h2 className="sr-only" aria-label="How CREO works" />
      <div className="story-pin">
        <div className="story-inner">
          <nav className="story-rail" aria-label="The five steps">
            <ol data-copy="marketing">
              {RAIL.map((r, i) => (
                <li key={r.label} data-rail={i} data-active={String(i === 0)} data-pos={i === 0 ? "now" : "next"}>
                  <h3 id={`rail-${i}`}>
                    <a href={`#beat-${i}`} data-go={i} aria-current={i === 0 ? "step" : undefined}>
                      <span className="rail-label">{r.label}</span> <span className="rail-caption">{r.caption}</span>
                    </a>
                  </h3>
                </li>
              ))}
            </ol>
            <span className="rail-line" aria-hidden>
              <i />
            </span>
          </nav>

          <div className="story-beats">
            <Beat i={0} head={<Chip tone="lime">Pattern matched</Chip>}>
              <div className="sees">
                <p className="sees-title">
                  {sees.title.split(" X ").flatMap((part, k, all) => (k < all.length - 1 ? [part, " ", <span key={k} className="sees-x">X</span>, " "] : [part]))}
                </p>
                <div className="sees-row">
                  <div className="sees-fit">
                    <FitScore score={sees.fit} size={76} label={false} />
                  </div>
                  <div className="sees-tiles" role="img" aria-label={sees.tilesLabel}>
                    {sees.tiles.map((t, k) => (
                      <i key={t.id} className="tile rv" data-status={t.status} data-featured={t.featured ? "" : undefined} style={s(k * 0.07)} />
                    ))}
                  </div>
                </div>
              </div>
            </Beat>

            <Beat i={1} head={<span className="beat-who">{d.sample.creator}</span>}>
              <DnaNetwork net={network} length={d.bestLength} />
            </Beat>

            <Beat i={2} bare>
              <StudioCard studio={studio} />
            </Beat>

            <Beat i={3}>
              <div className="deal">
                <div className="deal-msg rv" style={s(0)}>
                  <span className="deal-lines" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  <p className="deal-quote">
                    <Mark>{deal.quote}</Mark>
                  </p>
                </div>
                <div className="deal-terms">
                  <p className="deal-range tnum rv" style={s(0.35)}>
                    <span className="deal-k">Your quote</span>
                    {deal.range}
                  </p>
                  <p className="deal-walk tnum rv" style={s(0.5)}>{deal.walkAway}</p>
                  {deal.flag && (
                    <Chip tone="risk" className="deal-flag rv">
                      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                        <path d="M8 2 15 14H1L8 2Zm0 4.5v3.5m0 1.5v.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {deal.flag}
                    </Chip>
                  )}
                </div>
                <div className="deal-axis" role="img" aria-label={deal.label}>
                  <span className="axis-zone" style={{ width: `${deal.walk}%` }} />
                  <span className="axis-band rv" style={{ ...s(0.65), left: `${deal.from}%`, width: `${deal.to - deal.from}%` }} />
                  <span className="axis-tick" style={{ left: `${deal.walk}%` }} />
                  <span className="axis-ask" style={{ left: `${deal.ask}%` }} />
                </div>
              </div>
            </Beat>

            <Beat i={4}>
              <div className="learn">
                <div className="learn-add">
                  <p className="learn-title">You add an example result</p>
                  <div className="learn-bars" role="img" aria-label="Result-first posts against your usual views, with one example post added">
                    <span className="learn-base" style={{ bottom: `${(1 / learns.max) * 100}%` }} />
                    {learns.bars.map((b, k) => (
                      <span key={k} className="learn-bar rv" style={{ ...s(0.1 + k * 0.1), height: `${(b / learns.max) * 100}%` }} />
                    ))}
                    <span className="learn-bar learn-bar-new rv" style={{ ...s(0.45), height: `${(learns.added / learns.max) * 100}%` }} />
                  </div>
                </div>
                <div className="learn-out">
                  <p className="learn-eyebrow">Result-first</p>
                  <p className="learn-lift tnum">
                    <span>{learns.before}</span>
                    <svg viewBox="0 0 24 12" width="24" height="12" aria-hidden>
                      <path d="M1 6h20m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="learn-after rv" style={s(0.6)}>{learns.after}</span>
                    <span className="learn-unit">your usual views</span>
                  </p>
                  <p className="learn-mem rv" style={s(0.8)}>{learns.memory}</p>
                  <DnaNetwork net={network} interactive={false} />
                </div>
              </div>
            </Beat>
          </div>
        </div>
      </div>
      <noscript>
        {/* Without script nothing drives the pinned scene, so show the stacked layout at every width. */}
        <style>{`.story{height:auto!important;padding-bottom:4rem!important}.story-pin{position:static!important;height:auto!important}.story-inner{display:flex!important;flex-direction:column!important;height:auto!important;max-width:46rem!important;padding:0 1.25rem!important}.story-rail{padding:1.25rem 1.25rem 1.25rem 2.5rem!important}.story-beats{gap:1.25rem!important}.beat{grid-area:auto!important;opacity:1!important;visibility:visible!important;transform:none!important;min-height:0!important}.beat-card{margin-inline:auto!important}.story-rail li{opacity:1!important}#story-end{position:static!important}`}</style>
      </noscript>
      <StoryScroll />
      <div id="story-end" aria-hidden />
    </section>
  );
}
