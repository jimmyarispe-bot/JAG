import { ProfileContextPanel } from "@/components/platform/profile-workspace/ProfileContextPanel";
import { ProfileWorkspaceHeader } from "@/components/platform/profile-workspace/ProfileWorkspaceHeader";
import type { ProfileWorkspaceShellProps } from "@/lib/platform/profile/workspace/types";

/**
 * Platform Profile Workspace — layout shell only.
 * Modules supply workspace content and context panel contributions; the shell never embeds domain logic.
 */
export function ProfileWorkspaceShell({
  header,
  sectionNav,
  workspaceAlerts,
  workspace,
  context,
  contextTitle,
}: ProfileWorkspaceShellProps) {
  const hasContext = Boolean(
    context?.widgets ||
      context?.quickActions ||
      context?.aiRecommendations ||
      context?.notifications ||
      context?.tasks ||
      context?.approvals
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <ProfileWorkspaceHeader {...header} />

      <div
        className={`grid gap-6 ${hasContext ? "lg:grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"}`}
      >
        <main className="min-w-0 space-y-4" aria-label="Profile workspace">
          {sectionNav}
          {workspaceAlerts && <div className="space-y-2">{workspaceAlerts}</div>}
          <div className="min-h-[320px]">{workspace}</div>
        </main>

        {hasContext && (
          <ProfileContextPanel title={contextTitle} context={context} />
        )}
      </div>
    </div>
  );
}
