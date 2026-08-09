import type { Metadata } from "next";
import { Suspense } from "react";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagReadinessView } from "@/components/jag/command-center/readiness";
import { loadReadinessWorkspace } from "@/lib/jag-command-center/production-readiness";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export const metadata: Metadata = {
  title: "Production readiness",
  description:
    "GA validation of the executive workflow matrix and Capability SDK health.",
};

export default async function JagReadinessPage() {
  await requireJagPlatformAdminSession();

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Production readiness"
          description="Running validation…"
          cards={3}
        />
      }
    >
      <ReadinessContent />
    </Suspense>
  );
}

async function ReadinessContent() {
  await requireJagPlatformAdminSession();
  const model = await loadReadinessWorkspace();
  return <JagReadinessView model={model} />;
}
