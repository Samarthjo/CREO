import Link from "next/link";
import { KEEP_PRICE } from "@/lib/trial";

/** A slim note at the top of every workspace page while a free trial is running. */
export function TrialNotice({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-control border border-line bg-sunk px-4 py-2.5 text-[0.8125rem] text-body" role="status">
      <span><span className="font-medium text-ink">Free trial:</span> {daysLeft} {daysLeft === 1 ? "day" : "days"} left. Then {KEEP_PRICE}.</span>
      <Link href="/trial/ended" className="font-medium text-ink underline underline-offset-4 hover:no-underline" data-track="keep_creo" data-track-where="trial_notice">Keep CREO</Link>
    </div>
  );
}
