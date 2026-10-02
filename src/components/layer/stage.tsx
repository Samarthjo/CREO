import type { CSSProperties } from "react";
import { ANCHORS, STAGE_ASPECT } from "./anchors";
import type { AnchorId } from "./bus";
import { getLayerSample } from "./sample";
import { StageCanvas } from "./stage-canvas";

const POSTERS = {
  wide: { src: "/layer/poster-wide.webp", width: 1600, height: 1000, media: "(min-width: 900px) and (orientation: landscape)" },
  tall: { src: "/layer/poster-tall.webp", width: 900, height: 1200, media: "(max-width: 899.98px), (orientation: portrait)" },
} as const;

const CHIPS: { id: Exclude<AnchorId, "mark">; label: string }[] = [
  { id: "content", label: "CONTENT" },
  { id: "audience", label: "AUDIENCE" },
  { id: "trends", label: "TRENDS" },
  { id: "deals", label: "DEALS" },
  { id: "perf", label: "PERFORMANCE" },
];

const chipVars = (id: Exclude<AnchorId, "mark">, i: number) =>
  ({
    "--ax-w": ANCHORS.wide[id].x,
    "--ay-w": ANCHORS.wide[id].y,
    "--ax-t": ANCHORS.tall[id].x,
    "--ay-t": ANCHORS.tall[id].y,
    "--i": i,
  }) as CSSProperties;

/**
 * The fixed stage behind the page. The poster, the canvas and the chips share one aspect box, so a chip placed at a
 * percentage lines up with the same point in the poster and in the live scene. Both variants of the poster and the
 * chip positions are in the server HTML and are chosen by a media query, so the first paint is right before any script.
 */
export function Stage() {
  return (
    <div className="layer-stage" style={{ "--a-w": STAGE_ASPECT.wide, "--a-t": STAGE_ASPECT.tall } as CSSProperties}>
      <link rel="preload" as="image" href={POSTERS.wide.src} media={POSTERS.wide.media} fetchPriority="high" />
      <link rel="preload" as="image" href={POSTERS.tall.src} media={POSTERS.tall.media} fetchPriority="high" />
      <div className="layer-box" data-layer-stage>
        <picture className="layer-poster">
          <source media={POSTERS.wide.media} srcSet={POSTERS.wide.src} width={POSTERS.wide.width} height={POSTERS.wide.height} />
          <img src={POSTERS.tall.src} width={POSTERS.tall.width} height={POSTERS.tall.height} alt="" fetchPriority="high" decoding="async" />
        </picture>
        <StageCanvas sample={getLayerSample()} />
        <ul className="layer-chips layer-fade" data-hp data-copy="marketing">
          {CHIPS.map((c, i) => (
            <li key={c.id} className="layer-chip" data-anchor={c.id} style={chipVars(c.id, i)}>
              <span className="layer-chip-tag">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="layer-scrim" />
      <div className="layer-scrim-story" data-hp />
      <div className="layer-grain" />
      <div className="layer-sweep" />
      <p className="layer-sample layer-fade" data-hp data-copy="marketing">Sample data</p>
    </div>
  );
}
