import type { PlatformEntityType } from "@/lib/platform/shared/entity-types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { IdentityContext } from "@/lib/platform/identity/context";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Registered profile kinds — Student is the first implementation. */
export const PROFILE_KINDS = [
  "student",
  "employee",
  "family",
  "school",
  "organization",
  "scholarship",
  "grant",
  "vendor",
  "facility",
] as const;

export type ProfileKind = (typeof PROFILE_KINDS)[number];

export function isProfileKind(value: string): value is ProfileKind {
  return (PROFILE_KINDS as readonly string[]).includes(value);
}

/** Navigation groups — shared taxonomy across all profile kinds. */
export const PROFILE_SECTION_GROUPS = [
  "core",
  "learning",
  "student_life",
  "support",
  "financial",
  "operations",
  "intelligence",
  "system",
] as const;

export type ProfileSectionGroup = (typeof PROFILE_SECTION_GROUPS)[number];

export const PROFILE_SECTION_GROUP_LABELS: Record<ProfileSectionGroup, string> = {
  core: "Core",
  learning: "Learning",
  student_life: "Student Life",
  support: "Support",
  financial: "Financial",
  operations: "Operations",
  intelligence: "Intelligence",
  system: "System",
};

export type ProfileSectionStatus = "live" | "partial" | "placeholder";

export type ProfileSectionContext = Record<string, unknown>;

/**
 * Base envelope every profile kind extends.
 * Entity-agnostic context passed to section loaders and UI shell.
 */
export interface ProfileEnvelopeBase {
  profileKind: ProfileKind;
  entityType: PlatformEntityType | string;
  entityId: string;
  organizationId: string | null;
  schoolId: string | null;
  campusId: string | null;
  displayName: string;
  subtitle: string | null;
  permissions: string[];
  enabledModules: string[];
  basePath: string;
  sectionParam: string;
  defaultSection: string;
}

export interface ProfileSectionDefinition {
  /** Stable URL key — permanent contract */
  key: string;
  label: string;
  group: ProfileSectionGroup | null;
  sortOrder: number;
  /** Ties to config_module_installations.module_key */
  moduleKey: string;
  /** User must hold any of these permissions (empty = inherit kind permissions) */
  permissions: string[];
  status: ProfileSectionStatus;
  /** When true, section is pinned outside groups (e.g. Overview) */
  pinned?: boolean;
  /** Optional activity classification filter for timeline-derived sections */
  activityClassification?: string | string[];
  loadData?: (
    supabase: AuthClient,
    envelope: ProfileEnvelopeBase,
    ctx: ProfileSectionContext
  ) => Promise<unknown>;
}

export interface ProfileKindDefinition {
  kind: ProfileKind;
  entityType: PlatformEntityType | string;
  label: string;
  subtitle: string;
  basePath: string;
  sectionParam: string;
  defaultSection: string;
  /** Permissions required to view this profile kind at all */
  viewPermissions: string[];
  buildEnvelope: (
    supabase: AuthClient,
    entityId: string,
    identity: IdentityContext
  ) => Promise<ProfileEnvelopeBase | null>;
  legacySectionRedirects?: Record<string, string>;
}

export interface ResolvedProfileSection extends ProfileSectionDefinition {
  href: string;
  visible: boolean;
  hiddenReason?: "permission" | "module_disabled" | "kind_mismatch";
}

export interface ProfileNavigationGroup {
  group: ProfileSectionGroup;
  label: string;
  sections: ResolvedProfileSection[];
}

export interface ProfileNavigationModel {
  pinned: ResolvedProfileSection[];
  groups: ProfileNavigationGroup[];
  overflow: ResolvedProfileSection[];
  activeSection: string;
  activeSectionDef: ResolvedProfileSection | null;
}

export interface ProfileResolveOptions {
  section?: string;
  permissions?: string[];
  enabledModules?: string[];
}
