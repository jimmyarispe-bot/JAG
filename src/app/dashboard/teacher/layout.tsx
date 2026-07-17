import { requirePagePermission } from "@/lib/platform/identity/page-guard";

/**
 * A.1 — Teacher workspace requires teacher.* permissions (not hr/students/ai bypass).
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "teacher.view",
    "teacher.manage",
    "teacher.attendance",
    "TEACHER_ACCESS",
  ]);
  return children;
}
