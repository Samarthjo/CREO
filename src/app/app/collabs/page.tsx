import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { CollabsClient } from "./collabs-client";

export default function CollabsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem]" />}>
      <CollabsClient />
    </Suspense>
  );
}
