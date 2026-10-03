import type { Metadata } from "next";
import Link from "next/link";
import { AccessForm } from "@/components/landing/access-form";
import { Doc } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { safeNext } from "@/lib/access";

export const metadata: Metadata = { title: "Workspace access", robots: { index: false } };

const link = "font-medium text-ink underline underline-offset-4 hover:no-underline";

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <SubPage title="Workspace access" flow="short">
      <Doc eyebrow="Workspace" title="Invite only, for now." intro="The CREO workspace is open to people with an access code. Founding Cohort members get one when they join.">
        <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-pop sm:p-8"><AccessForm next={safeNext(next)} /></div>
        <p className="text-[0.9375rem] leading-relaxed text-body">
          No code yet? <Link href="/cohort#apply" className={link}>Join the 30-Day Founding Cohort</Link>, or <Link href="/contact" className={link}>contact us</Link>.
        </p>
      </Doc>
    </SubPage>
  );
}
