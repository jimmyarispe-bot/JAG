import type {
  ProfileKind,
  ProfileKindDefinition,
  ProfileSectionDefinition,
} from "@/lib/platform/profile/types";

const PROFILE_KIND_REGISTRY = new Map<ProfileKind, ProfileKindDefinition>();
const SECTION_REGISTRY = new Map<ProfileKind, ProfileSectionDefinition[]>();

/** Register a profile kind (Student, Employee, Family, …). */
export function registerProfileKind(definition: ProfileKindDefinition): void {
  PROFILE_KIND_REGISTRY.set(definition.kind, definition);
  if (!SECTION_REGISTRY.has(definition.kind)) {
    SECTION_REGISTRY.set(definition.kind, []);
  }
}

/** Register a section for a profile kind. Call from domain modules at import time. */
export function registerProfileSection(
  kind: ProfileKind,
  section: ProfileSectionDefinition
): void {
  const kindDef = PROFILE_KIND_REGISTRY.get(kind);
  if (!kindDef) {
    throw new Error(`Cannot register section — profile kind not registered: ${kind}`);
  }

  const sections = SECTION_REGISTRY.get(kind) ?? [];
  if (sections.some((s) => s.key === section.key)) {
    return;
  }

  sections.push(section);
  sections.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
  SECTION_REGISTRY.set(kind, sections);
}

export function getProfileKindDefinition(kind: ProfileKind): ProfileKindDefinition | undefined {
  return PROFILE_KIND_REGISTRY.get(kind);
}

export function getRegisteredProfileKinds(): ProfileKind[] {
  return [...PROFILE_KIND_REGISTRY.keys()];
}

export function getProfileSections(kind: ProfileKind): ProfileSectionDefinition[] {
  return [...(SECTION_REGISTRY.get(kind) ?? [])];
}

export function getProfileSection(
  kind: ProfileKind,
  sectionKey: string
): ProfileSectionDefinition | undefined {
  return getProfileSections(kind).find((s) => s.key === sectionKey);
}

export function isRegisteredSection(kind: ProfileKind, sectionKey: string): boolean {
  return getProfileSections(kind).some((s) => s.key === sectionKey);
}

/** Resolve legacy ?tab= or unknown section keys to canonical section keys. */
export function resolveSectionKey(
  kind: ProfileKind,
  requestedSection: string | undefined | null
): string {
  const kindDef = PROFILE_KIND_REGISTRY.get(kind);
  const defaultKey = kindDef?.defaultSection ?? "overview";

  if (!requestedSection) return defaultKey;

  if (isRegisteredSection(kind, requestedSection)) return requestedSection;

  const redirected = kindDef?.legacySectionRedirects?.[requestedSection];
  if (redirected && isRegisteredSection(kind, redirected)) return redirected;

  return defaultKey;
}

export function buildSectionHref(
  envelope: { basePath: string; entityId: string; sectionParam: string },
  sectionKey: string
): string {
  return `${envelope.basePath}/${envelope.entityId}?${envelope.sectionParam}=${sectionKey}`;
}
