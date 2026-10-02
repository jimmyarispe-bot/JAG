import { redirect } from "next/navigation";
import { requireTeacherWeekContext } from "@/lib/finance/teacher-pay/access";
import {
  currentWeekStart,
  reachableWeeks,
  weekIsReachable,
  listColleagues,
  listCourseOptions,
  hourlyRateKeysFor,
  listStudentOptions,
  loadTeacherWeek,
  mondayOf,
  addDays,
  RATE_BY_KEY,
  START_HOURS,
} from "@/lib/finance/teacher-pay/week-store";
import { TeacherWeekScreen } from "@/components/teacher/week/TeacherWeekScreen";

export const metadata = {
  title: "My week",
  description: "Log the classes you taught, who was scheduled, and submit by Friday",
};

export const dynamic = "force-dynamic";

/**
 * The week a teacher logs — the model Jimmy specified on 29 September.
 *
 * WHAT CHANGED FROM THE SCREEN THIS REPLACES. The old one read a 41-slot
 * schedule and asked a teacher to confirm what the platform already believed.
 * This one asks what actually happened: any class, any day, any hour from
 * 7am to 11pm, scheduled or guest, with the roster chosen rather than
 * inherited. Pay follows students SCHEDULED, so an absence is recorded and
 * costs the teacher nothing.
 *
 * THE CONTROL IS NOT ON THIS PAGE. Because a teacher chooses both the class
 * and the roster that sets their own pay, nothing here can be checked against
 * a plan — there is no plan. Jimmy's payroll view is the control, and the
 * spec says so: items 21 to 23 exist for exactly this reason.
 *
 * IT RENDERS EVEN WHEN IT CANNOT HELP. A teacher with no staff record gets a
 * sentence and no redirect. Once teachers are pinned to one page, bouncing
 * them off it leaves them nowhere.
 */
export default async function TeacherWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const ctx = await requireTeacherWeekContext();
  const { week: weekParam } = await searchParams;
  /*
   * THIS WEEK AND LAST WEEK. Anything else corrects the URL rather than
   * showing a different week under the address the teacher typed.
   */
  const { thisWeek, lastWeek } = reachableWeeks();
  const requested = weekParam ? mondayOf(weekParam) : thisWeek;
  if (!weekIsReachable(requested)) redirect("/dashboard/teacher/week");
  const weekStart = requested;

  if ("error" in ctx) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My week</h1>
          <p className="mt-1 text-slate-600">
            Where you log the classes you taught and what they pay.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">This cannot open yet</p>
          <p className="mt-1">{ctx.error}</p>
        </div>
      </div>
    );
  }

  /* Five reads, in parallel. The pickers do not depend on the week and the
     week does not depend on them. */
  const [loaded, courseRes, studentRes, colleagues, hourlyKeys] = await Promise.all([
    loadTeacherWeek(ctx.supabase, ctx.employeeId, weekStart),
    listCourseOptions(ctx.supabase, ctx.employeeId),
    listStudentOptions(ctx.supabase),
    listColleagues(ctx.supabase, ctx.employeeId),
    hourlyRateKeysFor(ctx.supabase, ctx.employeeId),
  ]);

  /*
   * A SHORT LIST IS WORSE THAN AN ERROR, so both are carried to the screen
   * and neither is swallowed. On 21 September a roster of four showed as
   * nothing because the list was quietly scoped; a teacher who cannot see a
   * child cannot schedule them, and the class then prices low with nothing
   * saying why.
   */
  const courses = "courses" in courseRes ? courseRes.courses : [];
  const students = "students" in studentRes ? studentRes.students : [];
  const pickerProblems = [
    "error" in courseRes ? courseRes.error : null,
    "error" in studentRes ? studentRes.error : null,
    courses.length === 0 && !("error" in courseRes)
      ? "No classes are available to choose from. That is not right — tell Jimmy before you submit."
      : null,
    students.length === 0 && !("error" in studentRes)
      ? "No students are available to choose from. That is not right — tell Jimmy before you submit."
      : null,
  ].filter((v): v is string => Boolean(v));

  /* Only somebody who already holds one sees an hourly line. See
     hourlyRateKeysFor() for why that is a smaller door and not a guard. */

  return (
    <TeacherWeekScreen
      weekStart={weekStart}
      previousWeek={weekStart === thisWeek ? lastWeek : null}
      nextWeek={weekStart === lastWeek ? thisWeek : null}
      view={loaded.view}
      unavailable={loaded.unavailable}
      courses={courses}
      students={students}
      colleagues={colleagues}
      startHours={START_HOURS}
      hourlyRates={hourlyKeys.map((key) => ({
        key,
        label: RATE_BY_KEY[key].label,
        cents: RATE_BY_KEY[key].cents,
        weeklyHourCap: RATE_BY_KEY[key].weeklyHourCap,
      }))}
      pickerProblems={pickerProblems}
      teacherName={ctx.fullName}
    />
  );
}
