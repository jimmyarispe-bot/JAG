import { registerProfileKind } from "@/lib/platform/profile/registry";
import { EMPLOYEE_PROFILE_KIND } from "@/lib/employees/profile/kind";
import { registerEmployeeProfileSectionModules } from "@/lib/employees/profile/sections/register-modules";

/** Register the Employee profile kind and all section modules. */
export function registerEmployeeProfile(): void {
  registerProfileKind(EMPLOYEE_PROFILE_KIND);
  registerEmployeeProfileSectionModules();
}

registerEmployeeProfile();
