import type { WorkflowCategory } from "./types";

export interface TriggerDefinition {
  key: string;
  label: string;
  category: WorkflowCategory;
  description: string;
  /** Activity event types that map to this trigger */
  activityEventTypes?: string[];
}

export const WORKFLOW_TRIGGER_LIBRARY: TriggerDefinition[] = [
  // Admissions
  {
    key: "admissions.lead_created",
    label: "Lead Created",
    category: "admissions",
    description: "A new admissions lead is created",
    activityEventTypes: ["lead.created", "admissions.lead_created"],
  },
  {
    key: "admissions.lead_stage_changed",
    label: "Lead Stage Changed",
    category: "admissions",
    description: "Lead moves to a new pipeline stage",
    activityEventTypes: ["lead.stage_changed", "admissions.lead_stage_changed"],
  },
  {
    key: "admissions.student_accepted",
    label: "Student Accepted",
    category: "admissions",
    description: "Applicant is accepted for enrollment",
    activityEventTypes: ["enrollment.accepted", "admissions.student_accepted"],
  },
  // Students
  {
    key: "students.student_created",
    label: "Student Created",
    category: "students",
    description: "A student record is created",
    activityEventTypes: ["student.created"],
  },
  {
    key: "students.student_updated",
    label: "Student Updated",
    category: "students",
    description: "A student record is updated",
    activityEventTypes: ["student.updated"],
  },
  {
    key: "students.student_archived",
    label: "Student Archived",
    category: "students",
    description: "A student is archived",
    activityEventTypes: ["student.archived"],
  },
  {
    key: "students.student_restored",
    label: "Student Restored",
    category: "students",
    description: "An archived student is restored",
    activityEventTypes: ["student.restored"],
  },
  {
    key: "students.student_deleted",
    label: "Student Deleted",
    category: "students",
    description: "A student is permanently deleted",
    activityEventTypes: ["student.deleted"],
  },
  // Families
  {
    key: "families.family_created",
    label: "Family Created",
    category: "families",
    description: "A family household is created",
    activityEventTypes: ["family.created"],
  },
  {
    key: "families.family_updated",
    label: "Family Updated",
    category: "families",
    description: "Family details are updated",
    activityEventTypes: ["family.updated"],
  },
  {
    key: "families.family_archived",
    label: "Family Archived",
    category: "families",
    description: "A family is archived",
    activityEventTypes: ["family.archived"],
  },
  {
    key: "families.family_restored",
    label: "Family Restored",
    category: "families",
    description: "An archived family is restored",
    activityEventTypes: ["family.restored"],
  },
  {
    key: "families.family_deleted",
    label: "Family Deleted",
    category: "families",
    description: "A family is permanently deleted",
    activityEventTypes: ["family.deleted"],
  },
  {
    key: "families.family_merged",
    label: "Family Merged",
    category: "families",
    description: "Two families are merged",
    activityEventTypes: ["family.merged"],
  },
  {
    key: "families.family_split",
    label: "Family Split",
    category: "families",
    description: "A family is split into households",
    activityEventTypes: ["family.split"],
  },
  // Communications
  {
    key: "communications.message_created",
    label: "Communication Created",
    category: "communications",
    description: "A communication draft or message is created",
    activityEventTypes: ["communication.created"],
  },
  {
    key: "communications.message_sent",
    label: "Message Sent",
    category: "communications",
    description: "A communication is successfully sent",
    activityEventTypes: ["communication.sent"],
  },
  {
    key: "communications.message_failed",
    label: "Message Failed",
    category: "communications",
    description: "A communication fails delivery",
    activityEventTypes: ["communication.failed"],
  },
  {
    key: "communications.message_archived",
    label: "Communication Archived",
    category: "communications",
    description: "A communication is archived",
    activityEventTypes: ["communication.archived"],
  },
  {
    key: "communications.template_created",
    label: "Template Created",
    category: "communications",
    description: "A communication template is created",
    activityEventTypes: ["template.created"],
  },
  {
    key: "communications.announcement_published",
    label: "Announcement Published",
    category: "communications",
    description: "A school announcement is published",
    activityEventTypes: ["announcement.published"],
  },
  // Calendar
  {
    key: "calendar.event_created",
    label: "Calendar Event Created",
    category: "calendar",
    description: "A calendar event is created",
    activityEventTypes: ["calendar.created"],
  },
  {
    key: "calendar.event_updated",
    label: "Calendar Event Updated",
    category: "calendar",
    description: "A calendar event is updated",
    activityEventTypes: ["calendar.updated"],
  },
  {
    key: "calendar.event_cancelled",
    label: "Calendar Event Cancelled",
    category: "calendar",
    description: "A calendar event is cancelled",
    activityEventTypes: ["calendar.cancelled"],
  },
  {
    key: "calendar.meeting_scheduled",
    label: "Meeting Scheduled",
    category: "calendar",
    description: "A meeting is scheduled",
    activityEventTypes: ["meeting.scheduled"],
  },
  {
    key: "calendar.class_scheduled",
    label: "Class Scheduled",
    category: "calendar",
    description: "A class is scheduled",
    activityEventTypes: ["class.scheduled"],
  },
  // Workflows (meta)
  {
    key: "workflows.workflow_created",
    label: "Workflow Created",
    category: "workflows",
    description: "A workflow definition is created",
    activityEventTypes: ["workflow.created"],
  },
  {
    key: "workflows.workflow_enabled",
    label: "Workflow Enabled",
    category: "workflows",
    description: "A workflow is enabled",
    activityEventTypes: ["workflow.enabled"],
  },
  {
    key: "workflows.workflow_disabled",
    label: "Workflow Disabled",
    category: "workflows",
    description: "A workflow is disabled",
    activityEventTypes: ["workflow.disabled"],
  },
  {
    key: "workflows.workflow_archived",
    label: "Workflow Archived",
    category: "workflows",
    description: "A workflow is archived",
    activityEventTypes: ["workflow.archived"],
  },
  {
    key: "workflows.workflow_duplicated",
    label: "Workflow Duplicated",
    category: "workflows",
    description: "A workflow is duplicated",
    activityEventTypes: ["workflow.duplicated"],
  },
  // Scholarships
  {
    key: "scholarships.awarded",
    label: "Scholarship Awarded",
    category: "scholarships",
    description: "A scholarship is awarded",
    activityEventTypes: ["scholarship.awarded"],
  },
  {
    key: "scholarships.renewed",
    label: "Scholarship Renewed",
    category: "scholarships",
    description: "A scholarship is renewed",
    activityEventTypes: ["scholarship.renewed"],
  },
  {
    key: "scholarships.expired",
    label: "Scholarship Expired",
    category: "scholarships",
    description: "A scholarship expires",
    activityEventTypes: ["scholarship.expired"],
  },
  // Billing
  {
    key: "billing.invoice_created",
    label: "Invoice Created",
    category: "billing",
    description: "A tuition invoice is created",
    activityEventTypes: ["invoice.created", "billing.invoice_created"],
  },
  {
    key: "billing.payment_received",
    label: "Payment Received",
    category: "billing",
    description: "A payment is received",
    activityEventTypes: ["payment.received", "billing.payment_received"],
  },
  {
    key: "billing.overdue_balance",
    label: "Overdue Balance",
    category: "billing",
    description: "Account balance becomes overdue",
    activityEventTypes: ["billing.overdue", "billing.overdue_balance", "invoice.overdue"],
  },
  {
    key: "billing.invoice_sent",
    label: "Invoice Sent",
    category: "billing",
    description: "An invoice is sent to a family",
    activityEventTypes: ["invoice.sent"],
  },
  {
    key: "billing.invoice_paid",
    label: "Invoice Paid",
    category: "billing",
    description: "An invoice is fully paid",
    activityEventTypes: ["invoice.paid"],
  },
  {
    key: "billing.account_created",
    label: "Financial Account Created",
    category: "billing",
    description: "A family financial account is created",
    activityEventTypes: ["finance.account.created"],
  },
  {
    key: "billing.scholarship_applied",
    label: "Scholarship Applied",
    category: "billing",
    description: "A scholarship is applied to an invoice",
    activityEventTypes: ["scholarship.applied"],
  },
  {
    key: "billing.discount_applied",
    label: "Discount Applied",
    category: "billing",
    description: "A discount is applied to an invoice or account",
    activityEventTypes: ["discount.applied"],
  },
  {
    key: "billing.refund_created",
    label: "Refund Requested",
    category: "billing",
    description: "A refund request is created",
    activityEventTypes: ["refund.created"],
  },
  {
    key: "billing.refund_completed",
    label: "Refund Completed",
    category: "billing",
    description: "A refund is completed",
    activityEventTypes: ["refund.completed", "invoice.refunded"],
  },
  {
    key: "billing.payment_failed",
    label: "Payment Failed",
    category: "billing",
    description: "A payment attempt fails",
    activityEventTypes: ["payment.failed"],
  },
  // Attendance
  {
    key: "attendance.absence",
    label: "Absence",
    category: "attendance",
    description: "Student marked absent",
    activityEventTypes: ["attendance.absence"],
  },
  {
    key: "attendance.tardy",
    label: "Tardy",
    category: "attendance",
    description: "Student marked tardy",
    activityEventTypes: ["attendance.tardy"],
  },
  {
    key: "attendance.threshold_reached",
    label: "Attendance Threshold Reached",
    category: "attendance",
    description: "Attendance rate crosses a configured threshold",
    activityEventTypes: ["attendance.threshold_reached"],
  },
  // HR
  {
    key: "hr.employee_created",
    label: "Employee Created",
    category: "hr",
    description: "A new employee record is created",
    activityEventTypes: ["employee.created", "hr.employee_created"],
  },
  {
    key: "hr.employee_deactivated",
    label: "Employee Deactivated",
    category: "hr",
    description: "An employee is deactivated or terminated",
    activityEventTypes: ["employee.deactivated"],
  },
  {
    key: "hr.employee_restored",
    label: "Employee Restored",
    category: "hr",
    description: "An employee is restored to active",
    activityEventTypes: ["employee.restored"],
  },
  {
    key: "hr.timesheet_submitted",
    label: "Timesheet Submitted",
    category: "hr",
    description: "An employee submits a timesheet",
    activityEventTypes: ["timesheet.submitted", "hr.timesheet_submitted"],
  },
  {
    key: "hr.payroll_approved",
    label: "Payroll Approved",
    category: "hr",
    description: "Payroll run is approved",
    activityEventTypes: ["payroll.approved", "hr.payroll_approved"],
  },
  {
    key: "hr.employee_hired",
    label: "Employee Hired",
    category: "hr",
    description: "An applicant is hired or an employee hire is recorded",
    activityEventTypes: ["employee.hired", "hr.employee_hired"],
  },
  {
    key: "hr.employee_updated",
    label: "Employee Updated",
    category: "hr",
    description: "Employee record or lifecycle stage changes",
    activityEventTypes: ["employee.updated", "hr.employee_updated"],
  },
  {
    key: "hr.employee_promoted",
    label: "Employee Promoted",
    category: "hr",
    description: "An employee receives a promotion",
    activityEventTypes: ["employee.promoted"],
  },
  {
    key: "hr.employee_assigned",
    label: "Employee Assigned",
    category: "hr",
    description: "Employee assigned to school, program, class, or position",
    activityEventTypes: ["employee.assigned"],
  },
  {
    key: "hr.certification_expiring",
    label: "Certification Expiring",
    category: "hr",
    description: "A credential is approaching expiration",
    activityEventTypes: ["employee.certification.expiring"],
  },
  {
    key: "hr.review_completed",
    label: "Performance Review Completed",
    category: "hr",
    description: "A performance review is completed",
    activityEventTypes: ["employee.review.completed"],
  },
  {
    key: "hr.leave_approved",
    label: "Leave Approved",
    category: "hr",
    description: "A time-off / leave request is approved",
    activityEventTypes: ["employee.leave.approved"],
  },
  {
    key: "hr.employee_terminated",
    label: "Employee Terminated",
    category: "hr",
    description: "An employee is terminated",
    activityEventTypes: ["employee.terminated"],
  },
  {
    key: "hr.onboarding_completed",
    label: "Onboarding Completed",
    category: "hr",
    description: "Employee completes all onboarding tasks",
    activityEventTypes: ["employee.onboarding.completed"],
  },
  {
    key: "hr.offer_extended",
    label: "Offer Extended",
    category: "hr",
    description: "A job offer is extended to a candidate",
    activityEventTypes: ["employee.offer.extended"],
  },
  // Documents
  {
    key: "documents.created",
    label: "Document Created",
    category: "system",
    description: "A platform document is created",
    activityEventTypes: ["document.created"],
  },
  {
    key: "documents.uploaded",
    label: "Document Uploaded",
    category: "system",
    description: "File metadata is attached to a document",
    activityEventTypes: ["document.uploaded"],
  },
  {
    key: "documents.updated",
    label: "Document Updated",
    category: "system",
    description: "A document is updated",
    activityEventTypes: ["document.updated"],
  },
  {
    key: "documents.versioned",
    label: "Document Versioned",
    category: "system",
    description: "A document receives a new version",
    activityEventTypes: ["document.versioned"],
  },
  {
    key: "documents.archived",
    label: "Document Archived",
    category: "system",
    description: "A document is archived",
    activityEventTypes: ["document.archived"],
  },
  {
    key: "documents.restored",
    label: "Document Restored",
    category: "system",
    description: "An archived document is restored",
    activityEventTypes: ["document.restored"],
  },
  {
    key: "documents.deleted",
    label: "Document Deleted",
    category: "system",
    description: "A document is permanently deleted",
    activityEventTypes: ["document.deleted"],
  },
  {
    key: "documents.template_used",
    label: "Document Template Used",
    category: "system",
    description: "A document is created from a template",
    activityEventTypes: ["template.used"],
  },
  {
    key: "documents.signature_requested",
    label: "Signature Requested",
    category: "system",
    description: "An e-signature request is initiated for a document",
    activityEventTypes: ["signature.requested"],
  },
  {
    key: "documents.approved",
    label: "Document Approved / Rejected",
    category: "system",
    description: "Document review outcome (via status updates)",
    activityEventTypes: ["document.updated", "document.versioned"],
  },
  // JAG Intelligence Engine
  {
    key: "jag.pipeline_completed",
    label: "JAG Pipeline Completed",
    category: "system",
    description: "Intelligence pipeline finished a run",
    activityEventTypes: ["jag.pipeline.completed"],
  },
  {
    key: "jag.insight_created",
    label: "JAG Insight Created",
    category: "system",
    description: "A persisted insight was created",
    activityEventTypes: ["jag.insight.created"],
  },
  {
    key: "jag.insight_resolved",
    label: "JAG Insight Resolved",
    category: "system",
    description: "An insight was resolved",
    activityEventTypes: ["jag.insight.resolved"],
  },
  {
    key: "jag.anomaly_detected",
    label: "JAG Anomaly Detected",
    category: "system",
    description: "Anomaly detection surfaced unusual patterns",
    activityEventTypes: ["jag.anomaly.detected"],
  },
  {
    key: "jag.feedback_recorded",
    label: "JAG Feedback Recorded",
    category: "system",
    description: "Decision feedback captured for learning evaluation",
    activityEventTypes: ["jag.feedback.recorded"],
  },
  {
    key: "jag.context_updated",
    label: "JAG Context Updated",
    category: "system",
    description: "Organizational context snapshot updated",
    activityEventTypes: ["jag.context.updated"],
  },
  // Founder Intelligence
  {
    key: "founder.brief_generated",
    label: "Founder Brief Generated",
    category: "founder",
    description: "Executive brief refreshed from EI analysis",
    activityEventTypes: ["founder.brief.generated"],
  },
  {
    key: "founder.health_scored",
    label: "Founder Health Scored",
    category: "founder",
    description: "Organization health scores recomputed",
    activityEventTypes: ["founder.health.scored"],
  },
  {
    key: "founder.insight_created",
    label: "Founder Insight Created",
    category: "founder",
    description: "A new Founder Intelligence insight is created",
    activityEventTypes: ["founder.insight.created"],
  },
  {
    key: "founder.recommendation_created",
    label: "Founder Recommendation Created",
    category: "founder",
    description: "AI recommendation surfaced to Decision Center",
    activityEventTypes: ["founder.recommendation.created"],
  },
  {
    key: "founder.decision_approved",
    label: "Founder Decision Approved",
    category: "founder",
    description: "Founder approved a recommendation (may trigger workflows)",
    activityEventTypes: ["founder.decision.approved"],
  },
  {
    key: "founder.decision_dismissed",
    label: "Founder Decision Dismissed",
    category: "founder",
    description: "Founder dismissed a recommendation",
    activityEventTypes: ["founder.decision.dismissed"],
  },
  {
    key: "founder.decision_delegated",
    label: "Founder Decision Delegated",
    category: "founder",
    description: "Founder delegated a decision",
    activityEventTypes: ["founder.decision.delegated"],
  },
  {
    key: "founder.decision_scheduled",
    label: "Founder Decision Scheduled",
    category: "founder",
    description: "Founder scheduled a decision for later",
    activityEventTypes: ["founder.decision.scheduled"],
  },
  {
    key: "founder.decision_resolved",
    label: "Founder Decision Resolved",
    category: "founder",
    description: "Founder marked a decision resolved",
    activityEventTypes: ["founder.decision.resolved"],
  },
  // System
  {
    key: "system.scheduled_time",
    label: "Scheduled Time",
    category: "system",
    description: "Fires on a schedule (cron / RRULE)",
  },
  {
    key: "system.manual",
    label: "Manual",
    category: "system",
    description: "Manually invoked by staff",
  },
  {
    key: "system.api",
    label: "API",
    category: "system",
    description: "Invoked via API / extension adapter",
  },
];

const byKey = new Map(WORKFLOW_TRIGGER_LIBRARY.map((t) => [t.key, t]));

export function getTriggerDefinition(key: string): TriggerDefinition | undefined {
  return byKey.get(key);
}

export function getTriggerLabel(key: string): string {
  return byKey.get(key)?.label ?? key;
}

/** Map activity event type → workflow trigger keys */
export function triggersForActivityEvent(eventType: string): string[] {
  return WORKFLOW_TRIGGER_LIBRARY.filter((t) =>
    t.activityEventTypes?.includes(eventType)
  ).map((t) => t.key);
}
