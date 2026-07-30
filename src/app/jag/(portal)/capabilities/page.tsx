import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagCapabilitiesView } from "@/components/jag/command-center/capabilities";
import { loadCapabilitiesWorkspace } from "@/lib/jag-command-center/capabilities";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Capabilities · JAG",
  description:
    "Intelligence Capability SDK — installed modules, health, providers, and dependencies.",
};

export default async function JagCapabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

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
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadCapabilitiesWorkspace({ capabilityId });
  return <JagCapabilitiesView model={model} />;
}
