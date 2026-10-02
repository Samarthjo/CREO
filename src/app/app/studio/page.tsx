import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { StudioClient } from "./studio-client";

export default function StudioPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem]" />}>
      <StudioClient />
    </Suspense>
  );
}
