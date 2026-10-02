"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addClassAction,
  removeClassAction,
  saveKookyNoteAction,
  scheduleStudentAction,
  setAbsentAction,
  setExtraClaimAction,
  setHourlyClaimAction,
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
  previousWeek: string;
  nextWeek: string;
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
  const submitted = view.status === "submitted";
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
          <Link
            href={`/dashboard/teacher/week?week=${props.previousWeek}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Previous week
          </Link>
          <Link
            href={`/dashboard/teacher/week?week=${props.nextWeek}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Next week →
          </Link>
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
            label={submitted ? "Submitted total" : "This week so far"}
            value={usd(view.totalCents)}
          />
        </div>

        {submitted ? (
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            <p className="font-semibold">Submitted — waiting to be checked</p>
            <p className="text-xs">
              This week is closed. If something is wrong, tell Jimmy what needs correcting rather
              than changing it here.
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
                          {line.problem ? (
                            <p className="mt-1 text-xs font-medium text-rose-700">{line.problem}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">
                            {usd(line.cents)}
                          </span>
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

                      <Roster
                        weekStart={weekStart}
                        entryId={line.entryId}
                        roster={line.roster}
                        scheduled={line.scheduled}
                        absent={line.absent}
                        allStudents={props.students}
                        submitted={submitted}
                        pending={pending}
                        onRun={run}
                      />
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
            onClick={() => run(() => submitWeekAction(weekStart, note))}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Submitting…" : `Submit this week — ${usd(view.totalCents)}`}
          </button>
          <p className="text-xs text-slate-400">
            The amount on the button is the amount that gets sent. Once submitted, this week
            closes.
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
  const [date, setDate] = useState(props.weekStart);
  const [hour, setHour] = useState("09:00");
  const [who, setWho] = useState("mine");
  const [busy, setBusy] = useState(false);

  const course = props.courses.find((c) => c.courseId === courseId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">Add a class you taught</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Day</span>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {DAY_LABELS.map((label, i) => {
              const d = addDays(props.weekStart, i);
              return (
                <option key={d} value={d}>
                  {label} {prettyDate(d)}
                </option>
              );
            })}
          </select>
        </label>

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
        disabled={props.disabled || busy || !courseId}
        onClick={async () => {
          if (!course) return;
          setBusy(true);
          const r = await addClassAction({
            weekStart: props.weekStart,
            courseId: course.courseId,
            campus,
            classDate: date,
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
        {busy ? "Adding…" : "Add this class"}
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
          ) : null}

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
