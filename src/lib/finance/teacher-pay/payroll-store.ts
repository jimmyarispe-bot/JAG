import type { createAuthClient } from "@/lib/supabase/server-auth";
import { payrollWeek, type PayrollWeek } from "@/lib/finance/teacher-pay/week-view";
import { loadTeacherWeek, namesByEmployeeId } from "@/lib/finance/teacher-pay/week-store";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * The payroll for one week — items 21 to 23.
 *
 * THIS IS THE CONTROL, NOT A REPORT. Under the new model a teacher chooses
 * the class, the hour and the roster that together set their own pay, and
 * there is no prebuilt schedule to check any of it against. The spec says so
 * plainly: "Jimmy's review view IS the control." Two things follow, and both
 * are design constraints rather than preferences — the week must be scannable
 * in seconds, and nothing should be payable until it has been through here.
 */

/**
 * May the caller see every teacher's pay?
 *
 * ASKED OF THE DATABASE, NOT RE-DECIDED HERE. may_read_all_teacher_pay() is
 * the same function every policy in migration 462 calls, so this page and the
 * rows it reads cannot disagree about who is allowed. A second copy of the
 * rule in TypeScript is a second place for it to drift, and the drift would
 * show up as an empty screen rather than as an error.
 */
export async function mayReadPayroll(supabase: AuthClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("may_read_all_teacher_pay");
  if (error) return false;
  return data === true;
}

export interface PayrollLoad {
  readonly week: PayrollWeek;
  /** Set when the roll-up could not be built. The screen prints it, never a zero. */
  readonly unavailable: string | null;
  /** Teachers with no week row at all — they have logged nothing. */
  readonly notStarted: readonly string[];
}

/**
 * Every teacher's week, priced and rolled up.
 *
 * A TEACHER WHO HAS LOGGED NOTHING IS NOT ABSENT FROM THIS SCREEN. They are
 * listed separately, by name. A payroll screen that simply omits them reads
 * as "everybody is accounted for" on the week somebody forgot — which is the
 * one week it most needs to be loud.
 */
export async function loadPayrollWeek(
  supabase: AuthClient,
  weekStart: string
): Promise<PayrollLoad> {
  const empty = (unavailable: string | null): PayrollLoad => ({
    week: payrollWeek({ weekStart, teachers: [] }),
    unavailable,
    notStarted: [],
  });

  /* Who could have a week. Names come from namesByEmployeeId, which asks
     employee_profiles and then users - the embed this first used returned
     nothing and printed thirteen uuids at Jimmy. */
  const { data: staff, error: staffError } = await supabase
    .from("employees")
    .select("id")
    .eq("employment_status", "active");

  if (staffError) return empty(`Could not read the staff list: ${staffError.message}`);

  const staffIds = ((staff ?? []) as { id: string }[]).map((r) => String(r.id));
  const nameById = await namesByEmployeeId(supabase, staffIds);

  /* Which of them have opened this week. RLS decides what comes back: for
     anyone but Jimmy and Danni that is their own row or nothing. */
  const { data: weekRows, error: weekError } = await supabase
    .from("teacher_weeks")
    .select("employee_id")
    .eq("week_start", weekStart);

  if (weekError) return empty(`Could not read the weeks: ${weekError.message}`);

  const withWeeks = [
    ...new Set(((weekRows ?? []) as { employee_id: string }[]).map((r) => String(r.employee_id))),
  ];

  /* One assembled week each, in parallel. Thirteen teachers is thirteen small
     reads rather than one query nobody can follow. */
  const loaded = await Promise.all(
    withWeeks.map(async (employeeId) => ({
      employeeId,
      teacherName: nameById.get(employeeId) ?? `employee ${employeeId.slice(0, 8)}`,
      week: (await loadTeacherWeek(supabase, employeeId, weekStart)).view,
    }))
  );

  const notStarted = [...nameById.entries()]
    .filter(([id]) => !withWeeks.includes(id))
    .map(([, name]) => name)
    .sort((a, b) => a.localeCompare(b));

  return {
    week: payrollWeek({ weekStart, teachers: loaded }),
    unavailable: null,
    notStarted,
  };
}
