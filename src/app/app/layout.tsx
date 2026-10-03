import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccessLock } from "@/components/product/access-lock";
import { AppShell } from "@/components/product/app-shell";
import { WorkspaceProvider } from "@/lib/store/workspace";

export const metadata: Metadata = { title: "Workspace", robots: { index: false } };

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AccessLock>
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </AccessLock>
  );
}
