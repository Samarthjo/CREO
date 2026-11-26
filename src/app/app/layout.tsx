import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AccessLock } from "@/components/product/access-lock";
import { AppShell } from "@/components/product/app-shell";
import { TrialNotice } from "@/components/product/trial-notice";
import { TRIAL_COOKIE, trialState } from "@/lib/trial";
import { WorkspaceProvider } from "@/lib/store/workspace";

export const metadata: Metadata = { title: "Workspace", robots: { index: false } };

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  // A visitor on a running free trial has already been let in by the proxy, so they are not asked for the access code on top.
  const trial = trialState((await cookies()).get(TRIAL_COOKIE)?.value);
  const workspace = (
    <WorkspaceProvider>
      <AppShell>
        {trial.state === "active" && <TrialNotice daysLeft={trial.daysLeft} />}
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
  return trial.state === "active" ? workspace : <AccessLock>{workspace}</AccessLock>;
}
