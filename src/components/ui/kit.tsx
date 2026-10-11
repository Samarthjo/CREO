import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const cn = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(" ");

const BTN = {
  primary: "bg-cta text-on-cta hover:brightness-110",
  dark: "bg-ink text-bg hover:opacity-90",
  ghost: "border border-line-strong text-ink hover:bg-sunk",
  quiet: "text-muted hover:text-ink hover:bg-sunk",
} as const;
const SIZE = { sm: "h-8 px-3.5 text-[0.8125rem] pointer-coarse:h-11", md: "h-9 px-4 text-sm pointer-coarse:h-11", lg: "h-11 px-6 text-[0.9375rem]" } as const;

type BtnProps = { variant?: keyof typeof BTN; size?: keyof typeof SIZE; href?: string } & ButtonHTMLAttributes<HTMLButtonElement> & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">;

export function Button({ variant = "dark", size = "md", href, className, children, type = "button", ...rest }: BtnProps) {
  const cls = cn("inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-45", BTN[variant], SIZE[size], className);
  if (href) {
    const ext = /^https?:/.test(href);
    // data-* attributes (data-track, for analytics) ride along to the link.
    const data = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith("data-")));
    return (
      <Link href={href} className={cls} {...data} {...(ext ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

const CHIP = {
  neutral: "bg-sunk text-muted",
  mark: "bg-mark text-on-mark",
  lime: "bg-eyebrow text-on-eyebrow",
  risk: "bg-risk-wash text-risk",
  ok: "bg-ok-wash text-ok",
  outline: "border border-line text-muted",
} as const;
export function Chip({ tone = "neutral", className, children }: { tone?: keyof typeof CHIP; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", CHIP[tone], className)}>{children}</span>;
}

/** Small pill label above a headline. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full bg-eyebrow px-3 py-1 text-[0.8125rem] font-medium text-on-eyebrow", className)}>{children}</span>;
}

/** The one italic word in a headline. */
export const Accent = ({ children }: { children: ReactNode }) => <em className="accent">{children}</em>;

export function Panel({ className, children, as: As = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <As className={cn("rounded-panel border border-line bg-surface shadow-panel", className)}>{children}</As>;
}

/** The marker. Highlights what CREO read, or what only the creator can fill in. */
export function Mark({ children, risk, sweep, delay = 0 }: { children: ReactNode; risk?: boolean; sweep?: boolean; delay?: number }) {
  return (
    <mark className="mark" data-risk={risk ? "" : undefined} data-sweep={sweep ? "" : undefined} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </mark>
  );
}

/** Renders text and wraps [bracketed slots] in the marker, so gaps the creator must fill are impossible to miss. */
export function Slots({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return <>{parts.map((p, i) => (/^\[[^\]]+\]$/.test(p) ? <Mark key={i}>{p}</Mark> : <span key={i}>{p}</span>))}</>;
}

export function FitScore({ score, size = 52, label = true, inverse = false }: { score: number; size?: number; label?: boolean; inverse?: boolean }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5" role="img" aria-label={`Creator fit ${score} percent`}>
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={inverse ? "var(--bg)" : "var(--line-strong)"} strokeOpacity={inverse ? 0.22 : 1} strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={inverse ? "var(--mark)" : "var(--ink)"} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
        </svg>
        <span className={cn("tnum absolute font-display font-semibold", inverse ? "text-bg" : "text-ink")} style={{ fontSize: size * 0.34 }}>{score}</span>
      </div>
      {label && <span className={cn("text-[0.6875rem] font-medium", inverse ? "text-bg/70" : "text-muted")}>fit</span>}
    </div>
  );
}

export const fieldClass = "w-full rounded-control border border-line-strong bg-raised px-3 py-2 text-sm text-ink placeholder:text-faint transition focus:border-ink focus:outline-none pointer-coarse:text-base";
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(fieldClass, "h-10 pointer-coarse:h-11", p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(fieldClass, "leading-relaxed", p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(fieldClass, "h-10 pr-8 pointer-coarse:h-11", p.className)} />;
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[0.8125rem] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.875rem] font-semibold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

export function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="rounded-panel border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-sm text-muted">{body}</p>
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-control bg-sunk", className)} />;
