/** Side-effect: register platform profile kinds (Student, Employee, …). */
import "@/lib/students/profile/register";
import "@/lib/students/profile/contributions";
import "@/lib/employees/profile/register";

export {
  buildProfileEnvelopeBase,
  buildEnvelopeContext,
  loadEnabledModuleKeys,
} from "@/lib/platform/profile/envelope";
export {
  registerProfileKind,
  registerProfileSection,
  getProfileKindDefinition,
  getRegisteredProfileKinds,
  getProfileSections,
  getProfileSection,
  isRegisteredSection,
  resolveSectionKey,
  buildSectionHref,
} from "@/lib/platform/profile/registry";
export {
  userHasAnyPermission,
  isModuleEnabled,
  resolveSectionVisibility,
  resolveProfileSection,
  resolveVisibleSections,
  filterAccessibleSections,
  canAccessProfileKind,
} from "@/lib/platform/profile/access";
export {
  buildProfileNavigation,
  sectionsForViewTabs,
  groupForSection,
} from "@/lib/platform/profile/navigation";
export {
  resolveProfile,
  loadActiveSectionData,
  listRegisteredSectionKeys,
} from "@/lib/platform/profile/resolver";
export * from "@/lib/platform/profile/sections";
export * from "@/lib/platform/profile/workspace";
export type {
  ProfileKind,
  ProfileSectionGroup,
  ProfileSectionStatus,
  ProfileEnvelopeBase,
  ProfileSectionDefinition,
  ProfileKindDefinition,
  ResolvedProfileSection,
  ProfileNavigationGroup,
  ProfileNavigationModel,
  ProfileResolveOptions,
  ProfileSectionContext,
} from "@/lib/platform/profile/types";
export {
  PROFILE_KINDS,
  PROFILE_SECTION_GROUPS,
  PROFILE_SECTION_GROUP_LABELS,
  isProfileKind,
} from "@/lib/platform/profile/types";
