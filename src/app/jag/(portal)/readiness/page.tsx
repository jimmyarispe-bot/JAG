import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagReadinessView } from "@/components/jag/command-center/readiness";
import { loadReadinessWorkspace } from "@/lib/jag-command-center/production-readiness";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Production readiness · JAG",
  description:
    "GA validation of the executive workflow matrix and Capability SDK health.",
};

export default async function JagReadinessPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

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
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = await loadReadinessWorkspace();
  return <JagReadinessView model={model} />;
}
