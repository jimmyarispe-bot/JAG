import { Suspense, type ReactNode } from "react";
import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import { ProfileSectionRenderer } from "@/components/platform/profile-workspace/ProfileSectionRenderer";
import { ProfileTagsList } from "@/components/platform/profile-sections/ProfileTagsList";
import { ProfileWorkspaceSectionNav } from "@/components/platform/profile-workspace/ProfileWorkspaceSectionNav";
import { ProfileWorkspaceShell } from "@/components/platform/profile-workspace/ProfileWorkspaceShell";
import {
  findActiveSectionDef,
  toClientProfileNavigation,
} from "@/lib/platform/profile/navigation";
import type { PlatformProfileWorkspaceConfig } from "@/lib/platform/profile/workspace/types";

function mergeContext(config: PlatformProfileWorkspaceConfig) {
  const contributions = config.sectionContributions;
  const defaults = config.contextDefaults;

  return {
    quickActions: contributions?.context?.quickActions ?? defaults?.quickActions,
    widgets: (
      <>
        {contributions?.context?.widgets ?? defaults?.widgets}
        {config.pinnedNotes.length > 0 && (
          <ProfileNotesPanel notes={config.pinnedNotes} title="Pinned Notes" limit={5} />
        )}
      </>
    ),
    aiRecommendations:
      contributions?.context?.aiRecommendations ?? defaults?.aiRecommendations,
    notifications: contributions?.context?.notifications ?? defaults?.notifications,
    tasks: contributions?.context?.tasks ?? defaults?.tasks,
    approvals: contributions?.context?.approvals ?? defaults?.approvals,
  };
}

function mergeHeader(config: PlatformProfileWorkspaceConfig) {
  const contributions = config.sectionContributions;

  return {
    ...config.header,
    badges: (
      <>
        {config.header.badges}
        {config.entityTags.length > 0 && (
          <div className="mt-2 w-full">
            <ProfileTagsList tags={config.entityTags} title="" />
          </div>
        )}
      </>
    ),
    actions: contributions?.header?.actions ?? config.header.actions,
    alerts: contributions?.header?.alerts ?? config.header.alerts,
  };
}

/** Generic profile workspace orchestration — domain wrappers supply configuration only. */
export function PlatformProfileWorkspace({
  config,
  sectionSlot,
}: {
  config: PlatformProfileWorkspaceConfig;
  /** Statically-linked section element. Required for domains whose sections are client components. */
  sectionSlot?: ReactNode;
}) {
  const activeSectionDef = findActiveSectionDef(config.navigation);

  if (!activeSectionDef) {
    return null;
  }

  // Client nav must not receive loadData (or any functions) — RSC serialization.
  const clientNavigation = toClientProfileNavigation(config.navigation);

  return (
    <ProfileWorkspaceShell
      header={mergeHeader(config)}
      sectionNav={<ProfileWorkspaceSectionNav navigation={clientNavigation} />}
      workspaceAlerts={config.sectionContributions?.workspaceAlerts ?? config.workspaceAlerts}
      context={mergeContext(config)}
      contextTitle={config.contextTitle}
      workspace={
        <Suspense
          fallback={
            <ProfileSectionPlaceholder
              title={activeSectionDef.label}
              status="partial"
              description="Loading section…"
            />
          }
        >
          {sectionSlot ?? (
            <ProfileSectionRenderer
              profileKind={config.profileKind}
              sectionKey={config.activeSection}
              envelope={config.envelope}
              data={config.activeSectionData}
            />
          )}
        </Suspense>
      }
    />
  );
}
