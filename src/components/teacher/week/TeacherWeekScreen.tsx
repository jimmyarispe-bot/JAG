"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addClassAction,
  copyRosterToMyOtherClassesAction,
  removeClassAction,
  saveKookyNoteAction,
  scheduleStudentAction,
  setAbsentAction,
  setExtraClaimAction,
  setHourlyClaimAction,
  setClassMissedAction,
  submitWeekAction,
  unscheduleStudentAction,
} from "@/lib/finance/teacher-pay/actions";
import { EXTRA_RULES, type ExtraKind } from "@/lib/finance/teacher-pay/rates";
import { usd, type PrimarySchool, type TeacherWeekView } from "@/lib/finance/teacher-pay/week-view";

/**
 * The teacher's week.
 *
 * EVERY FAILURE IS SAID OUT LOUD. Each action returns either success or a
 * sentence, and the sentence is rendered next to the thing that failed.
 * Row-level security refuses by changing nothing and reporting nothing, which
 * on a screen is indistinguishable from working - so a silent action is the
 * one outcome this component does not have.
 *
 * NOTHING HERE SENDS A NUMBER THAT IS MONEY. The teacher sends a course, a
 * campus, a day, an hour, a child, a count. Every figure on screen was
 * computed on the server from those.
 *
 * THE CAMPUS IS HERS TO SAY. Jimmy, 2 October: "no campus unless i specify".
 * A class is not a Virtual thing or an HS thing in this model - the SESSION
 * is. Craig teaches at HS, several teach at both, and the campus chosen here
 * is what splits the money on the payroll screen.
 */

interface CourseOption {
  courseId: string;
  name: string;
  baseCents: number;
  perAdditionalCents: number;
}
interface StudentOption {
  studentId: string;
  name: string;
  school: PrimarySchool | null;
}
interface ColleagueOption {
  employeeId: string;
  name: string;
}
interface HourlyRate {
  key: string;
  label: string;
  cents: number;
  weeklyHourCap: number | null;
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * The grid, in the order Jimmy named them: "categorized by the school they
 * attend fl, ga, av, hs". Shown AV first because most of the roll is there
 * and a teacher should not scroll past two empty columns to reach her own.
 */
const SCHOOL_GROUPS: { key: PrimarySchool | "none"; label: string }[] = [
  { key: "virtual", label: "AV" },
  { key: "hs", label: "HS" },
  { key: "fl", label: "FL" },
  { key: "ga", label: "GA" },
  { key: "none", label: "No school recorded" },
];

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  });
}

