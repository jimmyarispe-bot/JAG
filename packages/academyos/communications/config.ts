import type { ChannelRoutingConfig } from "./types";

/** Default channel routing — push is future-ready (listed but not auto-selected). */
export const DEFAULT_CHANNEL_ROUTING: ChannelRoutingConfig = Object.freeze({
  enabledChannels: Object.freeze([
    "in_app",
    "email",
    "sms",
    "push",
    "announcement",
  ] as const),
  defaultChannels: Object.freeze(["in_app", "email"] as const),
});

/**
 * Catalog of domain events that the Notification Engine can route.
 * Keys match academyos.<domain>.* event suffixes used across packs.
 */
export const DOMAIN_EVENT_CATALOG = Object.freeze([
  // Admissions
  { domain: "admissions", eventKey: "application_received", title: "Application received" },
  { domain: "admissions", eventKey: "missing_documents", title: "Missing documents" },
  { domain: "admissions", eventKey: "interview_scheduled", title: "Interview scheduled" },
  { domain: "admissions", eventKey: "enrollment_accepted", title: "Enrollment accepted" },
  // SIS
  { domain: "sis", eventKey: "attendance_alert", title: "Attendance alert" },
  { domain: "sis", eventKey: "student_status_changed", title: "Student status changed" },
  { domain: "sis", eventKey: "emergency_contact_updated", title: "Emergency contact updated" },
  // Academic Ops
  { domain: "academic_ops", eventKey: "class_changed", title: "Class changed" },
  { domain: "academic_ops", eventKey: "session_cancelled", title: "Session cancelled" },
  { domain: "academic_ops", eventKey: "teacher_substitution", title: "Teacher substitution" },
  { domain: "academic_ops", eventKey: "waitlist_promoted", title: "Waitlist promotion" },
  // Learning
  { domain: "learning", eventKey: "assessment_completed", title: "Assessment completed" },
  { domain: "learning", eventKey: "intervention_assigned", title: "Intervention assigned" },
  { domain: "learning", eventKey: "mastery_milestone", title: "Mastery milestone reached" },
  // Finance
  { domain: "finance", eventKey: "invoice_issued", title: "Invoice issued" },
  { domain: "finance", eventKey: "payment_received", title: "Payment received" },
  { domain: "finance", eventKey: "payment_failed", title: "Payment failed" },
  { domain: "finance", eventKey: "tuition_reminder", title: "Tuition reminder" },
  { domain: "finance", eventKey: "scholarship_awarded", title: "Scholarship awarded" },
  // Workforce
  { domain: "workforce", eventKey: "certification_expiring", title: "Certification expiring" },
  { domain: "workforce", eventKey: "timesheet_due", title: "Timesheet due" },
  { domain: "workforce", eventKey: "timesheet_approved", title: "Timesheet approved" },
  { domain: "workforce", eventKey: "contract_renewal", title: "Contract renewal" },
] as const);

export const WORKFLOW_RECIPE_STEPS: Record<
  string,
  readonly { title: string; assigneeType: "parent" | "employee" | "staff" | "system" }[]
> = Object.freeze({
  "Admissions Checklist": [
    { title: "Submit application", assigneeType: "parent" },
    { title: "Upload documents", assigneeType: "parent" },
    { title: "Schedule interview", assigneeType: "staff" },
    { title: "Accept offer", assigneeType: "parent" },
  ],
  "Enrollment Checklist": [
    { title: "Complete enrollment forms", assigneeType: "parent" },
    { title: "Confirm campus/program", assigneeType: "staff" },
    { title: "Activate student record", assigneeType: "staff" },
  ],
  "Student Withdrawal": [
    { title: "Submit withdrawal request", assigneeType: "parent" },
    { title: "Return materials", assigneeType: "parent" },
    { title: "Close billing", assigneeType: "staff" },
    { title: "Archive student", assigneeType: "staff" },
  ],
  "Employee Onboarding": [
    { title: "Complete new-hire paperwork", assigneeType: "employee" },
    { title: "Background check", assigneeType: "staff" },
    { title: "Assign position", assigneeType: "staff" },
    { title: "First-day orientation", assigneeType: "employee" },
  ],
  "Employee Offboarding": [
    { title: "Submit resignation/termination", assigneeType: "staff" },
    { title: "Return equipment", assigneeType: "employee" },
    { title: "Final timesheet", assigneeType: "employee" },
    { title: "Deactivate access", assigneeType: "staff" },
  ],
  "Scholarship Renewal": [
    { title: "Submit renewal application", assigneeType: "parent" },
    { title: "Verify eligibility", assigneeType: "staff" },
    { title: "Award decision", assigneeType: "staff" },
  ],
  "Tuition Collection": [
    { title: "Issue invoice", assigneeType: "system" },
    { title: "Send reminder", assigneeType: "system" },
    { title: "Record payment", assigneeType: "parent" },
    { title: "Close period", assigneeType: "staff" },
  ],
  "Annual Enrollment": [
    { title: "Open re-enrollment window", assigneeType: "staff" },
    { title: "Family confirms intent", assigneeType: "parent" },
    { title: "Update placement", assigneeType: "staff" },
    { title: "Confirm tuition plan", assigneeType: "parent" },
  ],
});
