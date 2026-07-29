import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { TeacherWorkspaceNav } from "@/components/teacher/experience/TeacherWorkspaceNav";

/**
 * A.1 — Teacher workspace requires teacher.* permissions (not hr/students/ai bypass).
 * Wave 1.4 — experience nav over existing teacher services.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "teacher.view",
    "teacher.manage",
    "teacher.attendance",
    "TEACHER_ACCESS",
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <TeacherWorkspaceNav />
      {children}
    </div>
  );
}
