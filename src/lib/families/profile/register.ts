import { registerProfileKind } from "@/lib/platform/profile/registry";
import { FAMILY_PROFILE_KIND } from "@/lib/families/profile/kind";
import { registerFamilyProfileSectionModules } from "@/lib/families/profile/sections/register-modules";

/** Register the Family profile kind and all section modules. */
export function registerFamilyProfile(): void {
  registerProfileKind(FAMILY_PROFILE_KIND);
  registerFamilyProfileSectionModules();
}

registerFamilyProfile();
