import {
  PROFILE_SECTION_GROUP_LABELS,
  PROFILE_SECTION_GROUPS,
  type ClientProfileNavigation,
  type ClientProfileNavSection,
  type ProfileEnvelopeBase,
  type ProfileNavigationGroup,
  type ProfileNavigationModel,
  type ProfileResolveOptions,
  type ProfileSectionGroup,
  type ResolvedProfileSection,
} from "@/lib/platform/profile/types";
import {
  getProfileKindDefinition,
  getProfileSections,
  resolveSectionKey,
} from "@/lib/platform/profile/registry";
import {
  filterAccessibleSections,
  resolveVisibleSections,
} from "@/lib/platform/profile/access";

/**
 * When sections stop fitting on the tab strip and go behind "More".
 *
 * Twelve was chosen when the strip was a single scrolling row, where a
 * thirteenth tab was genuinely invisible. The strip now wraps, so tabs past the
 * twelfth cost a second row rather than disappearing — and a tab you can see is
 * worth more than the row it occupies. The admissions case has fifteen
 * sections; at twelve, three of them lived in a dropdown nobody opened.
 *
 * The valve is still here for a profile kind that grows an unreasonable number
 * of sections, where three or four rows of tabs would be worse than a menu.
 */
const OVERFLOW_THRESHOLD = 24;

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

  /*
     Tab order.

     A grouped kind reads group by group, which is why the admissions case used
     to open with Scholarships & Funding and then jump back to Pipeline: money
     is the "financial" group and financial sorts before operations. Nobody
     works a case in that order.

     A flat kind reads sortOrder straight through, so the strip can be laid out
     as the process actually runs. `groups` is untouched either way - it still
     answers what belongs with what for groupForSection and the legend. */
  const flat = getProfileKindDefinition(envelope.profileKind)?.tabOrder === "flat";

  const flatGrouped = flat
    ? [...grouped].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
      )
    : groups.flatMap((g) => g.sections);

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
    order: [...pinned, ...flatGrouped.filter((s) => !overflowKeys.has(s.key))],
    flat,
    overflow,
    overflowGroups,
    activeSection: activeSectionDef?.key ?? envelope.defaultSection,
    activeSectionDef,
  };
}

export function sectionsForViewTabs(
  navigation: ProfileNavigationModel
): ResolvedProfileSection[] {
  return [...navigation.order, ...navigation.overflow];
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

function toClientNavSection(section: ResolvedProfileSection): ClientProfileNavSection {
  return {
    key: section.key,
    label: section.label,
    href: section.href,
    visible: section.visible,
    status: section.status,
    pinned: section.pinned,
    group: section.group,
    hiddenReason: section.hiddenReason,
  };
}

/**
 * Strip non-serializable section fields (e.g. loadData) before passing navigation
 * into Client Components. Without this, the Student Profile RSC crashes with a
 * Next.js props serialization error.
 */
export function toClientProfileNavigation(
  navigation: ProfileNavigationModel
): ClientProfileNavigation {
  return {
    pinned: navigation.pinned.map(toClientNavSection),
    order: navigation.order.map(toClientNavSection),
    flat: navigation.flat,
    groups: navigation.groups.map((group) => ({
      group: group.group,
      label: group.label,
      sections: group.sections.map(toClientNavSection),
    })),
    overflow: navigation.overflow.map(toClientNavSection),
    overflowGroups: navigation.overflowGroups.map((group) => ({
      group: group.group,
      label: group.label,
      sections: group.sections.map(toClientNavSection),
    })),
    activeSection: navigation.activeSection,
  };
}

/** True when a value is safe to pass across the RSC → client boundary. */
export function assertClientProfileNavigationSerializable(
  navigation: ClientProfileNavigation
): void {
  const serialized = JSON.stringify(navigation);
  JSON.parse(serialized);
  if (serialized.includes("loadData")) {
    throw new Error("Client profile navigation must not include loadData");
  }
}
