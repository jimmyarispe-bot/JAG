import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  JagExecutiveOverview,
  JagLoadingSkeleton,
} from "@/components/jag/command-center";
import { loadExecutiveOverview } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { resolveJagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import { THE_JAG_MARK } from "@/lib/platform/branding";

export default async function JagCommandCenterPage({
  searchParams,
}: {
  // `workspace` is consumed by /jag layout via middleware-mirrored searchParams.
  searchParams: Promise<{ org?: string; workspace?: string }>;
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
          title={THE_JAG_MARK}
          description="Loading overview…"
        />
      }
    >
      <OverviewContent
        organizationId={params.org}
        workspaceParam={params.workspace}
      />
    </Suspense>
  );
}

async function OverviewContent({
  organizationId,
  workspaceParam,
}: {
  organizationId?: string;
  workspaceParam?: string;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  const model = loadExecutiveOverview(session, { organizationId });
  const workspaceMode = resolveJagWorkspaceMode({
    session,
    activeOrganizationId:
      model.organizationId ?? organizationId ?? session.organizationId,
    workspaceParam,
  });
  return (
    <JagExecutiveOverview model={model} workspaceMode={workspaceMode} />
  );
}
