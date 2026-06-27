import { registerProfileKind } from "@/lib/platform/profile/registry";
import { ADMISSIONS_CASE_PROFILE_KIND } from "@/lib/admissions/profile/kind";
import { registerAdmissionsCaseProfileSectionModules } from "@/lib/admissions/profile/sections/register-modules";

/** Register the Admissions Case profile kind and all section modules. */
export function registerAdmissionsCaseProfile(): void {
  registerProfileKind(ADMISSIONS_CASE_PROFILE_KIND);
  registerAdmissionsCaseProfileSectionModules();
}

registerAdmissionsCaseProfile();
