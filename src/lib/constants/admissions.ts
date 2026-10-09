/**
 * The admissions flow, in the order a family actually moves through it.
 *
 * REORDERED 9 October 2026. Jimmy: "the drop down on this page to match up to
 * the stages with numbers visable in the dropdown match up to the admissions
 * flow we have been working on".
 *
 * WHAT IT LOOKED LIKE BEFORE. This array was in the order lines were added to
 * the file, and the previous comment here said so plainly: the four Academy
 * Way stages were appended to the bottom rather than inserted, deliberately,
 * to avoid changing the board columns. The consequence was a dropdown that
 * offered Interest Meeting Held and Tour Requested BELOW Assessment Scheduled
 * - four stages out of sequence, on the control a school leader uses to move
 * a child through admissions.
 *
 * THE `step` NUMBER IS EXPLICIT, NOT THE ARRAY INDEX. A number derived from
 * position silently renumbers every stage below any stage that is ever
 * filtered, hidden or added. These numbers are the ones people will say out
 * loud to each other - "she's at 4, waiting on a tour" - so they are written
 * down rather than computed.
 *
 * SHADOW DAYS COME AFTER THE APPLICATION. Jimmy, 9 October, asked directly.
 * It matches ADMISSIONS_PIPELINE_STAGES, which has application at 70 and 80
 * and shadow days at 90 and 100.
 *
 * TWO LISTS STILL DESCRIBE THIS ONE FLOW - this, and
 * ADMISSIONS_PIPELINE_STAGES in lib/admissions/registry/stages.ts, which
 * drives the board columns. They now agree on order. They are still two
 * places holding one fact, which is the fault that produced $35-on-the-line
 * and $20-in-the-total the same morning. The dropdown should read the
 * registry; that is a larger change than a reorder and is not this one.
 */
export const LEAD_STAGES = [
  { value: "new_inquiry", step: 1, label: "New Inquiry", color: "bg-slate-100 text-slate-700" },
  { value: "information_sent", step: 2, label: "Information Sent", color: "bg-blue-100 text-blue-700" },
  { value: "interview_scheduled", step: 3, label: "Interest Meeting Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "interest_meeting_held", step: 4, label: "Interest Meeting Held", color: "bg-cyan-100 text-cyan-700" },
  { value: "tour_requested", step: 5, label: "Tour Requested", color: "bg-teal-100 text-teal-700" },
  { value: "tour_scheduled", step: 6, label: "Tour Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "tour_completed", step: 7, label: "Tour Completed", color: "bg-cyan-100 text-cyan-700" },
  { value: "application_started", step: 8, label: "Application Started", color: "bg-indigo-100 text-indigo-700" },
  { value: "application_submitted", step: 9, label: "Application Submitted", color: "bg-violet-100 text-violet-700" },
  { value: "shadow_day_scheduled", step: 10, label: "Shadow Days Scheduled", color: "bg-teal-100 text-teal-700" },
  { value: "shadow_day_completed", step: 11, label: "Shadow Days Completed", color: "bg-teal-100 text-teal-800" },
  { value: "records_requested", step: 12, label: "Records Requested", color: "bg-purple-100 text-purple-700" },
  { value: "admissions_review", step: 13, label: "Admissions Review", color: "bg-amber-100 text-amber-700" },
  { value: "accepted", step: 14, label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  { value: "waitlisted", step: 15, label: "Waitlisted", color: "bg-orange-100 text-orange-700" },
  { value: "declined", step: 16, label: "Declined", color: "bg-red-100 text-red-700" },
  { value: "not_returning", step: 17, label: "Not Returning", color: "bg-slate-200 text-slate-700" },
  { value: "enrolled", step: 18, label: "Enrolled", color: "bg-green-100 text-green-800" },

  /*
   * HS AND VIRTUAL ONLY, AND NOT BUILT YET.
   *
   * It was about to be labelled "(unused)" here - appointment-stages.ts says
   * "nothing in the codebase writes an assessment appointment anywhere" and
   * no lead has ever been in it, both still true. Jimmy answered the question
   * that comment raised on 9 October, minutes before this shipped: it is not
   * dead, it is unbuilt, and it belongs to two campuses rather than four.
   *
   *   "schedule assessment and anything assessments related only relates to
   *    hs n virtual. when schedule assessments is selected an email is sent
   *    from heather to mahogany.murphy@theacademyway.org to schedule
   *    assessment with the specific parent/child selected"
   *
   * NO step NUMBER UNTIL IT IS SCOPED TO A CAMPUS. Numbering it 1-18 beside
   * the others would tell a GA school leader it is part of her flow, and it
   * is not. A stage that applies to some schools and not others needs the
   * dropdown to know which school it is looking at, and that is a real change
   * rather than a reorder.
   *
   * Left in the array so the type and any stored value survive.
   */
  { value: "assessment_scheduled", step: null, label: "Assessment Scheduled — HS and Virtual", color: "bg-cyan-100 text-cyan-700" },
] as const;

export type LeadStageValue = (typeof LEAD_STAGES)[number]["value"];

export const PIPELINE_STAGES: LeadStageValue[] = [
  "new_inquiry",
  "information_sent",
  "tour_scheduled",
  "tour_completed",
  "application_started",
  "application_submitted",
  "records_requested",
  "admissions_review",
  "waitlisted",
];

export function leadStageLabel(value: string | null | undefined): string {
  return LEAD_STAGES.find((s) => s.value === value)?.label ?? value ?? "—";
}

export function leadStageColor(value: string | null | undefined): string {
  return LEAD_STAGES.find((s) => s.value === value)?.color ?? "bg-slate-100 text-slate-700";
}

export const SCHOLARSHIP_APPROVER = "Jimmy Arispe";
