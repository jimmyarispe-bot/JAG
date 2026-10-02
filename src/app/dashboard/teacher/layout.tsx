import { headers } from "next/headers";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { isTeacherOnly, isTeacherOnlyHome } from "@/lib/platform/identity/teacher-only";
import { TeacherWorkspaceNav } from "@/components/teacher/experience/TeacherWorkspaceNav";

/**
 * A.1 — Teacher workspace requires teacher.* permissions (not hr/students/ai bypass).
 * Wave 1.4 — experience nav over existing teacher services.
 *
 * THE ELEVEN TABS ARE GONE FOR A TEACHER. Home, My Classes, Attendance,
 * Progress, Lesson Planning, AI Assistant, Parent Comms, Documents,
 * Timesheets, Resources, Profile — Jimmy, 2 October: "no option or ability to
 * go to or choose any other page or function in the jag. only this."
 *
 * The nav still renders for everybody else, because Heather and Jimmy reach
 * these same pages and have reason to move between them. The teacher's own
 * page is the only one a teacher can open at all; the dashboard layout
 * redirects the rest.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "teacher.view",
    "teacher.manage",
    "teacher.attendance",
    "TEACHER_ACCESS",
  ]);

  const [ctx, headerStore] = await Promise.all([getIdentityContext(), headers()]);
  const pathname = headerStore.get("x-pathname") ?? "";
  const bare = isTeacherOnly(ctx?.permissions) && isTeacherOnlyHome(pathname);

  if (bare) return <>{children}</>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <TeacherWorkspaceNav />
      {children}
    </div>
  );
}
