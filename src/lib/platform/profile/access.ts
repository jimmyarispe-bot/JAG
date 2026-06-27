import {
  buildSectionHref,
} from "@/lib/platform/profile/registry";
import type { PermissionKey } from "@/lib/platform/identity/types";
import type { ModuleInstallStatus } from "@/lib/configuration/types";
import type {
  ProfileEnvelopeBase,
  ProfileKind,
  ProfileResolveOptions,
  ProfileSectionDefinition,
  ResolvedProfileSection,
} from "@/lib/platform/profile/types";

const ENABLED_MODULE_STATUSES: ModuleInstallStatus[] = ["installed", "enabled"];

export function userHasAnyPermission(
  userPermissions: string[],
  required: string[]
): boolean {
  if (!required.length) return true;
  return required.some((p) => userPermissions.includes(p));
}

export function isModuleEnabled(
  enabledModules: string[],
  moduleKey: string
): boolean {
  if (moduleKey === "platform") return true;
  return enabledModules.includes(moduleKey);
}

export function resolveSectionVisibility(
  section: ProfileSectionDefinition,
  envelope: ProfileEnvelopeBase,
  options?: ProfileResolveOptions
): Pick<ResolvedProfileSection, "visible" | "hiddenReason"> {
  const permissions = options?.permissions ?? envelope.permissions;
  const enabledModules = options?.enabledModules ?? envelope.enabledModules;

  const requiredPerms = section.permissions.length
    ? section.permissions
    : getProfileKindViewPermissions(envelope.profileKind);

  if (!userHasAnyPermission(permissions, requiredPerms)) {
    return { visible: false, hiddenReason: "permission" };
  }

  if (section.moduleKey && !isModuleEnabled(enabledModules, section.moduleKey)) {
    return { visible: false, hiddenReason: "module_disabled" };
  }

  return { visible: true };
}

function getProfileKindViewPermissions(kind: ProfileKind): string[] {
  // Lazy import avoided — duplicated minimal defaults for access checks on unregistered kinds
  const defaults: Partial<Record<ProfileKind, string[]>> = {
    student: ["students.view"],
    employee: ["hr.view"],
    family: ["students.view"],
    school: ["org.view", "school.configure"],
    organization: ["org.view"],
    scholarship: ["scholarships.view"],
    grant: ["finance.view"],
    vendor: ["finance.view"],
    facility: ["org.view"],
  };
  return defaults[kind] ?? [];
}

export function resolveProfileSection(
  section: ProfileSectionDefinition,
  envelope: ProfileEnvelopeBase,
  options?: ProfileResolveOptions
): ResolvedProfileSection {
  const visibility = resolveSectionVisibility(section, envelope, options);

  return {
    ...section,
    href: buildSectionHref(envelope, section.key),
    ...visibility,
  };
}

export function resolveVisibleSections(
  sections: ProfileSectionDefinition[],
  envelope: ProfileEnvelopeBase,
  options?: ProfileResolveOptions
): ResolvedProfileSection[] {
  return sections.map((s) => resolveProfileSection(s, envelope, options));
}

export function filterAccessibleSections(
  sections: ResolvedProfileSection[]
): ResolvedProfileSection[] {
  return sections.filter((s) => s.visible);
}

/** Check if user can access a profile kind at all. */
export function canAccessProfileKind(
  kind: ProfileKind,
  viewPermissions: string[],
  userPermissions: string[]
): boolean {
  return userHasAnyPermission(userPermissions, viewPermissions);
}

export type { PermissionKey };
