import { registerProfileKind, registerProfileSection } from "@/lib/platform/profile/registry";
import { STUDENT_PROFILE_KIND } from "@/lib/students/profile/kind";
import { STUDENT_PROFILE_SECTIONS } from "@/lib/students/profile/sections";

/** Register the Student profile kind — first implementation of the platform profile framework. */
export function registerStudentProfile(): void {
  registerProfileKind(STUDENT_PROFILE_KIND);
  for (const section of STUDENT_PROFILE_SECTIONS) {
    registerProfileSection("student", section);
  }
}

registerStudentProfile();
