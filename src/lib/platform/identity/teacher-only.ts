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
 * records, finance, accounting, reporting, user management, system admin, HR,
 * payroll, banking, audit, form builder, JAG or JAG-org — is somebody else,
 * whatever else they also do, and keeps the full dashboard. Founder and
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

/**
 * Holding any of these means this person is not a teacher-only user.
 *
 * THIS LIST WAS NINE GATES LONG AND THE CATALOGUE HAS EIGHTEEN. Checked
 * against production on 2 October: the rule did not examine HR, payroll,
 * banking, audit, form builder, JAG or JAG-org. So somebody who taught AND
 * did HR would have been locked to one page and lost the rest of their work
 * with no error and no way to ask for it back — the same shape as every other
 * fault this fortnight, where the system knows and no person is told.
 *
 * Nobody held that combination on the day it was found, so this closes a gap
 * rather than fixing a broken person. That is the right time to do it: the
 * query that proved it empty is `who_the_one_page_rule_actually_catches.sql`,
 * and it will not stay empty for ever.
 *
 * ACADEMYOS_ACCESS IS LEFT OUT ON PURPOSE, and it is the one somebody will
 * try to add. TEAM_MEMBER is the default role every provisioned user gets and
 * it grants exactly that gate. Count it and nobody is ever teacher-only, and
 * this whole module quietly becomes a no-op. Renee Tracewell already carries
 * TEAM_MEMBER and must still see one page.
 */
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
  // Added 2 October, after counting the catalogue rather than trusting the list.
  "HR_ACCESS",
  "PAYROLL_ACCESS",
  "BANKING_ACCESS",
  "AUDIT_ACCESS",
  "FORM_BUILDER_ACCESS",
  "JAG_ACCESS",
  "JAG_ORG_ACCESS",
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
 * THE QUERY STRING IS NOT THE REASON FOR startsWith, though the first
 * version of this comment said it was. `x-pathname` is set in middleware.ts
 * from req.nextUrl.pathname, which excludes ?week=2026-09-28 entirely - so a
 * teacher moving between weeks already matches on equality alone.
 *
 * startsWith is here for anything nested BELOW the week page, should one ever
 * be added. It tests `${HOME}/` and not HOME, so a sibling route whose name
 * merely begins the same way - /dashboard/teacher/weekly-report - is still
 * correctly refused.
 */
export function isTeacherOnlyHome(pathname: string): boolean {
  return pathname === TEACHER_ONLY_HOME || pathname.startsWith(`${TEACHER_ONLY_HOME}/`);
}
