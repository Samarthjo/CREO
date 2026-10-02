"use client";

import { Brain, Fingerprint, FilmSlate, SealCheck, SquaresFour, Tray, TrendUp } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useWorkspace } from "@/lib/store/workspace";
import { Button, cn, Skeleton } from "../ui/kit";
import { ThemeToggle } from "../ui/interactive";
import { Logo } from "./logo";

const NAV = [
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
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ws, pendingCount, resetSample } = useWorkspace();
  const initials = ws?.dna.name.split(" ").map((p) => p[0]).slice(0, 2).join("") ?? "";

  return (
    <div className="grid min-h-dvh grid-cols-[4.25rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-line bg-surface px-2.5 py-5 lg:px-4">
        <Link href="/" className="mb-6 flex items-center px-1.5 lg:px-2" aria-label="CREO home">
          <Logo word={false} className="lg:hidden" />
          <Logo className="hidden lg:inline-flex" />
        </Link>

        {ws ? (
          <div className="mb-6 flex items-center gap-3 rounded-control px-1.5 lg:bg-sunk lg:p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-bg">{initials}</span>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium text-ink">{ws.dna.name}</p>
              <p className="truncate text-xs text-muted">{ws.dna.handle}</p>
            </div>
          </div>
        ) : (
          <Skeleton className="mb-6 h-14" />
        )}

        <nav aria-label="Workspace" className="flex flex-1 flex-col gap-5 overflow-y-auto scroll-thin">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 hidden px-2.5 text-xs font-medium text-faint lg:block">{g.group}</p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map((it) => {
                  const active = it.href === "/app" ? path === "/app" : path.startsWith(it.href);
                  const Icon = it.icon;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        title={it.label}
                        aria-current={active ? "page" : undefined}
                        className={cn("relative flex h-10 items-center gap-3 rounded-full px-3 text-sm font-medium transition", active ? "bg-mark-wash text-ink" : "text-muted hover:bg-sunk hover:text-ink")}
                      >
                        <Icon size={19} weight={active ? "fill" : "regular"} className="shrink-0" />
                        <span className="hidden lg:inline">{it.label}</span>
                        {"badge" in it && it.badge && pendingCount > 0 && (
                          <span className="tnum absolute right-2 top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[0.6875rem] font-semibold text-bg lg:static lg:ml-auto">{pendingCount}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 flex flex-col gap-3">
          {ws?.mode === "sample" && (
            <div className="hidden rounded-control border border-line p-3 lg:block">
              <p className="text-xs font-medium text-ink">Sample workspace</p>
              <p className="mt-0.5 text-xs text-muted">Explore with a made-up creator, or set up your own.</p>
              <Button size="sm" variant="primary" className="mt-2.5 w-full" onClick={() => router.push("/app/dna?setup=1")}>
                Use my profile
              </Button>
            </div>
          )}
          {ws?.mode === "own" && (
            <Button size="sm" variant="quiet" className="hidden justify-start lg:inline-flex" onClick={() => { resetSample(); router.push("/app"); }}>
              Back to sample workspace
            </Button>
          )}
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
