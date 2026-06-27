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
};

export function getActivityEventDefinition(eventType: string): ActivityEventDefinition | undefined {
  return ACTIVITY_EVENT_CATALOG[eventType];
}

export function isKnownActivityEventType(eventType: string): boolean {
  return eventType in ACTIVITY_EVENT_CATALOG;
}
