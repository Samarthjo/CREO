import { cn } from "../ui/kit";

/**
 * The CREO mark: the glowing C tile, cut to a rounded square so it sits on light, lime and dark grounds.
 * The word is live text next to it. `inverse` is for lime backgrounds.
 */
export function Logo({ className, word = true, inverse = false }: { className?: string; word?: boolean; inverse?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src="/brand/creo-mark.webp" alt="" width={32} height={32} decoding="async" className="size-8 shrink-0" />
      {word && <span className={cn("font-display text-[1.25rem] font-semibold tracking-tight", inverse ? "text-[#11140c]" : "text-ink")}>CREO</span>}
    </span>
  );
}
