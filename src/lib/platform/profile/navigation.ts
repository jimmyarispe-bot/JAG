import {
  PROFILE_SECTION_GROUP_LABELS,
  PROFILE_SECTION_GROUPS,
  type ProfileEnvelopeBase,
  type ProfileNavigationGroup,
  type ProfileNavigationModel,
  type ProfileResolveOptions,
  type ProfileSectionGroup,
  type ResolvedProfileSection,
} from "@/lib/platform/profile/types";
import {
  getProfileSections,
  resolveSectionKey,
} from "@/lib/platform/profile/registry";
import {
  filterAccessibleSections,
  resolveVisibleSections,
} from "@/lib/platform/profile/access";

const OVERFLOW_THRESHOLD = 12;

export function buildProfileNavigation(
  envelope: ProfileEnvelopeBase,
  requestedSection: string | undefined,
  options?: ProfileResolveOptions
): ProfileNavigationModel {
  const sections = getProfileSections(envelope.profileKind);
  const resolved = resolveVisibleSections(sections, envelope, options);
  const accessible = filterAccessibleSections(resolved);

  const activeSection = resolveSectionKey(envelope.profileKind, requestedSection);
  const activeSectionDef =
    accessible.find((s) => s.key === activeSection) ??
    accessible.find((s) => s.key === envelope.defaultSection) ??
    accessible[0] ??
    null;

  const pinned = accessible.filter((s) => s.pinned);
  const grouped = accessible.filter((s) => !s.pinned);

  const groups: ProfileNavigationGroup[] = PROFILE_SECTION_GROUPS.map((group) => ({
    group,
    label: PROFILE_SECTION_GROUP_LABELS[group],
    sections: grouped.filter((s) => s.group === group),
  })).filter((g) => g.sections.length > 0);

  const flatGrouped = groups.flatMap((g) => g.sections);
  const overflow =
    flatGrouped.length > OVERFLOW_THRESHOLD ? flatGrouped.slice(OVERFLOW_THRESHOLD) : [];
  const overflowKeys = new Set(overflow.map((s) => s.key));

  const overflowGroups: ProfileNavigationGroup[] = PROFILE_SECTION_GROUPS.map((group) => ({
    group,
    label: PROFILE_SECTION_GROUP_LABELS[group],
    sections: overflow.filter((s) => s.group === group),
  })).filter((g) => g.sections.length > 0);

  return {
    pinned,
    groups: overflow.length
      ? groups.map((g) => ({
          ...g,
          sections: g.sections.filter((s) => !overflowKeys.has(s.key)),
        }))
      : groups,
    overflow,
    overflowGroups,
    activeSection: activeSectionDef?.key ?? envelope.defaultSection,
    activeSectionDef,
  };
}

export function sectionsForViewTabs(
  navigation: ProfileNavigationModel
): ResolvedProfileSection[] {
  return [
    ...navigation.pinned,
    ...navigation.groups.flatMap((g) => g.sections),
    ...navigation.overflow,
  ];
}

export function groupForSection(
  sectionKey: string,
  navigation: ProfileNavigationModel
): ProfileSectionGroup | null {
  for (const g of navigation.groups) {
    if (g.sections.some((s) => s.key === sectionKey)) return g.group;
  }
  for (const g of navigation.overflowGroups) {
    if (g.sections.some((s) => s.key === sectionKey)) return g.group;
  }
  return null;
}

/** Resolve the active section definition from a navigation model. */
export function findActiveSectionDef(
  navigation: ProfileNavigationModel
): ResolvedProfileSection | null {
  return (
    navigation.activeSectionDef ??
    navigation.pinned.find((s) => s.key === navigation.activeSection) ??
    navigation.groups
      .flatMap((g) => g.sections)
      .find((s) => s.key === navigation.activeSection) ??
    navigation.overflow.find((s) => s.key === navigation.activeSection) ??
    null
  );
}
