"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/components/experience-system/interaction";
import {
  appointmentSpec,
  type AppointmentStage,
} from "@/lib/admissions/appointment-stages";

/**
 * The question the board never asked.
 *
 * Moving a family to "Tour Scheduled" is a claim that an appointment exists.
 * The board's dropdown made that claim without ever asking when, which is how
 * 28 families ended up in a scheduled stage with nothing on any calendar.
 *
 * So the dropdown opens this instead of changing the stage. Give it a date and
 * a time and the appointment is booked and the stage moves together, through
 * the same action scheduleTour has always used. Cancel and NOTHING happens —
 * the card stays exactly where it was, because a half-finished booking that
 * silently moved the stage would be the original bug with an extra step.
 *
 * WHY TWO FIELDS RATHER THAN ONE datetime-local
 *
 * A single datetime-local is one native widget whose internal segments belong
 * to the browser. Fill in the date and the minutes but leave the hour blank and
 * it hands back an EMPTY STRING — not a partial value, nothing — so the guard
 * fires and the screen says "needs a date" to somebody looking straight at the
 * date they just typed. That happened within minutes of this shipping.
 *
 * Split in two, each field can be marked wrong on its own, and the one that is
 * actually missing is the one that turns red. The readback line underneath then
 * says, in words, exactly what is about to be saved — so nobody has to trust
 * that the boxes were understood the way they were typed.
 */

export interface ScheduleAppointmentDialogProps {
  open: boolean;
  stage: AppointmentStage | null;
  studentName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (input: {
    /** "YYYY-MM-DDTHH:MM" — what the server action parses. */
    scheduledAt: string;
    appointmentType: string;
    notes: string;
  }) => void;
}

/** Spells the booking back in words, so the boxes cannot be misread. */
function readback(date: string, time: string): string | null {
  if (!date || !time) return null;
  const when = new Date(`${date}T${time}`);
  if (Number.isNaN(when.getTime())) return null;
  return when.toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScheduleAppointmentDialog({
  open,
  stage,
  studentName,
  busy = false,
  onCancel,
  onConfirm,
}: ScheduleAppointmentDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef);
  const titleId = useId();
  const dateId = useId();
  const timeId = useId();
  const typeId = useId();
  const notesId = useId();

  /**
   * Initialised once and never reset by an effect. The parent keys this
   * component on leadId:stage, so opening it for a different family remounts it
   * and every field starts empty — a date left over from the previous family is
   * exactly the kind of quiet wrong answer this dialog exists to prevent.
   */
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<string>(() =>
    stage ? appointmentSpec(stage).typeOptions[0].value : ""
  );
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  // Computed in the handler, never in render: Date.now() during a render pass
  // is impure and answers differently on every re-render.
  const [inThePast, setInThePast] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  // No mounted flag: the portal only needs a document, and asking for one
  // directly avoids a setState-in-effect just to learn we are in a browser.
  if (!open || !stage || typeof document === "undefined") return null;

  const spec = appointmentSpec(stage);
  const dateMissing = touched && !date;
  const timeMissing = touched && !time;
  const complete = Boolean(date && time);
  const spelled = readback(date, time);

  function recomputePast(nextDate: string, nextTime: string) {
    if (!nextDate || !nextTime) {
      setInThePast(false);
      return;
    }
    const when = new Date(`${nextDate}T${nextTime}`);
    setInThePast(!Number.isNaN(when.getTime()) && when.getTime() < Date.now());
  }

  function submit() {
    setTouched(true);
    if (!date || !time) return;
    /**
     * Sent as a full instant, resolved HERE.
     *
     * "2026-09-15T10:00" carries no timezone, and a server action runs on
     * Vercel, which is UTC. So the first booking ever made through this dialog
     * stored 10am Eastern as 10:00+00 — six in the morning, four hours out.
     * Nobody would have noticed until a reminder fired on the wrong part of the
     * wrong day, because 361's reminders are dated off scheduled_at.
     *
     * The browser is the only place that knows what the person meant by ten
     * o'clock. new Date() on that string resolves it against THIS machine's
     * clock, and toISOString() makes it an unambiguous instant, so the server
     * has nothing left to guess.
     */
    const instant = new Date(`${date}T${time}`);
    if (Number.isNaN(instant.getTime())) return;
    onConfirm({ scheduledAt: instant.toISOString(), appointmentType, notes });
  }

  const fieldBase =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 disabled:opacity-50";
  const ok = "border-slate-200";
  const bad = "border-rose-500 bg-rose-50 ring-1 ring-rose-200";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {spec.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {studentName} moves to this stage once the {spec.noun} is on the calendar.
        </p>

        <div className="mt-4 space-y-3">
          {/* Date and time, separately, so the missing one is the one that goes red. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor={dateId} className="block text-xs font-medium text-slate-700">
                Date {dateMissing && <span className="text-rose-600">— required</span>}
              </label>
              <input
                id={dateId}
                type="date"
                value={date}
                disabled={busy}
                onChange={(e) => {
                  setDate(e.target.value);
                  recomputePast(e.target.value, time);
                }}
                aria-invalid={dateMissing || undefined}
                className={`${fieldBase} ${dateMissing ? bad : ok}`}
              />
              <p className="mt-1 text-xs text-slate-400">Example: 09/15/2026</p>
            </div>

            <div className="flex-1">
              <label htmlFor={timeId} className="block text-xs font-medium text-slate-700">
                Time {timeMissing && <span className="text-rose-600">— required</span>}
              </label>
              <input
                id={timeId}
                type="time"
                value={time}
                disabled={busy}
                onChange={(e) => {
                  setTime(e.target.value);
                  recomputePast(date, e.target.value);
                }}
                aria-invalid={timeMissing || undefined}
                className={`${fieldBase} ${timeMissing ? bad : ok}`}
              />
              <p className="mt-1 text-xs text-slate-400">Example: 10:30 AM</p>
            </div>
          </div>

          {/*
            * The readback. It says what is about to be saved, in words, so a
            * half-typed box cannot pass for a booking — and so nobody has to
            * take on trust that the fields were read the way they were typed.
            */}
          <div
            aria-live="polite"
            className={`rounded-lg border px-3 py-2 text-xs ${
              complete
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {complete && spelled ? (
              <>
                <span className="font-medium">This books the {spec.noun} for:</span>{" "}
                {spelled}
              </>
            ) : (
              <>
                <span className="font-medium">Not complete yet.</span>{" "}
                {!date && !time
                  ? "Both the date and the time are still empty."
                  : !date
                    ? "The time is set. The date is still empty."
                    : "The date is set. The time is still empty."}
              </>
            )}
          </div>

          {inThePast && (
            <p className="text-xs text-amber-700">
              That is in the past. It will be recorded, but no reminder is created for a
              date that has already gone.
            </p>
          )}

          {spec.typeOptions.length > 1 && (
            <div>
              <label htmlFor={typeId} className="block text-xs font-medium text-slate-700">
                Kind
              </label>
              <select
                id={typeId}
                value={appointmentType}
                disabled={busy}
                onChange={(e) => setAppointmentType(e.target.value)}
                className={`${fieldBase} ${ok}`}
              >
                {spec.typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={notesId} className="block text-xs font-medium text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id={notesId}
              rows={2}
              value={notes}
              disabled={busy}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldBase} ${ok}`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Booking…" : `Book the ${spec.noun} and move the card`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
