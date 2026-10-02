"use client";

import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";
import { Chip } from "@/components/ui/kit";
import type { Network } from "./data";

const MARK_PATH = "M43 22.5A15 15 0 1 0 43 41.5";

/**
 * The Creator DNA network, drawn from the sample creator's posts: hook types and formats as nodes, and a link wherever a post
 * used both. Links are SVG; nodes are real buttons laid over it, so each one takes focus. Hover or focus a node to read its
 * evidence. Reveal and brightness come from --bu (written by the scroll controller), so scrolling alone draws it.
 */
export function DnaNetwork({ net, length, interactive = true }: { net: Network; length?: string; interactive?: boolean }) {
  const best = net.nodes.find((n) => n.best) ?? net.nodes[0]!;
  const [active, setActive] = useState(best.id);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const focusable = net.nodes.filter((n) => n.kind !== "creator");
  const shown = net.nodes.find((n) => n.id === active) ?? best;

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = focusable.findIndex((n) => n.id === active);
    const next = focusable[(i + dir + focusable.length) % focusable.length]!;
    setActive(next.id);
    refs.current.get(next.id)?.focus();
  };

  const style = (n: { s: number }) => ({ "--s": n.s }) as CSSProperties;

  return (
    <div className="net-wrap" data-interactive={interactive ? "" : undefined}>
      <div className="net" role={interactive ? "group" : "img"} aria-label={net.label} aria-hidden={interactive ? undefined : true} onKeyDown={interactive ? onKey : undefined} onMouseLeave={interactive ? () => setActive(best.id) : undefined}>
        <svg className="net-links" viewBox="0 0 100 60" aria-hidden>
          {net.links.map((l) => (
            <line key={l.id} className="rv" data-hub={l.hub ? "" : undefined} data-hot={l.a === active || l.b === active ? "" : undefined} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={style(l)} />
          ))}
        </svg>
        {net.nodes.map((n) => {
          const common = {
            className: "net-node rv",
            "data-kind": n.kind,
            "data-best": n.best ? "" : undefined,
            "data-thin": n.thin ? "" : undefined,
            "data-on": interactive && n.id === active ? "" : undefined,
            style: { "--s": n.s, "--d": n.d, left: `${n.x}%`, top: `${(n.y / 60) * 100}%` } as CSSProperties,
          };
          if (n.kind === "creator") {
            return (
              <span key={n.id} {...common} aria-hidden>
                <svg viewBox="0 0 64 64">
                  <path d={MARK_PATH} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </span>
            );
          }
          if (!interactive) return <span key={n.id} {...common} aria-hidden />;
          return (
            <button
              key={n.id}
              type="button"
              {...common}
              ref={(el) => {
                if (el) refs.current.set(n.id, el);
                else refs.current.delete(n.id);
              }}
              tabIndex={n.id === active ? 0 : -1}
              aria-label={`${n.text}, ${n.basis}`}
              onMouseEnter={() => setActive(n.id)}
              onFocus={() => setActive(n.id)}
            />
          );
        })}
        {interactive && (
          // The label sits beside its node. It is the one live region, so a change in focus is announced once.
          <span className="net-tag" aria-live="polite" data-flip={shown.y < 24 ? "" : undefined} data-edge={shown.x < 24 ? "l" : shown.x > 76 ? "r" : undefined} style={{ left: `${shown.x}%`, top: `${(shown.y / 60) * 100}%` }}>
            <span key={shown.id} className="swap-in">{shown.text}</span>
          </span>
        )}
      </div>
      {interactive && (
        <div className="net-read">
          <span key={shown.id} className="net-read-row swap-in">
            <Chip tone="outline">{shown.basis}</Chip>
          </span>
          {length && <Chip tone="outline">{length}</Chip>}
        </div>
      )}
    </div>
  );
}
