/**
 * A teacher sees one page, and no way to anywhere else.
 *
 * Jimmy, 2 October 2026: "i don't want teacher to have any button on the left
 * right or any sidebar. i want them to be taken straight to this page and
 * have no option or ability to go to or choose any other page or function in
 * the jag. only this."
 *
 * WHAT A TEACHER COULD REACH BEFORE THIS. Eleven tabs of their own — Home, My
 * Classes, Attendance, Progress, Lesson Planning, AI Assistant, Parent Comms,
 * Documents, Timesheets, Resources, Profile — plus whatever the sidebar
 * showed, plus /dashboard/teacher/executive, which opens on
 * `instruction.executive`, a permission every teacher holds through the
 * TEACHER_ACCESS group.
 *
 * TWO JOBS, AND BOTH ARE NEEDED. Hiding a link is not preventing a visit: the
 * pages still answer if somebody types the URL. So this module is used twice
 * in the dashboard layout — once to decide what chrome to render, and once to
 * send a teacher back to their own page if they ask for any other. The
 * page-level permission guards underneath stay exactly as they are.
 *
 * WHO COUNTS AS A TEACHER. The TEACHER role holds exactly one gate,
 * TEACHER_ACCESS. Anybody carrying a second gate — admissions, student
 * records, finance, reporting, user management, system admin — is somebody
 * else, whatever else they also do, and keeps the full dashboard. Founder and
 * Executive Director resolve every permission in the catalogue, so they hold
 * those gates too and are excluded by the same rule rather than by a special
 * case.
 *
 * ERRING TOWARDS THE FULL DASHBOARD. If the permission list arrives empty or
 * unreadable, this returns false and the person sees everything they saw
 * before. The opposite default would lock somebody out of their own work
 * because a read failed, and a locked-out School Leader cannot even reach the
 * screen that would tell her why.
 */

/** The one page. Everything else under /dashboard sends a teacher here. */
export const TEACHER_ONLY_HOME = "/dashboard/teacher/week";

/** Holding any of these means this person is not a teacher-only user. */
const OTHER_GATES = [
  "ADMISSIONS_ACCESS",
  "SIS_ACCESS",
  "FINANCE_ACCESS",
  "ACCOUNTING_ACCESS",
  "REPORTING_ACCESS",
  "USER_MANAGEMENT_ACCESS",
  "SYSTEM_ADMIN_ACCESS",
  "PARENT_ACCESS",
  "STUDENT_ACCESS",
] as const;

export function isTeacherOnly(permissions: readonly string[] | null | undefined): boolean {
  if (!permissions || permissions.length === 0) return false;

  const held = new Set(permissions);
  if (!held.has("TEACHER_ACCESS")) return false;

  return !OTHER_GATES.some((gate) => held.has(gate));
}

/**
 * Is this path the teacher's own page?
 *
 * startsWith rather than equality, so the week query string
 * (?week=2026-09-28) and anything nested below it still count as home. A
 * teacher moving between weeks is not trying to leave.
 */
export function isTeacherOnlyHome(pathname: string): boolean {
  return pathname === TEACHER_ONLY_HOME || pathname.startsWith(`${TEACHER_ONLY_HOME}/`);
}
