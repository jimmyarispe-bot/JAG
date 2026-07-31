import { redirect } from "next/navigation";
import { FounderWorkspaceView } from "@/components/founder/FounderWorkspaceView";
import { FounderWorkspaceService } from "@/lib/platform/founder";
import { buildFounderSystemStatusItems } from "@/lib/platform/founder/system-status-display";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";

type FounderPageProps = {
  searchParams?: Promise<{
    organization?: string;
    application?: string;
  }>;
};

/**
 * Sprint 065 — Founder Workspace UI.
 * Data exclusively from FounderWorkspaceService (+ embedded EI result).
 */
export default async function FounderWorkspacePage({ searchParams }: FounderPageProps) {
  const params = (await searchParams) ?? {};
  const workspace = await FounderWorkspaceService.resolve({
    organizationId: params.organization ?? null,
    applicationKey: (params.application as PlatformApplicationKey | undefined) ?? null,
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  const systemStatus = buildFounderSystemStatusItems({
    organizationResolutionOk: workspace.organizations.length > 0,
    executiveIntelligenceOk: Boolean(workspace.intelligence?.brief.sections.length),
  });

  return (
    <FounderWorkspaceView workspace={workspace} systemStatus={systemStatus} />
  );
}
