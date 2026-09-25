import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { cn } from "@/components/workspace-design-system/utils";
import { AttendanceToggle } from "@/components/teacher/AttendanceToggle";
import { CoverAClassButton } from "@/components/teacher/CoverAClassButton";
import { ClassHeldToggle } from "@/components/teacher/ClassHeldToggle";
import { SubmitWeekButton } from "@/components/teacher/SubmitWeekButton";
import { GreatnessReportsPicker } from "@/components/teacher/GreatnessReportsPicker";
import {
  currentWeekStart,
  formatClassTime,
  getTeacherWeek,
  mondayOf,
  NETWORK_TIME_ZONE,
  WEEKLY_SUBMISSION_GO_LIVE,
} from "@/lib/finance/teacher-week";

export const metadata = {
  title: "My week",
  description: "Say which classes you taught, check the total, and submit by Friday",
};

export const dynamic = "force-dynamic";

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function prettyDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  });
}

/**
 * The week a teacher submits.
 *
 * REPLACES a screen that read from globalThis Maps - in memory, per serverless
 * instance, wiped on every cold start. Anything a teacher had ever typed into
 * the old Timesheets page was never anywhere.
 *
 * Nothing here is typed from memory: every class already exists in
 * instructional_sessions, so the week arrives prefilled and the teacher's job
 * is to confirm it, not to reconstruct it.
 */
