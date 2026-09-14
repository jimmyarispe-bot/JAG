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
 * So the dropdown now opens this instead of changing the stage. Give it a date
 * and the appointment is booked and the stage moves together, through the same
 * action scheduleTour has always used. Cancel and NOTHING happens — the card
 * stays exactly where it was, because a half-finished booking that silently
 * moved the stage would be the original bug with an extra step.
 */

export interface ScheduleAppointmentDialogProps {
  open: boolean;
  stage: AppointmentStage | null;
  studentName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (input: {
    scheduledAt: string;
    appointmentType: string;
    notes: string;
  }) => void;
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
  const whenId = useId();
  const typeId = useId();
  const notesId = useId();

  /**
   * State is initialised once and never reset by an effect.
   *
   * The parent gives this component a key of leadId:stage, so opening it for a
   * different family remounts it and every field starts empty. A date left over
   * from the previous family is exactly the kind of quiet wrong answer this
   * dialog exists to prevent, and a remount rules it out by construction rather
   * than by remembering to clear five fields.
   */
  const [scheduledAt, setScheduledAt] = useState("");
  const [appointmentType, setAppointmentType] = useState<string>(() =>
    stage ? appointmentSpec(stage).typeOptions[0].value : ""
  );
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  // Computed when the date changes, not during render: Date.now() in a render
  // pass is impure and gives a different answer on every re-render.
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
  const missing = touched && !scheduledAt;

  function onDateChange(value: string) {
    setScheduledAt(value);
    // A date in the past is allowed — staff do record a booking made last week
    // — but it is said out loud, because the reminder trigger creates nothing
    // for a date that has already gone.
    setInThePast(Boolean(value) && new Date(value).getTime() < Date.now());
  }

  function submit() {
    setTouched(true);
    if (!scheduledAt) return;
    onConfirm({ scheduledAt, appointmentType, notes });
  }

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
          <div>
            <label htmlFor={whenId} className="block text-xs font-medium text-slate-700">
              Date and time
            </label>
            <input
              id={whenId}
              type="datetime-local"
              value={scheduledAt}
              disabled={busy}
              onChange={(e) => onDateChange(e.target.value)}
              aria-invalid={missing || undefined}
              aria-describedby={missing ? `${whenId}-error` : undefined}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 disabled:opacity-50 ${
                missing ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {missing && (
              <p id={`${whenId}-error`} className="mt-1 text-xs text-rose-600">
                A {spec.noun} needs a date. That is the whole point of this stage.
              </p>
            )}
            {inThePast && (
              <p className="mt-1 text-xs text-amber-700">
                That is in the past. It will be recorded, but no reminder is created for
                a date that has already gone.
              </p>
            )}
          </div>

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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
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
