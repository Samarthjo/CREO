import type { Metadata } from "next";
import { CollabSection } from "@/components/landing/collab-section";
import { SubPage } from "@/components/landing/subpage";

export const metadata: Metadata = { title: "Collab Inbox" };

export default function CollabInboxPage() {
  return <SubPage title="Collab Inbox"><CollabSection /></SubPage>;
}
