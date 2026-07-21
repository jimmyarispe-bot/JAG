import type { CrudAction, CrudEntityKey } from "./types";

/** Map lifecycle verbs to activity event type suffixes. */
const ACTION_TO_SUFFIX: Partial<Record<CrudAction, string>> = {
  create: "created",
  edit: "updated",
  archive: "archived",
  restore: "restored",
  delete: "deleted",
  duplicate: "duplicated",
  cancel: "cancelled",
  enable: "enabled",
  disable: "disabled",
  deactivate: "deactivated",
};

/**
 * Build a catalog event key for an entity lifecycle action.
 * Example: lifecycleEventType("student", "archive") → "student.archived"
 */
export function lifecycleEventType(
  entityKey: CrudEntityKey,
  action: CrudAction
): string | null {
  const suffix = ACTION_TO_SUFFIX[action];
  if (!suffix) return null;
  return `${entityKey}.${suffix}`;
}

export const LIFECYCLE_CATALOG_EVENTS = [
  // Students / families already registered historically
  "student.created",
  "student.updated",
  "student.archived",
  "student.restored",
  "student.deleted",
  "student.duplicated",
  "family.created",
  "family.updated",
  "family.archived",
  "family.restored",
  "family.deleted",
  "family.duplicated",
  // Communications
  "communication.created",
  "communication.updated",
  "communication.archived",
  "communication.restored",
  "communication.deleted",
  "communication.duplicated",
  "template.created",
  "template.updated",
  "template.archived",
  "template.restored",
  "template.duplicated",
  "announcement.created",
  "announcement.updated",
  "announcement.archived",
  "announcement.duplicated",
  "announcement.published",
  // Workflows
  "workflow.created",
  "workflow.updated",
  "workflow.archived",
  "workflow.restored",
  "workflow.deleted",
  "workflow.duplicated",
  "workflow.enabled",
  "workflow.disabled",
  // Calendar
  "calendar_event.created",
  "calendar_event.updated",
  "calendar_event.duplicated",
  "calendar_event.cancelled",
  "calendar_event.deleted",
  // Employees
  "employee.created",
  "employee.updated",
  "employee.deactivated",
  "employee.restored",
  "employee.archived",
] as const;