/** "14:00" as a person reads it. The duration is deliberately not shown. */
function prettyHour(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00${suffix}`;
}

export function TeacherWeekScreen(props: {
  weekStart: string;
  /** Null when there is nowhere to go that way, and no arrow is rendered. */
  previousWeek: string | null;
  nextWeek: string | null;
  view: TeacherWeekView;
  unavailable: string | null;
  courses: CourseOption[];
  students: StudentOption[];
  colleagues: ColleagueOption[];
  startHours: readonly string[];
  hourlyRates: HourlyRate[];
  pickerProblems: string[];
  teacherName: string;
}) {
  const { view, weekStart } = props;
  /*
   * CLOSED, NOT MERELY SUBMITTED. This read `=== "submitted"` until migration
   * 474 added an approved status. An approved week is further from editable
   * than a submitted one, and the old test would have called it open - so
   * this page would have offered Remove buttons and a student grid on a week
   * that is signed off and paid. Every server action behind those buttons
   * refuses, so nothing could have been changed; the fault would have been a
   * screen inviting work that could never save.
   */
  const submitted = view.status !== "open";
  const approved = view.status === "approved";
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [note, setNote] = useState(view.kookyNote ?? "");

  const run = (fn: () => Promise<{ success: true } | { error: string }>, okText?: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await fn();
      if ("error" in result) setNotice({ kind: "error", text: result.error });
      else if (okText) setNotice({ kind: "ok", text: okText });
    });
  };

  /*
   * ONE HANDLER, TWO BUTTONS.
   *
   * Jimmy, 8 October 2026: "submit buttons located at top n bottom". The
   * week is a long page - thirteen classes and a register under each one -
   * and the only Submit was at the foot of it.
   *
   * BOTH BUTTONS CALL THIS, and both are disabled by the same `pending`.
   * Two buttons wired to two copies of the same call is how a week gets
   * submitted twice: a teacher presses the top one, nothing visibly happens
   * because the page has not moved, she scrolls down and presses the other.
   * submitWeekAction would then run against a week already closed and
   * answer with an error about her own submission, which is a confusing way
   * to end a Friday.
   *
   * The note is read at press time rather than captured, so the top button
   * sends whatever she has typed at the bottom.
   */
  const submitWeek = () => run(() => submitWeekAction(weekStart, note));

  const days = useMemo(
    () =>
      DAY_LABELS.map((label, i) => {
        const date = addDays(weekStart, i);
        return { label, date, lines: view.lines.filter((l) => l.classDate === date) };
      }),
    [view.lines, weekStart]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My week</h1>
          <p className="mt-1 text-slate-600">
            {prettyDate(weekStart)} – {prettyDate(addDays(weekStart, 4))}. Log every class you
            taught, say who was scheduled, and submit by <strong>11:59pm Friday</strong> Eastern.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {props.previousWeek ? (
            <Link
              href={`/dashboard/teacher/week?week=${props.previousWeek}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              ← Last week
            </Link>
          ) : null}
          {props.nextWeek ? (
            <Link
              href={`/dashboard/teacher/week?week=${props.nextWeek}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              This week →
            </Link>
          ) : null}
        </div>
      </div>

      {props.unavailable ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {props.unavailable}
        </div>
      ) : null}

      {props.pickerProblems.map((p) => (
        <div
          key={p}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {p}
        </div>
      ))}

      {notice ? (
        <div
          className={
            notice.kind === "error"
              ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
              : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <Tile label="Classes" value={String(view.lines.length)} />
          <Tile label="Students scheduled" value={String(view.studentsScheduled)} />
          <Tile label="Marked absent" value={String(view.studentsAbsent)} muted />
          {view.guestCount > 0 ? (
            <Tile label="Guest teaching" value={String(view.guestCount)} />
          ) : null}
          {view.extrasCents > 0 ? <Tile label="Extras" value={usd(view.extrasCents)} /> : null}
          <Tile
            label={approved ? "Approved" : submitted ? "Submitted total" : "This week so far"}
            value={usd(view.totalCents)}
          />
        </div>

        {!submitted ? (
          /* The same button as the one at the foot of the page, and
             deliberately carrying the same total: a teacher who submits from
             the top should see the figure she is agreeing to without
             scrolling to find it. */
          <button
            type="button"
            disabled={pending}
            onClick={submitWeek}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Submitting…" : `Submit this week — ${usd(view.totalCents)}`}
          </button>
        ) : null}

        {submitted ? (
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            <p className="font-semibold">
              {approved ? "Approved" : "Submitted — waiting to be checked"}
            </p>
            <p className="text-xs">
              {approved
                ? "This week has been checked and the amount is settled. If something is wrong, tell Jimmy — he can reopen it."
                : "This week is closed. If something is wrong, tell Jimmy what needs correcting rather than changing it here."}
            </p>
          </div>
        ) : null}
      </div>

      {view.problems.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-semibold">Some of this week could not be priced</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {view.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!submitted ? (
        <AddClass
          weekStart={weekStart}
          courses={props.courses}
          colleagues={props.colleagues}
          startHours={props.startHours}
          disabled={pending}
          onDone={(r) => {
            if ("error" in r) setNotice({ kind: "error", text: r.error });
            else setNotice({ kind: "ok", text: "Class added. Now say who was scheduled." });
          }}
        />
      ) : null}

      {view.lines.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Nothing logged for this week yet. Add the first class you taught above.
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <section
              key={day.date}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <h2 className="text-sm font-semibold text-slate-900">
                  {day.label}{" "}
                  <span className="font-normal text-slate-500">{prettyDate(day.date)}</span>
                </h2>
                <span className="text-sm font-medium text-slate-600">
                  {usd(day.lines.reduce((n, l) => n + l.cents, 0))}
                </span>
              </header>

              {day.lines.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Nothing logged.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {day.lines.map((line) => (
                    <li key={line.entryId} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {line.courseName}{" "}
                            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium uppercase text-slate-500">
                              {line.campus === "hs" ? "HS" : "AV"}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {prettyHour(line.startTimeEt)} · {line.kind}
                            {line.guestForName ? ` for ${line.guestForName}` : ""}
                          </p>
                          {line.missed ? (
                            /* The row stays on her week at its real day and hour.
                               A gap nobody can see is a gap nobody can cover. */
                            <p className="mt-1 text-xs font-medium text-amber-800">
                              You were down for this and did not teach it. It pays
                              nothing and stays here so the gap is visible.
                              {line.missedNote ? ` — ${line.missedNote}` : ""}
                            </p>
                          ) : null}
                          {line.problem ? (
                            <p className="mt-1 text-xs font-medium text-rose-700">{line.problem}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <span
                            className={
                              line.missed
                                ? "text-sm font-medium text-slate-400 line-through"
                                : "text-sm font-medium text-slate-900"
                            }
                          >
                            {usd(line.cents)}
                          </span>
                          {!submitted ? (
                            /* Says what it will DO, not what the class is. A
                               button labelled "Missed" on a class she taught is
                               ambiguous at a glance on a Friday evening. */
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(
                                  () =>
                                    setClassMissedAction(
                                      weekStart,
                                      line.entryId,
                                      !line.missed
                                    ),
                                  line.missed
                                    ? "Marked as taught. It pays again."
                                    : "Marked as missed. It pays nothing."
                                )
                              }
                              className={
                                line.missed
                                  ? "rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                                  : "rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              }
                            >
                              {line.missed ? "I did teach this" : "I missed this"}
                            </button>
                          ) : null}
                          {!submitted ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(
                                  () => removeClassAction(weekStart, line.entryId),
                                  "Class removed."
                                )
                              }
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* The register is hidden on a missed class, not removed:
                          the children she marked stay on the row for whoever
                          covered it, but a teacher who was not there has no
                          business taking an attendance she did not see. */}
                      {line.missed ? null : (
                      <Roster
                        weekStart={weekStart}
                        entryId={line.entryId}
                        cents={line.cents}
                        roster={line.roster}
                        scheduled={line.scheduled}
                        absent={line.absent}
                        allStudents={props.students}
                        submitted={submitted}
                        pending={pending}
                        onRun={run}
                      />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {!submitted ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Anything else this week</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Leave anything you did not do at zero. The month rules are applied when it is saved —
            GREATNESS Reports are not claimable in December or May, conferences only in those two.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(Object.keys(EXTRA_RULES) as ExtraKind[]).map((kind) => (
              <ExtraRow
                key={kind}
                kind={kind}
                weekStart={weekStart}
                disabled={pending}
                onRun={run}
              />
            ))}
          </div>

          {props.hourlyRates.length > 0 ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Your hours</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {props.hourlyRates.map((rate) => (
                  <HourlyRow
                    key={rate.key}
                    rate={rate}
                    weekStart={weekStart}
                    disabled={pending}
                    onRun={run}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {!submitted ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Is there anything kooky that happened this past week that Jimmy needs to know about?
            </span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => run(() => saveKookyNoteAction(weekStart, note))}
              placeholder="Optional. Anything odd, anything you had to work around, anything above that does not look right."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Saved as you write it. Leave it empty if there is nothing.
            </span>
          </label>

          <button
            type="button"
            disabled={pending}
            onClick={submitWeek}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Submitting…" : `Submit this week — ${usd(view.totalCents)}`}
          </button>
          <p className="text-xs text-slate-400">
            This week closes when you submit it. Jimmy checks it and settles the amount —
            if anything is wrong before then, tell him rather than waiting.
          </p>
        </section>
      ) : view.kookyNote ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
          <p className="text-xs font-medium text-slate-500">What you told Jimmy</p>
          <p className="mt-0.5">{view.kookyNote}</p>
        </section>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Tile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="m-0 text-slate-500">{label}</p>
      <p className={`m-0 text-2xl font-semibold ${muted ? "text-slate-500" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function AddClass(props: {
  weekStart: string;
  courses: CourseOption[];
  colleagues: ColleagueOption[];
  startHours: readonly string[];
  disabled: boolean;
  onDone: (r: { success: true } | { error: string }) => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [campus, setCampus] = useState<"virtual" | "hs">("virtual");
  /*
   * TICKED DAYS, NOT ONE DAY. Peter Alouise, 2 October 2026: "It will only
   * let me select each class for one day at a time, not Monday-Friday."
   * Monday starts ticked because one day is still the common case.
   */
  const [dates, setDates] = useState<string[]>([props.weekStart]);
  const [hour, setHour] = useState("09:00");
  const [who, setWho] = useState("mine");
  const [busy, setBusy] = useState(false);

  const course = props.courses.find((c) => c.courseId === courseId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">Add a class you taught</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-500">Class</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Choose…</option>
            {props.courses.map((c) => (
              <option key={c.courseId} value={c.courseId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Hers to say, not the course's. See the note at the top of the file. */}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Campus</span>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value === "hs" ? "hs" : "virtual")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="virtual">The Academy Virtual</option>
            <option value="hs">The Academy HS</option>
          </select>
        </label>

        {/*
          * Tick boxes rather than a dropdown. Five days of the same class is
          * one submission, and each ticked day becomes its own class line -
          * so pay stays per class and a child can be absent on Wednesday
          * without touching Thursday.
          */}
        <fieldset className="block lg:col-span-2">
          <legend className="mb-1 block text-xs font-medium text-slate-500">
            Days you taught it
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => {
              const d = addDays(props.weekStart, i);
              const on = dates.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setDates((prev) =>
                      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    on
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  title={`${label} ${prettyDate(d)}`}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {dates.length === 0
              ? "Tick at least one day."
              : dates.length === 1
                ? prettyDate(dates[0])
                : `${dates.length} days, all at the same time. Each one is its own class.`}
          </p>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Start time</span>
          <select
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {props.startHours.map((h) => (
              <option key={h} value={h}>
                {prettyHour(h)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block max-w-sm">
        <span className="mb-1 block text-xs font-medium text-slate-500">Whose class</span>
        <select
          value={who}
          onChange={(e) => setWho(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="mine">My own scheduled class</option>
          {props.colleagues.map((c) => (
            <option key={c.employeeId} value={c.employeeId}>
              Guest teaching for {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* The rate comes from the catalogue, never from the class name. */}
      {course ? (
        <p className="mt-2 text-xs text-slate-500">
          {usd(course.baseCents)} for the first student
          {course.perAdditionalCents > 0
            ? `, ${usd(course.perAdditionalCents)} for each one after.`
            : " — a flat rate, no per-student amount."}{" "}
          Guest teaching pays the same.
        </p>
      ) : null}

      <button
        type="button"
        disabled={props.disabled || busy || !courseId || dates.length === 0}
        onClick={async () => {
          if (!course) return;
          setBusy(true);
          const r = await addClassAction({
            weekStart: props.weekStart,
            courseId: course.courseId,
            campus,
            classDates: dates,
            startTimeEt: hour,
            isGuest: who !== "mine",
            guestForEmployeeId: who !== "mine" ? who : null,
          });
          setBusy(false);
          if (!("error" in r)) setCourseId("");
          props.onDone(r);
        }}
        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {busy
          ? "Adding…"
          : dates.length > 1
            ? `Add this class on ${dates.length} days`
            : "Add this class"}
      </button>
    </section>
  );
}

/**
 * Who was scheduled, and who did not come.
 *
 * A GRID, NOT A DROPDOWN. Jimmy, 2 October: "put all students into a grid
 * categorized by the school they attend fl, ga, av, hs and the teachers will
 * choose which students were scheduled". A dropdown opened once per child is
 * fine for two and miserable for twenty; every name is on screen at once
 * here, grouped by school, and scheduling is one tap.
 *
 * THE SCHOOL IS BESIDE THE NAME BECAUSE OF 21 SEPTEMBER, when a Virtual
 * teacher's class of four campus children priced as zero and nobody could
 * see which school a child belonged to.
 *
 * SCHEDULED IS WHAT PAYS. Absent is recorded next to it and changes nothing
 * about the money - Jimmy's decision of 29 September, said on the row so
 * nobody has to remember it.
 */
function Roster(props: {
  weekStart: string;
  entryId: string;
  cents: number;
  roster: readonly {
    studentId: string;
    name: string;
    school: PrimarySchool | null;
    absent: boolean;
  }[];
  scheduled: number;
  absent: number;
  allStudents: StudentOption[];
  submitted: boolean;
  pending: boolean;
  onRun: (fn: () => Promise<{ success: true } | { error: string }>, ok?: string) => void;
}) {
  const [open, setOpen] = useState(false);

  /* By id, never by name. Two children can share a name; an id is the only
     thing that says which of them is on this class and which is absent. */
  const onThisClass = useMemo(
    () => new Map(props.roster.map((r) => [r.studentId, r])),
    [props.roster]
  );

  const groups = useMemo(
    () =>
      SCHOOL_GROUPS.map((g) => ({
        ...g,
        students: props.allStudents.filter((s) =>
          g.key === "none" ? !s.school : s.school === g.key
        ),
      })).filter((g) => g.students.length > 0),
    [props.allStudents]
  );

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-slate-600 underline decoration-dotted underline-offset-4 hover:text-slate-900"
      >
        {props.scheduled} scheduled
        {props.absent > 0 ? `, ${props.absent} absent` : ""} ·{" "}
        {open ? "Hide" : "Choose Students Scheduled for this Class"}
      </button>

      {open ? (
        <div className="mt-2 space-y-3 rounded-xl bg-slate-50 px-3 py-3">
          {props.scheduled === 0 ? (
            <p className="m-0 text-xs text-slate-500">
              Nobody scheduled yet. A class with nobody on it pays nothing.
            </p>
          ) : (
            /*
             * WHAT THIS CLASS PAYS, WHILE SHE IS STILL CHOOSING.
             *
             * Renee Tracewell, 3 October 2026: she guest-covered Marisa
             * Vanella's class, put those three children into her own, and
             * went home expecting $85 - $40 for her class and $45 for the
             * cover. The JAG paid $55, because five children in one session
             * is one class. Jimmy ruled on 8 October that $55 is correct.
             *
             * Her arithmetic was never the problem. Nothing on this screen
             * told her the rule, so she reconstructed her own week at home,
             * got a different answer, and wrote to the CEO about $30 she was
             * never owed. The sentence costs nothing and the evening cost her
             * one.
             */
            <p className="m-0 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {props.scheduled} {props.scheduled === 1 ? "student" : "students"}
                {" · "}
                {usd(props.cents)}
              </span>{" "}
              for this class. If you took another teacher’s children into it,
              tick them here too — it is still one class and pays once, for
              everyone on it.
            </p>
          )}

          {groups.map((g) => (
            <div key={g.key}>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {g.label}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {g.students.map((s) => {
                  const entry = onThisClass.get(s.studentId);
                  const on = entry !== undefined;
                  const away = entry?.absent === true;
                  return (
                    <span key={s.studentId} className="inline-flex items-center">
                      <button
                        type="button"
                        disabled={props.pending || props.submitted}
                        onClick={() =>
                          props.onRun(
                            () =>
                              on
                                ? unscheduleStudentAction(
                                    props.weekStart,
                                    props.entryId,
                                    s.studentId
                                  )
                                : scheduleStudentAction(
                                    props.weekStart,
                                    props.entryId,
                                    s.studentId
                                  ),
                            on ? `${s.name} taken off this class.` : `${s.name} scheduled.`
                          )
                        }
                        className={
                          on
                            ? "rounded-l-lg border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                            : "rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50"
                        }
                      >
                        {s.name}
                      </button>
                      {on && !props.submitted ? (
                        <button
                          type="button"
                          disabled={props.pending}
                          onClick={() =>
                            props.onRun(
                              () =>
                                setAbsentAction(
                                  props.weekStart,
                                  props.entryId,
                                  s.studentId,
                                  !away
                                ),
                              away ? `${s.name} marked here.` : `${s.name} marked absent.`
                            )
                          }
                          className={
                            away
                              ? "rounded-r-lg border border-l-0 border-amber-400 bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-900 disabled:opacity-50"
                              : "rounded-r-lg border border-l-0 border-slate-900 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                          }
                          title="Marking absent does not change what this class pays"
                        >
                          {away ? "absent" : "here"}
                        </button>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="m-0 text-[11px] leading-snug text-slate-400">
            Tap a name to schedule them. Everyone scheduled counts as here unless you mark them
            absent, and marking somebody absent does not change what this class pays.
          </p>

          {/*
            * Forty-five taps become one. Ticking Monday to Friday makes five
            * classes; this puts the same children on the four that are still
            * empty. A day that already has children is left alone, so a
            * roster already corrected is never quietly overwritten.
            */}
          {props.roster.length > 0 && !props.submitted ? (
            <button
              type="button"
              disabled={props.pending}
              onClick={() =>
                props.onRun(
                  () => copyRosterToMyOtherClassesAction(props.weekStart, props.entryId),
                  "Those children are now on the other days of this class."
                )
              }
              className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Put these {props.roster.length} children on the other days of this class
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExtraRow(props: {
  kind: ExtraKind;
  weekStart: string;
  disabled: boolean;
  onRun: (fn: () => Promise<{ success: true } | { error: string }>, ok?: string) => void;
}) {
  const rule = EXTRA_RULES[props.kind];
  const [value, setValue] = useState("0");

  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
      <span className="min-w-0 text-sm text-slate-700">
        {rule.label}
        <span className="ml-1 text-xs text-slate-400">
          {usd(rule.cents)} per {rule.per}
        </span>
      </span>
      <input
        type="number"
        min={0}
        step={rule.per === "hour" ? 0.25 : 1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() =>
          props.onRun(() => setExtraClaimAction(props.weekStart, props.kind, Number(value)))
        }
        disabled={props.disabled}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
      />
    </label>
  );
}

function HourlyRow(props: {
  rate: HourlyRate;
  weekStart: string;
  disabled: boolean;
  onRun: (fn: () => Promise<{ success: true } | { error: string }>, ok?: string) => void;
}) {
  const [value, setValue] = useState("0");

  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
      <span className="min-w-0 text-sm text-slate-700">
        {props.rate.label}
        <span className="ml-1 text-xs text-slate-400">
          {usd(props.rate.cents)} an hour
          {props.rate.weeklyHourCap !== null ? `, up to ${props.rate.weeklyHourCap} a week` : ""}
        </span>
      </span>
      <input
        type="number"
        min={0}
        step={0.25}
        max={props.rate.weeklyHourCap ?? undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() =>
          props.onRun(() => setHourlyClaimAction(props.weekStart, props.rate.key, Number(value)))
        }
        disabled={props.disabled}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
      />
    </label>
  );
}
