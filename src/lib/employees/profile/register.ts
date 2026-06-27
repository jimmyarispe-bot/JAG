import { registerProfileKind, registerProfileSection } from "@/lib/platform/profile/registry";
import { EMPLOYEE_PROFILE_KIND } from "@/lib/employees/profile/kind";
import { EMPLOYEE_PROFILE_SECTIONS } from "@/lib/employees/profile/sections";

/** Register the Employee profile kind and all section definitions. */
export function registerEmployeeProfile(): void {
  registerProfileKind(EMPLOYEE_PROFILE_KIND);
  for (const definition of EMPLOYEE_PROFILE_SECTIONS) {
    registerProfileSection("employee", definition);
  }
}

registerEmployeeProfile();
