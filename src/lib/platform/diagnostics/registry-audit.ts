import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { RELATIONSHIP_TYPE_KEYS } from "@/lib/platform/relationships/catalog";
import { SYSTEM_TAG_SLUGS } from "@/lib/platform/tags/catalog";
import {
  getDuplicateSectionRegistrations,
  getProfileKindDefinition,
  getProfileSections,
  getRegisteredProfileKinds,
} from "@/lib/platform/profile/registry";
import {
  getRegisteredSectionModuleIds,
  isProfileSectionModuleRegistered,
  parseSectionModuleId,
} from "@/lib/platform/profile/sections/register-module";
import {
  PROFILE_SECTION_GROUPS,
  type ProfileKind,
  type ProfileSectionDefinition,
} from "@/lib/platform/profile/types";

/** Side-effect: register all profile kinds and section modules. */
import "@/lib/platform/profile";

export interface ProfileKindDiagnostics {
  kind: ProfileKind;
  label: string;
  basePath: string;
  defaultSection: string;
  sectionCount: number;
  moduleCount: number;
}

export interface RegistryAuditReport {
  profileKinds: ProfileKindDiagnostics[];
  sections: { kind: ProfileKind; section: ProfileSectionDefinition }[];
  sectionModules: { id: string; kind: ProfileKind; sectionKey: string }[];
  duplicateSectionKeys: { kind: ProfileKind; key: string }[];
  missingModuleRegistrations: { kind: ProfileKind; sectionKey: string }[];
  orphanedSectionModules: { id: string; kind: ProfileKind; sectionKey: string }[];
  invalidNavigationGroups: { kind: ProfileKind; sectionKey: string; group: string }[];
  activityCatalogSize: number;
  activityEventTypes: string[];
  relationshipTypes: readonly string[];
  systemTagSlugs: readonly string[];
}

export function collectRegistryAuditReport(): RegistryAuditReport {
  const kinds = getRegisteredProfileKinds();
  const validGroups = new Set<string>(PROFILE_SECTION_GROUPS);

  const profileKinds: ProfileKindDiagnostics[] = kinds.map((kind) => {
    const def = getProfileKindDefinition(kind)!;
    const sections = getProfileSections(kind);
    const moduleCount = sections.filter((s) =>
      isProfileSectionModuleRegistered(kind, s.key)
    ).length;
    return {
      kind,
      label: def.label,
      basePath: def.basePath,
      defaultSection: def.defaultSection,
      sectionCount: sections.length,
      moduleCount,
    };
  });

  const sections = kinds.flatMap((kind) =>
    getProfileSections(kind).map((section) => ({ kind, section }))
  );

  const sectionModules = getRegisteredSectionModuleIds()
    .map((id) => {
      const parsed = parseSectionModuleId(id);
      if (!parsed) return null;
      return { id, kind: parsed.kind, sectionKey: parsed.sectionKey };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const missingModuleRegistrations = sections
    .filter(({ kind, section }) => !isProfileSectionModuleRegistered(kind, section.key))
    .map(({ kind, section }) => ({ kind, sectionKey: section.key }));

  const registeredSectionKeys = new Set(
    sections.map(({ kind, section }) => `${kind}:${section.key}`)
  );

  const orphanedSectionModules = sectionModules.filter(
    ({ kind, sectionKey }) => !registeredSectionKeys.has(`${kind}:${sectionKey}`)
  );

  const invalidNavigationGroups = sections
    .filter(
      ({ section }) =>
        section.group !== null && !validGroups.has(section.group)
    )
    .map(({ kind, section }) => ({
      kind,
      sectionKey: section.key,
      group: section.group as string,
    }));

  return {
    profileKinds,
    sections,
    sectionModules,
    duplicateSectionKeys: getDuplicateSectionRegistrations(),
    missingModuleRegistrations,
    orphanedSectionModules,
    invalidNavigationGroups,
    activityCatalogSize: Object.keys(ACTIVITY_EVENT_CATALOG).length,
    activityEventTypes: Object.keys(ACTIVITY_EVENT_CATALOG).sort(),
    relationshipTypes: RELATIONSHIP_TYPE_KEYS,
    systemTagSlugs: SYSTEM_TAG_SLUGS,
  };
}
