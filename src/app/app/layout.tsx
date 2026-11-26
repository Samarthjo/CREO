import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AccessLock } from "@/components/product/access-lock";
import { AppShell } from "@/components/product/app-shell";
import { TrialClock } from "@/components/product/trial-clock";
import { TrialNotice } from "@/components/product/trial-notice";
import { ACCESS_COOKIE, tokenIsRight } from "@/lib/access";
import { TRIAL_COOKIE, trialState } from "@/lib/trial";
import { WorkspaceProvider } from "@/lib/store/workspace";

export const metadata: Metadata = { title: "Workspace", robots: { index: false } };

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const trial = trialState(jar.get(TRIAL_COOKIE)?.value);
  // Someone with the access code (a Founding Cohort member) keeps the workspace exactly as before: the code prompt, no trial notice, no trial lock.
  // A visitor on a running free trial has already been let in by the proxy, so they are not asked for the code on top.
  const running = trial.state === "active" && !tokenIsRight(jar.get(ACCESS_COOKIE)?.value) ? trial : null;
  const workspace = (
    <WorkspaceProvider>
      <AppShell>
        {running && (
          <>
            <TrialNotice daysLeft={running.daysLeft} />
            <TrialClock until={running.until} />
          </>
        )}
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
  return running ? workspace : <AccessLock>{workspace}</AccessLock>;
}
