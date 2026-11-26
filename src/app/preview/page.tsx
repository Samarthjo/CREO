import type { Metadata } from "next";
import { PreviewTool } from "@/components/preview/preview-tool";
import { SubPage } from "@/components/landing/subpage";
import { parseAnswers, previewTitle } from "@/lib/preview";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const DESCRIPTION = "Answer three questions and get three post ideas for your niche, with why each one fits. Free, from CREO's pattern library.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const a = parseAnswers(await searchParams);
  const title = a ? previewTitle(a) : "Free post ideas";
  // Every shared link points back at /preview, so the answers do not make a page of their own.
  return { title, description: DESCRIPTION, alternates: { canonical: "/preview" }, openGraph: { title, description: DESCRIPTION } };
}

export default async function PreviewPage({ searchParams }: Props) {
  const initial = parseAnswers(await searchParams);
  return (
    <SubPage title="Free post ideas" flow="short">
      <PreviewTool initial={initial} />
    </SubPage>
  );
}
