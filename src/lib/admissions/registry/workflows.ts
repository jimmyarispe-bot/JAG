import type { AdmissionsWorkflowCatalogEntry } from "@/lib/admissions/registry/types";

/** Default Admissions OS workflow catalog — mirrors seeded DB workflows (migration 070). */
export const ADMISSIONS_WORKFLOW_CATALOG: AdmissionsWorkflowCatalogEntry[] = [
  {
    workflowKey: "wf_inquiry_submitted",
    name: "Inquiry Submitted",
    description: "Thank parent, notify staff, create follow-up task",
    triggerEvent: "inquiry_submitted",
    category: "inquiry",
    pipelineStage: "inquiry",
    sortOrder: 10,
    status: "live",
    defaultActions: ["send_email", "create_internal_task", "notify_admissions"],
  },
  {
    workflowKey: "wf_tour_scheduled",
    name: "Tour Scheduled",
    description: "Confirm tour, schedule reminders, assign staff",
    triggerEvent: "tour_scheduled",
    category: "tour",
    pipelineStage: "information_requested",
    sortOrder: 20,
    status: "live",
    defaultActions: ["send_email", "create_calendar_event", "assign_staff"],
  },
  {
    workflowKey: "wf_application_started",
    name: "Application Started",
    description: "Welcome email, incomplete reminders, staff alert",
    triggerEvent: "application_started",
    category: "application",
    pipelineStage: "application_started",
    sortOrder: 30,
    status: "live",
    defaultActions: ["send_email", "schedule_reminder", "notify_admissions"],
  },
  {
    workflowKey: "wf_application_submitted",
    name: "Application Submitted",
    description: "Confirmation email and staff review task",
    triggerEvent: "application_submitted",
    category: "application",
    pipelineStage: "application_submitted",
    sortOrder: 40,
    status: "live",
    defaultActions: ["send_email", "create_internal_task", "sync_checklist"],
  },
  {
    workflowKey: "wf_documents_uploaded",
    name: "Documents Uploaded",
    description: "Notify staff and check for missing documents",
    triggerEvent: "documents_uploaded",
    category: "application",
    pipelineStage: "documents_complete",
    sortOrder: 50,
    status: "live",
    defaultActions: ["notify_admissions", "check_missing_documents"],
  },
  {
    workflowKey: "wf_funding_verified",
    name: "Funding Verified",
    description: "Notify parent and staff when state funding is verified",
    triggerEvent: "funding_verified",
    category: "funding",
    sortOrder: 60,
    status: "live",
    defaultActions: ["send_email", "notify_finance"],
  },
  {
    workflowKey: "wf_funding_rejected",
    name: "Funding Rejected",
    description: "Request corrections from parent",
    triggerEvent: "funding_rejected",
    category: "funding",
    sortOrder: 70,
    status: "live",
    defaultActions: ["send_email", "request_document"],
  },
  {
    workflowKey: "wf_interview_scheduled",
    name: "Interview Scheduled",
    description: "Confirm interview and schedule reminders",
    triggerEvent: "interview_scheduled",
    category: "interview",
    pipelineStage: "interview_scheduled",
    sortOrder: 80,
    status: "live",
    defaultActions: ["send_email", "create_calendar_event", "schedule_reminder"],
  },
  {
    workflowKey: "wf_accepted",
    name: "Student Accepted",
    description: "Congratulations, enrollment packet, and staff tasks",
    triggerEvent: "accepted",
    category: "acceptance",
    pipelineStage: "accepted",
    sortOrder: 90,
    status: "live",
    defaultActions: [
      "send_email",
      "generate_enrollment_packet",
      "create_student_record",
      "notify_finance",
    ],
  },
  {
    workflowKey: "wf_waitlisted",
    name: "Waitlisted",
    description: "Waitlist notification and monthly follow-up",
    triggerEvent: "waitlisted",
    category: "waitlist",
    pipelineStage: "waitlisted",
    sortOrder: 100,
    status: "live",
    defaultActions: ["send_email", "schedule_reminder"],
  },
  {
    workflowKey: "wf_declined",
    name: "Declined",
    description: "Respectful decision letter",
    triggerEvent: "declined",
    category: "denial",
    pipelineStage: "declined",
    sortOrder: 110,
    status: "live",
    defaultActions: ["send_email", "audit_log_entry"],
  },
  {
    workflowKey: "wf_enrollment_completed",
    name: "Enrollment Completed",
    description: "Welcome and onboarding communications",
    triggerEvent: "enrollment_completed",
    category: "enrollment",
    pipelineStage: "enrollment_complete",
    sortOrder: 120,
    status: "live",
    defaultActions: [
      "send_email",
      "notify_executive",
      "audit_log_entry",
    ],
  },
];

const workflowByKey = new Map(
  ADMISSIONS_WORKFLOW_CATALOG.map((workflow) => [workflow.workflowKey, workflow])
);

const workflowsByTrigger = ADMISSIONS_WORKFLOW_CATALOG.reduce<
  Map<string, AdmissionsWorkflowCatalogEntry[]>
>((acc, workflow) => {
  const existing = acc.get(workflow.triggerEvent) ?? [];
  existing.push(workflow);
  acc.set(workflow.triggerEvent, existing);
  return acc;
}, new Map());

export function getAdmissionsWorkflowCatalogEntry(
  workflowKey: string
): AdmissionsWorkflowCatalogEntry | undefined {
  return workflowByKey.get(workflowKey);
}

export function getAdmissionsWorkflowsByTrigger(
  triggerEvent: string
): AdmissionsWorkflowCatalogEntry[] {
  return workflowsByTrigger.get(triggerEvent) ?? [];
}

export function getAdmissionsWorkflowCatalog(): AdmissionsWorkflowCatalogEntry[] {
  return [...ADMISSIONS_WORKFLOW_CATALOG];
}
