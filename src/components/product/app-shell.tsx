"use client";

import { Brain, Fingerprint, FilmSlate, List, SealCheck, SquaresFour, Tray, TrendUp, X, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useWorkspace } from "@/lib/store/workspace";
import { Button, cn, Skeleton } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";
import { Logo } from "./logo";

type NavItem = { href: string; label: string; icon: Icon; badge?: boolean };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Manager", items: [
    { href: "/app", label: "HQ", icon: SquaresFour },
    { href: "/app/approvals", label: "Approvals", icon: SealCheck, badge: true },
    { href: "/app/trend", label: "Trend", icon: TrendUp },
    { href: "/app/studio", label: "Studio", icon: FilmSlate },
    { href: "/app/collabs", label: "Collab Inbox", icon: Tray },
  ] },
  { group: "Creator", items: [
    { href: "/app/dna", label: "Creator DNA", icon: Fingerprint },
    { href: "/app/memory", label: "Memory", icon: Brain },
  ] },
];

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

/** The labelled links, shared by the desktop sidebar and the phone menu. */
function NavLinks({ path, pendingCount }: { path: string; pendingCount: number }) {
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-1.5 px-2.5 text-xs font-medium text-faint">{g.group}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const active = isActive(path, it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex h-11 items-center gap-3 rounded-full px-3 text-sm font-medium transition lg:h-10", active ? "bg-mark-wash text-ink" : "text-muted hover:bg-sunk hover:text-ink")}
                  >
                    <Icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
                    <span>{it.label}</span>
                    {it.badge && pendingCount > 0 && (
                      <span className="tnum ml-auto grid size-5 place-items-center rounded-full bg-ink text-[0.6875rem] font-semibold text-bg">{pendingCount}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ws, pendingCount, resetSample } = useWorkspace();
  const initials = ws?.dna.name.split(" ").map((p) => p[0]).slice(0, 2).join("") ?? "";
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = NAV.flatMap((g) => g.items).filter((it) => isActive(path, it.href)).sort((a, b) => b.href.length - a.href.length)[0]?.label ?? "HQ";

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sampleCard = ws?.mode === "sample" && (
    <div className="rounded-control border border-line p-3">
      <p className="text-xs font-medium text-ink">Sample workspace</p>
      <p className="mt-0.5 text-xs text-muted">Explore with a made-up creator, or set up your own.</p>
      <Button size="sm" variant="primary" className="mt-2.5 w-full" onClick={() => router.push("/app/dna?setup=1")}>
        Use my profile
      </Button>
    </div>
  );
  const backToSample = ws?.mode === "own" && (
    <Button size="sm" variant="quiet" className="justify-start" onClick={() => { resetSample(); router.push("/app"); }}>
      Back to sample workspace
    </Button>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center px-2" aria-label="CREO home"><Logo /></Link>

        {ws ? (
          <div className="mb-6 flex items-center gap-3 rounded-control bg-sunk p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-bg">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{ws.dna.name}</p>
              <p className="truncate text-xs text-muted">{ws.dna.handle}</p>
            </div>
          </div>
        ) : (
          <Skeleton className="mb-6 h-14" />
        )}

        <div className="flex-1 overflow-y-auto scroll-thin"><NavLinks path={path} pendingCount={pendingCount} /></div>

        <div className="mt-4 flex flex-col gap-3">
          {sampleCard}
          {backToSample}
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="CREO home" className="flex h-11 items-center"><Logo /></Link>
        <span className="min-w-0 truncate text-sm font-medium text-ink">{current}</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            ref={toggle}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="app-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-full text-ink transition hover:bg-sunk"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </header>
      {open && (
        <div id="app-menu" className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-surface px-4 py-4 lg:hidden">
          {ws && (
            <div className="mb-5 flex items-center gap-3 rounded-control bg-sunk p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-bg">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{ws.dna.name}</p>
                <p className="truncate text-xs text-muted">{ws.dna.handle}</p>
              </div>
            </div>
          )}
          <NavLinks path={path} pendingCount={pendingCount} />
          <div className="mt-6 flex flex-col gap-3">{sampleCard}{backToSample}</div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