export default async function TeacherTimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const ctx = await requireTeacherExperienceContext();
  const { week: weekParam } = await searchParams;

  /* Her own clock, not the database's. Falls back to the network's when she has
     not set one, which is almost everybody. */
  const viewerZone = ctx.identity.preferences?.timezone || NETWORK_TIME_ZONE;

  const weekStart = weekParam ? mondayOf(weekParam) : currentWeekStart();
  const week = await getTeacherWeek(ctx.supabase, ctx.employeeId, weekStart);

  const previous = mondayOf(
    new Date(new Date(`${weekStart}T12:00:00Z`).getTime() - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10)
  );
  const next = mondayOf(
    new Date(new Date(`${weekStart}T12:00:00Z`).getTime() + 7 * 86_400_000)
      .toISOString()
      .slice(0, 10)
  );

  /* Submitted, approved and not approved are all frozen. Only an open week is
     editable - a week Danni declined is still a week the teacher already
     signed, and it is amended rather than edited. */
  const submitted = week.status !== "open";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My week</h1>
          <p className="mt-1 text-slate-600">
            {prettyDate(week.weekStart)} – {prettyDate(week.weekEnd)}. Mark anything you did not
            hold, check the total, and submit by <strong>11:59pm Friday</strong> Eastern.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {previous >= WEEKLY_SUBMISSION_GO_LIVE ? (
            <Link
              href={`/dashboard/teacher/timesheets?week=${previous}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              ← Previous week
            </Link>
          ) : null}
          <Link
            href={`/dashboard/teacher/timesheets?week=${next}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Next week →
          </Link>
        </div>
      </div>

      {week.unavailable ? (
        /* The reason, never a zero. A week that reads "$0.00" because a read was
           refused looks exactly like a week with no work in it. */
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {week.unavailable}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-slate-500">Classes taught</p>
                <p className="text-2xl font-semibold text-slate-900">{week.classesHeld}</p>
              </div>
              <div>
                <p className="text-slate-500">Not taught</p>
                <p className="text-2xl font-semibold text-slate-500">{week.classesNotHeld}</p>
              </div>
              {/* Its own number, next to the classes rather than folded into
                  them - Jimmy: "indicated as a separate number on their pay
                  screen then added to their weekly total". Hidden in May and
                  December, when parent conferences happen instead. */}
              {week.greatness.applies && (week.greatness.claimed > 0 || !submitted) ? (
                <div>
                  <p className="text-slate-500">GREATNESS Reports</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {week.greatness.claimed}
                    <span className="ml-1.5 text-sm font-normal text-slate-500">
                      {money(week.greatness.gross)}
                    </span>
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-slate-500">{submitted ? "Submitted total" : "This week so far"}</p>
                <p className="text-2xl font-semibold text-slate-900">{money(week.gross)}</p>
              </div>
            </div>

            {submitted ? (
              <div className="space-y-2">
                {/*
                  * THREE STATES, NOT TWO. A submitted week is waiting; an
                  * approved week has been checked; a week that was not approved
                  * still goes to Jimmy - Danni's verdict is an annotation, not
                  * a blockage - but the teacher should see it said so, and why,
                  * rather than hearing about it later.
                  */}
                <div
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm",
                    week.status === "approved"
                      ? "bg-emerald-50 text-emerald-800"
                      : week.status === "not_approved"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-slate-100 text-slate-700"
                  )}
                >
                  <p className="font-semibold">
                    {week.status === "approved"
                      ? "Approved"
                      : week.status === "not_approved"
                        ? "Not approved — still sent to Jimmy"
                        : "Submitted — waiting to be checked"}
                  </p>
                  <p className="text-xs">
                    This figure is fixed. If something is wrong, file an amendment saying what
                    changed — the week itself does not reopen.
                  </p>
                  {week.reviewNote ? (
                    <p className="mt-1.5 text-xs">
                      <span className="font-medium">Comment:</span> {week.reviewNote}
                    </p>
                  ) : null}
                </div>

                {week.teacherNote ? (
                  <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                    <p className="text-xs font-medium text-slate-500">What you told Jimmy</p>
                    <p className="mt-0.5">{week.teacherNote}</p>
                  </div>
                ) : null}
              </div>
            ) : week.classesHeld > 0 ? (
              <SubmitWeekButton
                weekStart={week.weekStart}
                gross={week.gross}
                classes={week.classesHeld}
              />
            ) : null}
          </div>

          {!submitted && week.greatness.applies ? (
            <GreatnessReportsPicker
              weekStart={week.weekStart}
              claimed={week.greatness.claimed}
              max={week.greatness.max}
              distinctChildren={week.greatness.distinctChildren}
              claimedElsewhereThisMonth={week.greatness.claimedElsewhereThisMonth}
              ratePerReport={week.greatness.ratePerReport}
              gross={week.greatness.gross}
            />
          ) : null}

          {!submitted ? (
            <p className="px-1 text-sm text-slate-500">
              Every class you were scheduled to teach is already here. Each one counts as{" "}
              <strong>taught</strong> unless you say otherwise — if you were away, or it could
              not run, mark it <strong>did not teach</strong> and it drops out of the total.{" "}
              <strong>Tap a roster count to see which children it is.</strong> If a name is
              missing, or one is there who should not be, say so before you submit.
            </p>
          ) : null}

          {week.days.every((d) => d.classes.length === 0) ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No classes are scheduled for you this week. If you taught and nothing is here, say
              so before Friday rather than submitting an empty week.
            </div>
          ) : (
            <div className="space-y-4">
              {week.days.map((day) => (
                <section
                  key={day.date}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {day.label}{" "}
                      <span className="font-normal text-slate-500">{prettyDate(day.date)}</span>
                    </h2>
                    <span className="text-sm font-medium text-slate-600">{money(day.gross)}</span>
                  </header>

                  {day.classes.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-400">No classes.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {day.classes.map((c) => {
                          /*
                           * A CLASS NOBODY IS ON IS NOT A DECISION.
                           *
                           * 21 September 2026. Three Structured Literacy
                           * sections are scheduled 52 weeks out with nobody
                           * enrolled yet - 156 of the 2,137 forward classes.
                           * Left as they were, Renne Tracewell, Kim Hawkins
                           * and Holly Medlong would each be asked to rule on a
                           * class that pays nothing, every week, for a year.
                           *
                           * The schedule is NOT wrong and was deliberately not
                           * cancelled: the programme is real and simply has no
                           * children in it yet.
                           *
                           * An empty roster is also the correct answer on a
                           * Friday at or after 1pm, when campus children have
                           * gone home - see CAMPUS_FRIDAY_CUTOFF_ET. So the
                           * wording here says no students were on THIS class,
                           * which is true in both cases, rather than "nobody
                           * enrolled", which would be false on a Friday.
                           *
                           * Still shown, never hidden. A class that ran for
                           * nobody is worth seeing. It just does not ask a
                           * question it cannot pay for.
                           */
                          const empty = c.studentCount === 0;
                          return (
                          <tr
                            key={c.sessionId}
                            className={cn(
                              "align-top",
                              !c.held ? "bg-slate-50/60" : empty ? "bg-slate-50/40" : ""
                            )}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                              {formatClassTime(c.startsAtIso, viewerZone) || c.startsEt || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div
                                className={
                                  !c.held
                                    ? "text-slate-500 line-through"
                                    : empty
                                      ? "text-slate-400"
                                      : "font-medium text-slate-900"
                                }
                              >
                                {c.courseName}
                              </div>
                              {c.sectionCode ? (
                                <div className="text-xs text-slate-400">{c.sectionCode}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 align-top text-slate-600">
                              {/*
                                * A NUMBER A TEACHER CAN CHECK.
                                *
                                * 21 September 2026. This cell used to read
                                * "4 on roster" and stop there. On that day a
                                * roster of four was showing as nothing at all
                                * on 33 of 42 sections, and no teacher could
                                * have seen it - the count was the only thing
                                * on screen, and a wrong count looks exactly
                                * like a right one.
                                *
                                * Now it opens. Names, so she can compare the
                                * list against the children she actually
                                * teaches before she submits a figure built
                                * from it.
                                *
                                * A plain <details>: this is a server
                                * component, and expanding a list should not
                                * need JavaScript to arrive first.
                                */}
                              {c.coveredAway ? (
                                <span className="whitespace-nowrap text-slate-400">
                                  covered
                                </span>
                              ) : !c.held ? (
                                <span className="whitespace-nowrap">—</span>
                              ) : empty ? (
                                <span className="whitespace-nowrap text-slate-400">
                                  no students
                                </span>
                              ) : c.students.length > 0 ? (
                                <details>
                                  <summary className="cursor-pointer list-none whitespace-nowrap underline decoration-dotted underline-offset-4 hover:text-slate-900">
                                    {c.studentCount} on roster
                                  </summary>
                                  {/* Bounded, so the button stays beside the
                                      name. Left to fill the cell, an expanded
                                      roster throws every control to the far
                                      right and a teacher has to track across
                                      empty space to find the one she wants. */}
                                  <ul className="mt-2 max-w-[19rem] space-y-1.5 text-xs">
                                    {c.students.map((child) => (
                                      <li
                                        key={child.id}
                                        className="flex items-center justify-between gap-3"
                                      >
                                        <span
                                          className={
                                            child.present
                                              ? "text-slate-600"
                                              : "text-slate-400 line-through"
                                          }
                                        >
                                          {child.name || (
                                            /* The name lookup failed, the pay
                                               did not. Say so rather than show
                                               a blank line that reads as a
                                               missing child. */
                                            <span className="italic text-slate-400">
                                              name unavailable
                                            </span>
                                          )}
                                        </span>
                                        <AttendanceToggle
                                          sessionId={c.sessionId}
                                          studentId={child.id}
                                          studentName={child.name}
                                          present={child.present}
                                          disabled={submitted}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                  {/*
                                    * Said once, under the list, rather than on
                                    * every row. Absence is the exception and a
                                    * teacher should not have to confirm the
                                    * ordinary case fifteen times a week.
                                    */}
                                  <p className="mt-2 max-w-[19rem] text-[11px] leading-snug text-slate-400">
                                    Everyone counts as here unless you say
                                    otherwise. Marking a child absent does not
                                    change what this class pays.
                                  </p>
                                </details>
                              ) : (
                                <span className="whitespace-nowrap">
                                  {c.studentCount} on roster
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                              {c.coveredAway ? (
                                /* Somebody else taught it. It stays on her week
                                   so it does not vanish, and it pays her
                                   nothing. */
                                <span className="text-slate-400">covered by a colleague</span>
                              ) : c.unrated ? (
                                /* Held but unpriced. Named as a problem rather
                                   than counted as zero - a teacher should not
                                   discover this after submitting. */
                                <span className="text-rose-700">no agreed rate</span>
                              ) : !c.held ? (
                                <span className="text-slate-400">not paid</span>
                              ) : empty ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                money(c.gross)
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {c.coveredAway ? (
                                <span className="text-xs text-slate-400">not yours</span>
                              ) : empty && c.held ? (
                                <span className="text-xs text-slate-400">nothing to submit</span>
                              ) : (
                                <ClassHeldToggle
                                  sessionId={c.sessionId}
                                  held={c.held}
                                  courseName={c.courseName}
                                  disabled={submitted}
                                />
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {/* Rare, so it sits quietly under the day rather than taking
                      a column of its own on every row. */}
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <CoverAClassButton
                      date={day.date}
                      timeZone={viewerZone}
                      disabled={submitted}
                    />
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
