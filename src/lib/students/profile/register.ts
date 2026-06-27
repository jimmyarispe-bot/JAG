import { registerProfileKind } from "@/lib/platform/profile/registry";
import { STUDENT_PROFILE_KIND } from "@/lib/students/profile/kind";
import { registerStudentProfileSectionModules } from "@/lib/students/profile/sections/register-modules";

/** Register the Student profile kind and all section modules. */
export function registerStudentProfile(): void {
  registerProfileKind(STUDENT_PROFILE_KIND);
  registerStudentProfileSectionModules();
}

registerStudentProfile();
