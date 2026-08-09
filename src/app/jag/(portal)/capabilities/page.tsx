import type { Metadata } from "next";
import { Suspense } from "react";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagCapabilitiesView } from "@/components/jag/command-center/capabilities";
import { loadCapabilitiesWorkspace } from "@/lib/jag-command-center/capabilities";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export const metadata: Metadata = {
  title: "Capabilities",
  description:
    "Intelligence Capability SDK — installed modules, health, providers, and dependencies.",
};

export default async function JagCapabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireJagPlatformAdminSession();

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Capabilities"
          description="Loading capability registry…"
          cards={4}
        />
      }
    >
      <CapabilitiesContent capabilityId={params.id} />
    </Suspense>
  );
}

async function CapabilitiesContent({
  capabilityId,
}: {
  capabilityId?: string;
}) {
  await requireJagPlatformAdminSession();
  const model = loadCapabilitiesWorkspace({ capabilityId });
  return <JagCapabilitiesView model={model} />;
}
