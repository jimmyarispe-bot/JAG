import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { currentWeekStart, mondayOf } from "@/lib/finance/teacher-week";
import {
  getTimesheetWeekSummary,
  getWeeksAwaitingReview,
} from "@/lib/finance/timesheet-review";
import { ReviewWeekButtons } from "@/components/finance/ReviewWeekButtons";

export const metadata = {
  title: "Timesheets",
  description: "Every teacher's week, what it pays, and who has not sent one",
};

export const dynamic = "force-dynamic";

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const addDays = (iso: string, days: number) =>
  new Date(new Date(`${iso}T12:00:00Z`).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

/**
 * The date under the day.
 *
 * Jimmy, 26 September 2026: "moving forward i need the dates below the day of
 * week/time". "Mon 8:00 AM" is enough to read a week; it is not enough to
 * reconcile one against a bank statement six weeks later, or to answer a
 * teacher asking which Monday a class was missed from.
 */
const classDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const pretty = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  });

/**
 * The week, across everybody.
 *
 * WHO HAS NOT SENT ONE IS THE FIRST THING ON THE PAGE. A list of the weeks
 * that arrived tells you what you are about to pay; it says nothing about the
 * teacher who taught fifteen classes and went quiet, and she is the one who
 * ends up unpaid. The absences are computed from the schedule, because a
 * screen that can only show what is there will never show what is not.
 *
 * The route is guarded by requireFinanceAccess() in the finance layout, so the
 * guard is the money rule: Danni and Jimmy, nobody else.
 */
export default async function FinanceTimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekStart = weekParam ? mondayOf(weekParam) : currentWeekStart();
  const weekEnd = addDays(weekStart, 4);

  const supabase = await createAuthClient();
  const [{ summary, unavailable: summaryError }, { weeks, unavailable: weeksError }] =
    await Promise.all([
      getTimesheetWeekSummary(supabase, weekStart, weekEnd),
      getWeeksAwaitingReview(supabase, { includeReviewed: true }),
    ]);

  const thisWeek = weeks.filter((w) => w.weekStart === weekStart);
  const error = summaryError ?? weeksError;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Timesheets</h1>
          <p className="mt-1 text-slate-600">
            {pretty(weekStart)} – {pretty(weekEnd)}. Every teacher&apos;s week, what it pays,
            and who has not sent one.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/dashboard/finance/timesheets?week=${addDays(weekStart, -7)}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            ← Previous
          </Link>
          <Link
            href={`/dashboard/finance/timesheets?week=${addDays(weekStart, 7)}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-5">
            <div>
              <p className="text-slate-500">Submitted</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.submittedCount}</p>
            </div>
            <div>
              <p className="text-slate-500">Waiting on you</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.awaitingCount}</p>
            </div>
            <div>
              <p className="text-slate-500">Approved</p>
              <p className="text-2xl font-semibold text-emerald-700">{summary.approvedCount}</p>
            </div>
            <div>
              <p className="text-slate-500">Not approved</p>
              <p className="text-2xl font-semibold text-amber-700">
                {summary.notApprovedCount}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Week total</p>
              <p className="text-2xl font-semibold text-slate-900">{money(summary.grossTotal)}</p>
              <p className="text-xs text-slate-400">
                {money(summary.approvedTotal)} approved
              </p>
            </div>
          </div>

          {/*
            * THE ABSENCES, BEFORE THE ARRIVALS. A teacher who taught and did
            * not submit is the only person on this page at risk of not being
            * paid, so she is not buried underneath the ones who did.
            */}
          {summary.notSubmitted.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">
                {summary.notSubmitted.length} taught this week and have not submitted
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {summary.notSubmitted.map((t) => (
                  <li key={t.employeeId}>
                    {t.teacherName}
                    <span className="text-amber-700"> — {t.scheduledClasses} classes</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
              Everybody who taught this week has submitted.
            </div>
          )}
        </>
      ) : null}

      {thisWeek.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
          No timesheets have been submitted for this week yet.
        </div>
      ) : (
        <div className="space-y-4">
          {thisWeek.map((w) => (
            <section
              key={`${w.employeeId}:${w.weekStart}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{w.teacherName}</h2>
                  <p className="text-xs text-slate-500">
                    {w.sessionCount} taught
                    {w.unheldCount > 0 ? `, ${w.unheldCount} not taught` : ""} ·{" "}
                    {money(w.gross)}
                  </p>
                </div>
                <ReviewWeekButtons
                  employeeId={w.employeeId}
                  weekStart={w.weekStart}
                  teacherName={w.teacherName}
                  status={w.status}
                />
              </header>

              {w.teacherNote ? (
                <div className="border-b border-slate-100 bg-white px-5 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Anything cooky Jimmy needs to know
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{w.teacherNote}</p>
                </div>
              ) : null}

              {w.reviewNote ? (
                <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-3">
                  <p className="text-xs font-medium text-amber-800">Your comment</p>
                  <p className="mt-0.5 text-sm text-amber-900">{w.reviewNote}</p>
                </div>
              ) : null}

              {w.classes.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">
                  No priced classes found for this week. The figure above is what she submitted.
                </p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {w.classes.map((c) => (
                      <tr key={c.sessionId} className="align-top">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                          <div>
                            {c.day} {c.startsEt}
                          </div>
                          <div className="text-xs text-slate-400">{classDay(c.classDate)}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-900">
                            {c.courseName}
                            {c.isGuest ? (
                              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-normal text-slate-600">
                                covered
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-400">{c.sectionCode}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {c.studentCount === 0 ? (
                            <span className="text-slate-400">no students</span>
                          ) : (
                            <>
                              <div>{c.studentCount} on roster</div>
                              <div className="text-xs text-slate-400">
                                {c.studentNames.join(", ")}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                          {money(c.gross)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
