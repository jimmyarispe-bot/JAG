import type { ProfileKind } from "@/lib/platform/profile/types";
import type { ReactNode } from "react";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { ProfileNavigationModel, ProfileEnvelopeBase } from "@/lib/platform/profile/types";
import type { ProfileSectionContributions } from "@/lib/platform/profile/sections/types";

/** Slots where modules contribute UI without modifying the workspace shell. */
export const PROFILE_CONTRIBUTION_SLOTS = [
  "header.actions",
  "header.alerts",
  "header.badges",
  "workspace.alerts",
  "context.widgets",
  "context.quick_actions",
  "context.ai_recommendations",
  "context.notifications",
  "context.tasks",
  "context.approvals",
] as const;

export type ProfileContributionSlot = (typeof PROFILE_CONTRIBUTION_SLOTS)[number];

export interface ProfileContributionDefinition {
  id: string;
  slot: ProfileContributionSlot;
  /** Profile kind or '*' for all kinds */
  profileKind: ProfileKind | "*";
  moduleKey: string;
  label: string;
  sortOrder: number;
}

/** Resolved contribution content passed into the shell by the workspace implementation. */
export interface ProfileWorkspaceContributions {
  header?: {
    avatar?: ReactNode;
    badges?: ReactNode;
    actions?: ReactNode;
    alerts?: ReactNode;
  };
  workspaceAlerts?: ReactNode;
  context?: {
    widgets?: ReactNode;
    quickActions?: ReactNode;
    aiRecommendations?: ReactNode;
    notifications?: ReactNode;
    tasks?: ReactNode;
    approvals?: ReactNode;
  };
}

export interface ProfileWorkspaceHeaderProps {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string | null;
  avatar?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  alerts?: ReactNode;
}

export interface ProfileWorkspaceShellProps {
  header: ProfileWorkspaceHeaderProps;
  /** Section navigation rendered inside the workspace region */
  sectionNav?: ReactNode;
  workspaceAlerts?: ReactNode;
  /** Module-owned main workspace content */
  workspace: ReactNode;
  context?: ProfileWorkspaceContributions["context"];
  contextTitle?: string;
}

/** Configuration supplied by each profile kind workspace wrapper. */
export interface PlatformProfileWorkspaceConfig {
  profileKind: ProfileKind;
  envelope: ProfileEnvelopeBase;
  navigation: ProfileNavigationModel;
  activeSection: string;
  activeSectionData: unknown;
  pinnedNotes: PlatformNote[];
  entityTags: PlatformEntityTag[];
  sectionContributions?: ProfileSectionContributions | null;
  header: ProfileWorkspaceHeaderProps;
  contextTitle: string;
  contextDefaults?: ProfileWorkspaceContributions["context"];
  workspaceAlerts?: ReactNode;
}

export const PROFILE_CONTEXT_PANEL_SECTIONS = [
  { key: "quick_actions", label: "Quick Actions", slot: "context.quick_actions" as const },
  { key: "widgets", label: "Widgets", slot: "context.widgets" as const },
  { key: "ai_recommendations", label: "AI Insights", slot: "context.ai_recommendations" as const },
  { key: "notifications", label: "Notifications", slot: "context.notifications" as const },
  { key: "tasks", label: "Tasks", slot: "context.tasks" as const },
  { key: "approvals", label: "Approvals", slot: "context.approvals" as const },
] as const;
