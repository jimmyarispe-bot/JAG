import { Suspense } from "react";
import { ExecutivePageContent, ExecutivePageSkeleton } from "./ExecutivePageContent";

interface ExecutivePageProps {
  searchParams: Promise<{ view?: string; work?: string; role?: string }>;
}

export default function ExecutiveCommandCenterPage({ searchParams }: ExecutivePageProps) {
  return (
    <Suspense fallback={<ExecutivePageSkeleton />}>
      <ExecutivePageContent searchParams={searchParams} />
    </Suspense>
  );
}
