import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagExecutiveOverview, JagSection } from "@/components/jag/command-center";
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
    <Suspense fallback={<OverviewLoadingFallback />}>
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

function OverviewLoadingFallback() {
  return (
    <JagSection title="JAG Executive Command Center" description="Loading overview…">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)]"
          />
        ))}
      </div>
    </JagSection>
  );
}
