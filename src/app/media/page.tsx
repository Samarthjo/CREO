import type { Metadata } from "next";
import { Doc } from "@/components/landing/doc";
import { SubPage } from "@/components/landing/subpage";
import { Button, Empty } from "@/components/ui/kit";

export const metadata: Metadata = { title: "Media mentions" };

export default function MediaPage() {
  return (
    <SubPage title="Media mentions" flow="short">
      <Doc eyebrow="Media mentions" title="In the press." intro="Articles, podcasts and talks about CREO will be listed here.">
        <Empty title="Nothing to list yet" body="CREO is opening its first Founding Creator Cohort. When coverage appears, it will be here.">
          <Button variant="ghost" href="/contact">Writing about creators or AI? Get in touch</Button>
        </Empty>
      </Doc>
    </SubPage>
  );
}
