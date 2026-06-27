import { registerProfileSection } from "@/lib/platform/profile/registry";
import type { ProfileKind } from "@/lib/platform/profile/types";
import type {
  ProfileSectionComponent,
  ProfileSectionContributions,
  ProfileSectionModuleDefinition,
  RegisterProfileSectionModuleInput,
} from "@/lib/platform/profile/sections/types";

const SECTION_COMPONENT_REGISTRY = new Map<string, ProfileSectionComponent>();
const SECTION_CONTRIBUTIONS_REGISTRY = new Map<
  string,
  ProfileSectionModuleDefinition["loadContributions"]
>();

function componentId(kind: ProfileKind, sectionKey: string): string {
  return `${kind}:${sectionKey}`;
}

/** Register a self-contained profile section module (metadata + loader + component). */
export function registerProfileSectionModule(input: RegisterProfileSectionModuleInput): void {
  const id = input.definition.componentId ?? componentId(input.kind, input.definition.key);
  const definition: ProfileSectionModuleDefinition = {
    ...input.definition,
    componentId: id,
  };

  registerProfileSection(input.kind, definition);
  SECTION_COMPONENT_REGISTRY.set(id, input.component);

  if (definition.loadContributions) {
    SECTION_CONTRIBUTIONS_REGISTRY.set(id, definition.loadContributions);
  }
}

export function getProfileSectionComponent(
  kind: ProfileKind,
  sectionKey: string
): ProfileSectionComponent | undefined {
  return SECTION_COMPONENT_REGISTRY.get(componentId(kind, sectionKey));
}

export function getProfileSectionContributionsLoader(
  kind: ProfileKind,
  sectionKey: string
): ProfileSectionModuleDefinition["loadContributions"] | undefined {
  return SECTION_CONTRIBUTIONS_REGISTRY.get(componentId(kind, sectionKey));
}

export async function loadProfileSectionContributions(
  kind: ProfileKind,
  sectionKey: string,
  supabase: Parameters<NonNullable<ProfileSectionModuleDefinition["loadContributions"]>>[0],
  envelope: Parameters<NonNullable<ProfileSectionModuleDefinition["loadContributions"]>>[1],
  data: unknown
): Promise<ProfileSectionContributions | null> {
  const loader = getProfileSectionContributionsLoader(kind, sectionKey);
  if (!loader) return null;
  return loader(supabase, envelope, data);
}

export function isProfileSectionModuleRegistered(
  kind: ProfileKind,
  sectionKey: string
): boolean {
  return SECTION_COMPONENT_REGISTRY.has(componentId(kind, sectionKey));
}
