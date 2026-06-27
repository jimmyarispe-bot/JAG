import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import { FAMILY_PROFILE_SECTIONS } from "@/lib/families/profile/sections";

const SECTION_VERSION = "1.0.0";

const placeholderLoader = (): Promise<ProfileSectionComponent> =>
  import("@/components/families/profile/sections/RegistryPlaceholderSections").then(
    (module) => module.FamilyRegistrySection
  );

/** Register family profile section modules (registry placeholders until Phase 3 UI). */
export function registerFamilyProfileSectionModules(): void {
  for (const def of FAMILY_PROFILE_SECTIONS) {
    registerProfileSectionModule({
      kind: "family",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `family:${def.key}`,
      },
      componentLoader: placeholderLoader,
    });
  }
}
