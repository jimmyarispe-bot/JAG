export const LEAD_STAGES = [
  { value: "new_inquiry", label: "New Inquiry", color: "bg-slate-100 text-slate-700" },
  { value: "information_sent", label: "Information Sent", color: "bg-blue-100 text-blue-700" },
  { value: "tour_scheduled", label: "Tour Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "tour_completed", label: "Tour Completed", color: "bg-cyan-100 text-cyan-700" },
  { value: "application_started", label: "Application Started", color: "bg-indigo-100 text-indigo-700" },
  { value: "application_submitted", label: "Application Submitted", color: "bg-violet-100 text-violet-700" },
  { value: "records_requested", label: "Records Requested", color: "bg-purple-100 text-purple-700" },
  { value: "admissions_review", label: "Admissions Review", color: "bg-amber-100 text-amber-700" },
  { value: "interview_scheduled", label: "Interview Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "assessment_scheduled", label: "Assessment Scheduled", color: "bg-cyan-100 text-cyan-700" },
  /**
   * The Academy Way stages. The database has accepted these since migration 225;
   * TypeScript did not know they existed, so any code path handling one had to
   * cast or would not compile. shadow_day_completed is new in migration 246 and
   * is where the accept/deny gate opens.
   *
   * Deliberately NOT added to PIPELINE_STAGES below — that list drives the board
   * columns, and adding four columns is a visible change nobody asked for. One
   * line each when the board should show them.
   */
  { value: "interest_meeting_held", label: "Interest Meeting Held", color: "bg-blue-100 text-blue-700" },
  { value: "tour_requested", label: "Tour Requested", color: "bg-sky-100 text-sky-700" },
  { value: "shadow_day_scheduled", label: "Shadow Days Scheduled", color: "bg-teal-100 text-teal-700" },
  { value: "shadow_day_completed", label: "Shadow Days Completed", color: "bg-teal-100 text-teal-800" },
  { value: "not_returning", label: "Not Returning", color: "bg-slate-200 text-slate-700" },
  { value: "accepted", label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  { value: "waitlisted", label: "Waitlisted", color: "bg-orange-100 text-orange-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
  { value: "enrolled", label: "Enrolled", color: "bg-green-100 text-green-800" },
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
