/**
 * The stages that are a claim about the calendar.
 *
 * "Tour Scheduled" is not an opinion about a family. It is a statement that an
 * appointment exists. On 14 September 2026 twenty-eight families were sitting in
 * one of these three stages with no tour, no interview and no shadow day on
 * record anywhere — twenty-three of them at The Academy Virtual.
 *
 * None of that was a data problem. There are two doors into these stages:
 *
 *   scheduleTour / scheduleInterview  — inserts the appointment, THEN moves the
 *                                       stage, THEN notifies the family.
 *   the pipeline board's dropdown     — moves the stage. Nothing else.
 *
 * The second door is the one on the screen, so it is the one people used. The
 * card moved, the column count went up, and underneath the only thing that
 * happened was that a word changed.
 *
 * This module is the single place that says which stages make that claim. The
 * boards read it to decide whether to ask for a date; the server action reads it
 * to decide which table the appointment belongs in. One list, so the two cannot
 * drift.
 *
 * Client-safe by construction: no server imports, no Supabase, nothing behind
 * `next/headers`. Both boards are "use client" and import it directly.
 */

import type { LeadStageValue } from "@/lib/constants/admissions";

/** A lead stage that must not be entered without a real appointment behind it. */
export type AppointmentStage =
  | "tour_scheduled"
  | "interview_scheduled"
  | "shadow_day_scheduled";

export interface AppointmentStageSpec {
  /** Which table the appointment row lives in. */
  readonly table: "admissions_tours" | "admissions_interviews";
  /** What to call it in front of a member of staff. */
  readonly noun: string;
  /** Wording for the dialog's heading. */
  readonly title: string;
  /** The column on that table holding the kind of appointment. */
  readonly typeColumn: "tour_type" | "interview_type";
  /** Offered in the dialog; the first is the default. */
  readonly typeOptions: ReadonlyArray<{ value: string; label: string }>;
}

export const APPOINTMENT_STAGES: Readonly<Record<AppointmentStage, AppointmentStageSpec>> = {
  tour_scheduled: {
    table: "admissions_tours",
    noun: "tour",
    title: "Book the tour",
    typeColumn: "tour_type",
    typeOptions: [
      { value: "in_person", label: "In person" },
      { value: "virtual", label: "Virtual" },
    ],
  },
  interview_scheduled: {
    table: "admissions_interviews",
    noun: "interview",
    title: "Book the interview",
    typeColumn: "interview_type",
    typeOptions: [
      { value: "virtual", label: "Virtual" },
      { value: "in_person", label: "In person" },
      { value: "phone", label: "Phone" },
    ],
  },
  shadow_day_scheduled: {
    table: "admissions_interviews",
    noun: "shadow day",
    title: "Book the shadow day",
    typeColumn: "interview_type",
    // A shadow day is stored as an interview of this type. That is the shape
    // scheduleInterview already used; this keeps one representation rather than
    // inventing a second.
    typeOptions: [{ value: "initial_assessment", label: "Shadow day" }],
  },
} as const;

/**
 * Does entering this stage assert that an appointment exists?
 *
 * `assessment_scheduled` is deliberately NOT here. It is in LEAD_STAGES and it
 * reads like it belongs, but nothing in the codebase writes an assessment
 * appointment anywhere, so there is no row for a guard to insist on. Adding it
 * would block a stage with no way to satisfy the block. Raised as a question
 * rather than silently decided either way.
 */
export function stageRequiresAppointment(stage: string): stage is AppointmentStage {
  return Object.prototype.hasOwnProperty.call(APPOINTMENT_STAGES, stage);
}

export function appointmentSpec(stage: AppointmentStage): AppointmentStageSpec {
  return APPOINTMENT_STAGES[stage];
}

/** Every appointment stage, for tests and for exhaustiveness checks. */
export const APPOINTMENT_STAGE_VALUES = Object.keys(
  APPOINTMENT_STAGES
) as AppointmentStage[];

/** Narrowing helper so callers can pass a LeadStageValue without casting. */
export function asLeadStage(stage: AppointmentStage): LeadStageValue {
  return stage;
}
