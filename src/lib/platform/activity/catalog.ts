import type { ActivityClassification, ActivityVisibility } from "@/lib/platform/activity/types";

export interface ActivityEventDefinition {
  moduleKey: string;
  classification: ActivityClassification;
  visibility: ActivityVisibility;
  label: string;
}

/** Canonical activity event catalog — modules must register types here. */
export const ACTIVITY_EVENT_CATALOG: Record<string, ActivityEventDefinition> = {
  "student.created": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Student Created",
  },
  "student.updated": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Student Updated",
  },
  "family.created": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Family Created",
  },
  "guardian.created": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Guardian Added",
  },
  "enrollment.changed": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Enrollment Changed",
  },
  "enrollment.created": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Enrollment Created",
  },
  "attendance.recorded": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Attendance Recorded",
  },
  "behavior.recorded": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Behavior Recorded",
  },
  "document.uploaded": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Document Uploaded",
  },
  "scholarship.awarded": {
    moduleKey: "scholarships",
    classification: "operational",
    visibility: "staff",
    label: "Scholarship Awarded",
  },
  "invoice.paid": {
    moduleKey: "finance",
    classification: "operational",
    visibility: "staff",
    label: "Invoice Paid",
  },
  "communication.sent": {
    moduleKey: "platform",
    classification: "communication",
    visibility: "staff",
    label: "Communication Sent",
  },
  "note.created": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note Created",
  },
  "note.updated": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note Updated",
  },
  "note.deleted": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note Deleted",
  },
  "note.pinned": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note Pinned",
  },
  "note.unpinned": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note Unpinned",
  },
  "tag.created": {
    moduleKey: "platform",
    classification: "system",
    visibility: "internal",
    label: "Tag Created",
  },
  "tag.applied": {
    moduleKey: "platform",
    classification: "system",
    visibility: "internal",
    label: "Tag Applied",
  },
  "tag.removed": {
    moduleKey: "platform",
    classification: "system",
    visibility: "internal",
    label: "Tag Removed",
  },
  "relationship.created": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Relationship Created",
  },
  "relationship.updated": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Relationship Updated",
  },
  "relationship.ended": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Relationship Ended",
  },
  // Legacy timeline event types (writeTimelineEvent dual-write path)
  "workflow": {
    moduleKey: "platform",
    classification: "system",
    visibility: "staff",
    label: "Workflow Event",
  },
  "status_change": {
    moduleKey: "sis",
    classification: "operational",
    visibility: "staff",
    label: "Status Change",
  },
  "playbook_started": {
    moduleKey: "work",
    classification: "operational",
    visibility: "staff",
    label: "Playbook Started",
  },
  "task_completed": {
    moduleKey: "work",
    classification: "operational",
    visibility: "staff",
    label: "Task Completed",
  },
  "obligation_completed": {
    moduleKey: "compliance",
    classification: "operational",
    visibility: "staff",
    label: "Obligation Completed",
  },
  "email": {
    moduleKey: "platform",
    classification: "communication",
    visibility: "staff",
    label: "Email",
  },
  "sms": {
    moduleKey: "platform",
    classification: "communication",
    visibility: "staff",
    label: "SMS",
  },
  "portal_message": {
    moduleKey: "platform",
    classification: "communication",
    visibility: "staff",
    label: "Portal Message",
  },
  "phone_call": {
    moduleKey: "platform",
    classification: "communication",
    visibility: "staff",
    label: "Phone Call",
  },
  "task": {
    moduleKey: "work",
    classification: "operational",
    visibility: "staff",
    label: "Task",
  },
  "document": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Document",
  },
  "approval": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Approval",
  },
  "note": {
    moduleKey: "platform",
    classification: "operational",
    visibility: "staff",
    label: "Note",
  },
  "system": {
    moduleKey: "platform",
    classification: "system",
    visibility: "internal",
    label: "System Event",
  },
  "admissions.inquiry_created": {
    moduleKey: "admissions",
    classification: "operational",
    visibility: "staff",
    label: "Inquiry Created",
  },
  "admissions.stage_changed": {
    moduleKey: "admissions",
    classification: "operational",
    visibility: "staff",
    label: "Pipeline Stage Changed",
  },
  "admissions.decision_recorded": {
    moduleKey: "admissions",
    classification: "operational",
    visibility: "staff",
    label: "Decision Recorded",
  },
  "admissions.enrollment_completed": {
    moduleKey: "admissions",
    classification: "operational",
    visibility: "staff",
    label: "Enrollment Completed",
  },
};

export function getActivityEventDefinition(eventType: string): ActivityEventDefinition | undefined {
  return ACTIVITY_EVENT_CATALOG[eventType];
}

export function isKnownActivityEventType(eventType: string): boolean {
  return eventType in ACTIVITY_EVENT_CATALOG;
}
