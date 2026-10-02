import { cn } from "../ui/kit";

/** Placeholder mark until Phase 2. `inverse` is for lime backgrounds. */
export function Logo({ className, word = true, inverse = false }: { className?: string; word?: boolean; inverse?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" className="size-7" aria-hidden>
        <rect width="64" height="64" rx="16" fill={inverse ? "#11140c" : "var(--mark)"} />
        <path d="M43 22.5A15 15 0 1 0 43 41.5" fill="none" stroke={inverse ? "#b5cf4f" : "var(--on-mark)"} strokeWidth="7" strokeLinecap="round" />
      </svg>
      {word && <span className={cn("font-display text-[1.25rem] font-semibold tracking-tight", inverse ? "text-[#11140c]" : "text-ink")}>CREO</span>}
    </span>
  );
}
