import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  JagExecutiveOverview,
  JagLoadingSkeleton,
} from "@/components/jag/command-center";
import { loadExecutiveOverview } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagCommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="JAG Executive Command Center"
          description="Loading overview…"
        />
      }
    >
      <OverviewContent organizationId={params.org} />
    </Suspense>
  );
}

async function OverviewContent({
  organizationId,
}: {
  organizationId?: string;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  const model = loadExecutiveOverview(session, { organizationId });
  return <JagExecutiveOverview model={model} />;
}
