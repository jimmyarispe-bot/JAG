import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import { FAMILY_PROFILE_SECTIONS } from "@/lib/families/profile/sections";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENT_LOADERS: Record<string, () => Promise<ProfileSectionComponent>> = {
  overview: () =>
    import("@/components/families/profile/sections/FamilyOverviewSection").then(
      (module) => module.FamilyOverviewSection
    ),
};

/** Register family profile section modules (registry placeholders until Phase 3 UI). */
export function registerFamilyProfileSectionModules(): void {
  const placeholderLoader = (): Promise<ProfileSectionComponent> =>
    import("@/components/families/profile/sections/RegistryPlaceholderSections").then(
      (module) => module.FamilyRegistrySection
    );

  for (const def of FAMILY_PROFILE_SECTIONS) {
    const componentLoader = SECTION_COMPONENT_LOADERS[def.key] ?? placeholderLoader;

    registerProfileSectionModule({
      kind: "family",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `family:${def.key}`,
      },
      componentLoader,
    });
  }
}
