import type { ReactNode } from "react";
import { cn } from "./kit";

/** A strip of notched lime tickets. Each ticket is one fact: a label and one big value. */
export function TicketStrip({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("grid grid-cols-2 gap-y-3 md:grid-cols-4", className)}>{children}</ul>;
}

export function Ticket({ label, children, note, className }: { label: string; children: ReactNode; note?: string; className?: string }) {
  return (
    <li className={cn("ticket flex min-h-[9.5rem] flex-col justify-between rounded-ticket bg-lime-400 px-8 pb-6 pt-6 text-[#11140c]", className)}>
      <p className="text-[0.8125rem] font-medium">{label}</p>
      <div>
        <p className="tnum font-display text-[clamp(2.25rem,3.4vw,3.25rem)] font-medium leading-none tracking-[-0.03em]">{children}</p>
        {note && <p className="mt-2 text-xs font-medium text-[#11140c]/70">{note}</p>}
      </div>
    </li>
  );
}
