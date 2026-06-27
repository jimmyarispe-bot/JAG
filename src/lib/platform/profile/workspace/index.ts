export type {
  ProfileContributionDefinition,
  ProfileContributionSlot,
  ProfileWorkspaceContributions,
  ProfileWorkspaceHeaderProps,
  ProfileWorkspaceShellProps,
  PlatformProfileWorkspaceConfig,
} from "@/lib/platform/profile/workspace/types";
export {
  PROFILE_CONTRIBUTION_SLOTS,
  PROFILE_CONTEXT_PANEL_SECTIONS,
} from "@/lib/platform/profile/workspace/types";
export {
  registerProfileContribution,
  getProfileContributions,
  listContributionSlotsForKind,
} from "@/lib/platform/profile/workspace/contributions";
