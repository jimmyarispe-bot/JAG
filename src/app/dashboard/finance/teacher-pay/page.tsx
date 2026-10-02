import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { loadPayrollWeek, mayReadPayroll } from "@/lib/finance/teacher-pay/payroll-store";
import {
  addDays,
  currentWeekStart,
  mondayOf,
} from "@/lib/finance/teacher-pay/week-store";
import { usd } from "@/lib/finance/teacher-pay/week-view";
import { PayrollWeekControls } from "@/components/finance/teacher-pay/PayrollWeekControls";

export const metadata = {
  title: "Teacher pay",
  description: "Every teacher's week, with what each one is owed",
};

export const dynamic = "force-dynamic";

function prettyDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  });
}

function prettyHour(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00${h < 12 ? "am" : "pm"}`;
}

/**
 * What Jimmy reads — spec items 21 to 23.
 *
 * SORTED LARGEST FIRST, and that is the whole design. This roll-up is the
 * only control on a model where the teacher sets their own roster, so an
 * alphabetical list would bury the week that is twice everyone else's on line
 * nine. Descending puts it on line one. That is the difference between a
 * control and a report, and week-view.ts sorts it there rather than here so
 * the rule is tested.
 *
 * IT IS ALSO HOW JIMMY INSPECTS A WEEK WITHOUT BEING A TEACHER. He has no
 * employee record and should not have one — creating a person to look at a
 * screen puts him in the staff list and, once pay runs, potentially in a pay
 * run. Item 22 asks for each class, scheduled or guest, students scheduled
 * and absent, so the detail is here rather than reachable only by pretending.
 */
export default async function TeacherPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const identity = await getIdentityContext();
  const { week: weekParam } = await searchParams;
  const weekStart = weekParam ? mondayOf(weekParam) : currentWeekStart();

  if (!identity) {
    return (
      <Shell weekStart={weekStart}>
        <Amber title="You are signed out">Sign in again to read the payroll.</Amber>
      </Shell>
    );
  }

  const supabase = await createAuthClient();

  /*
   * ASKED, NOT ASSUMED. The same function the row-level policies call. A
   * school leader who reaches this URL gets a sentence rather than an empty
   * table, because an empty table reads as "nobody is owed anything" - the
   * most misleading thing this page could say.
   */
  if (!(await mayReadPayroll(supabase))) {
    return (
      <Shell weekStart={weekStart}>
        <Amber title="This one is not yours">
          Teacher pay is visible to Jimmy and Danni only. Nothing is broken and there is nothing
          to do — this page simply is not part of your work.
        </Amber>
      </Shell>
    );
  }

  const { week, unavailable, notStarted } = await loadPayrollWeek(supabase, weekStart);

  return (
    <Shell weekStart={weekStart}>
      {unavailable ? <Amber title="This week could not be read">{unavailable}</Amber> : null}

      {/* The three numbers, split AV and HS — item 23. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Figure label="The week" value={usd(week.totalCents)} big />
        <Figure label="The Academy Virtual" value={usd(week.virtualCents)} />
        <Figure label="The Academy HS" value={usd(week.hsCents)} />
      </div>

      {/* Nothing should be paid on a week nobody has submitted. */}
      {week.openCount > 0 ? (
        <Amber title={`${week.openCount} ${week.openCount === 1 ? "week is" : "weeks are"} still open`}>
          An open week has not been submitted by the teacher and is not finished. The totals above
          include them, so that the figure is never quietly short — but nothing here should be paid
          until it has been submitted.
        </Amber>
      ) : null}

      {week.withProblems.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-semibold">Something could not be priced</p>
          <p className="mt-0.5">{week.withProblems.join(", ")}. Open the week to see why.</p>
        </div>
      ) : null}

      {notStarted.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">
            {notStarted.length} {notStarted.length === 1 ? "person has" : "people have"} logged
            nothing this week
          </p>
          <p className="mt-0.5">{notStarted.join(", ")}.</p>
          <p className="mt-1 text-xs text-slate-500">
            Named rather than left out. A payroll screen that omits them reads as everybody being
            accounted for on exactly the week somebody forgot.
          </p>
        </div>
      ) : null}

      {week.teachers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Nobody has logged a class for this week yet.
        </div>
      ) : (
        <div className="space-y-3">
          {week.teachers.map((t) => (
            <details
              key={t.employeeId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0">
                  <span className="font-semibold text-slate-900">{t.teacherName}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {t.classCount} {t.classCount === 1 ? "class" : "classes"}
                    {t.guestCount > 0 ? ` · ${t.guestCount} as guest` : ""} ·{" "}
                    {t.studentsScheduled} scheduled
                    {t.studentsAbsent > 0 ? ` · ${t.studentsAbsent} absent` : ""}
                  </span>
                  {t.status === "open" ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                      still open
                    </span>
                  ) : null}
                  {t.status === "approved" ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      approved
                    </span>
                  ) : null}
                  {t.problems.length > 0 ? (
                    <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-800">
                      cannot be priced
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap text-right">
                  <span className="text-lg font-semibold text-slate-900">{usd(t.totalCents)}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {usd(t.virtualCents)} AV · {usd(t.hsCents)} HS
                  </span>
                </span>
              </summary>

              <div className="border-t border-slate-100 px-5 py-3">
                {t.kookyNote ? (
                  <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="font-medium">She told you:</span> {t.kookyNote}
                  </p>
                ) : null}

                {t.lines.length === 0 ? (
                  <p className="text-sm text-slate-500">No classes on this week.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-1 pr-3 font-medium">Day</th>
                        <th className="pb-1 pr-3 font-medium">Class</th>
                        <th className="pb-1 pr-3 font-medium">Campus</th>
                        <th className="pb-1 pr-3 font-medium">Kind</th>
                        <th className="pb-1 pr-3 text-right font-medium">Scheduled</th>
                        <th className="pb-1 pr-3 text-right font-medium">Absent</th>
                        <th className="pb-1 text-right font-medium">Pays</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {t.lines.map((l) => (
                        <tr key={l.entryId} className="align-top">
                          <td className="py-1.5 pr-3 whitespace-nowrap text-slate-500">
                            {prettyDate(l.classDate)} {prettyHour(l.startTimeEt)}
                          </td>
                          <td className="py-1.5 pr-3 text-slate-900">{l.courseName}</td>
                          <td className="py-1.5 pr-3 text-slate-500">
                            {l.campus === "hs" ? "HS" : "Virtual"}
                          </td>
                          <td className="py-1.5 pr-3 text-slate-500">
                            {l.kind}
                            {l.guestForName ? ` for ${l.guestForName}` : ""}
                          </td>
                          <td className="py-1.5 pr-3 text-right text-slate-900">{l.scheduled}</td>
                          <td className="py-1.5 pr-3 text-right text-slate-500">{l.absent}</td>
                          <td className="py-1.5 text-right font-medium text-slate-900">
                            {l.problem ? (
                              <span className="text-rose-700">{l.problem}</span>
                            ) : (
                              usd(l.cents)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <PayrollWeekControls
                  employeeId={t.employeeId}
                  weekId={t.weekId}
                  weekStart={weekStart}
                  status={t.status}
                  totalCents={t.totalCents}
                  hasProblems={t.problems.length > 0}
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ weekStart, children }: { weekStart: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher pay</h1>
          <p className="mt-1 text-slate-600">
            Week of {prettyDate(weekStart)}. Largest first, so an unusual week is the first thing
            you read rather than the ninth.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/dashboard/finance/teacher-pay?week=${mondayOf(addDays(weekStart, -7))}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Previous week
          </Link>
          <Link
            href={`/dashboard/finance/teacher-pay?week=${mondayOf(addDays(weekStart, 7))}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Next week →
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function Figure({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="m-0 text-sm text-slate-500">{label}</p>
      <p className={`m-0 font-semibold text-slate-900 ${big ? "text-3xl" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function Amber({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}
