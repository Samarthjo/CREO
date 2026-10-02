import { cn } from "../ui/kit";

export function Logo({ className, word = true }: { className?: string; word?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" className="size-7" aria-hidden>
        <rect width="64" height="64" rx="16" fill="var(--mark)" />
        <path d="M43 22.5A15 15 0 1 0 43 41.5" fill="none" stroke="var(--on-mark)" strokeWidth="7" strokeLinecap="round" />
      </svg>
      {word && <span className="font-display text-[1.25rem] font-bold tracking-tight text-ink">CREO</span>}
    </span>
  );
}
