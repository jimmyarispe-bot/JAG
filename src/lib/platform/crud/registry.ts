import type { CrudAction, CrudEntityKey, EntityCapability } from "./types";

/**
 * Platform CRUD capability matrix — source of truth for which lifecycle
 * verbs each major entity exposes. UI must hide actions not listed here
 * (and still enforce server-side).
 */
export const ENTITY_CAPABILITIES: EntityCapability[] = [
  {
    entityKey: "student",
    label: "Student",
    module: "students",
    actions: ["view", "create", "edit", "archive", "restore", "delete", "history"],
    archivePreferred: true,
    hardDelete: true,
  },
  {
    entityKey: "family",
    label: "Family",
    module: "families",
    actions: ["view", "create", "edit", "archive", "restore", "delete", "history", "merge", "split"],
    archivePreferred: true,
    hardDelete: true,
  },
  {
    entityKey: "admission",
    label: "Admissions Case",
    module: "admissions",
    actions: ["view", "create", "edit", "archive", "history"],
    archivePreferred: true,
    hardDelete: false,
    notes: "Pipeline status changes preferred over hard delete.",
  },
  {
    entityKey: "school",
    label: "School",
    module: "settings",
    actions: ["view", "create", "edit", "archive", "restore", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "program",
    label: "Program",
    module: "settings",
    actions: ["view", "create", "edit", "archive", "restore", "duplicate", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "class",
    label: "Class / Section",
    module: "scheduling",
    actions: ["view", "create", "edit", "archive", "restore", "duplicate", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "teacher",
    label: "Teacher",
    module: "hr",
    actions: ["view", "edit", "deactivate", "restore", "history"],
    archivePreferred: true,
    hardDelete: false,
    notes: "Teachers are employees; use deactivate (inactive/terminated).",
  },
  {
    entityKey: "employee",
    label: "Employee",
    module: "hr",
    actions: ["view", "create", "edit", "deactivate", "restore", "history"],
    archivePreferred: true,
    hardDelete: false,
    notes: "Deactivate → employment_status inactive/terminated; never hard-delete payroll history.",
  },
  {
    entityKey: "scholarship",
    label: "Scholarship",
    module: "scholarships",
    actions: ["view", "create", "edit", "archive", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "invoice",
    label: "Invoice",
    module: "billing",
    actions: [
      "view",
      "create",
      "edit",
      "duplicate",
      "archive",
      "cancel",
      "delete",
      "history",
    ],
    archivePreferred: true,
    hardDelete: true,
    immutable: false,
    notes:
      "Void via cancel; hard delete only unlocked drafts with no payments. Prefer archive/void.",
  },
  {
    entityKey: "payment",
    label: "Payment",
    module: "billing",
    actions: ["view", "create", "history"],
    archivePreferred: false,
    hardDelete: false,
    immutable: true,
    notes: "Refunds / reversals only.",
  },
  {
    entityKey: "communication",
    label: "Communication",
    module: "communications",
    actions: ["view", "create", "edit", "archive", "restore", "duplicate", "delete", "history"],
    archivePreferred: true,
    hardDelete: true,
    notes: "Hard delete only for drafts / failed with no delivery trail.",
  },
  {
    entityKey: "announcement",
    label: "Announcement",
    module: "communications",
    actions: ["view", "create", "edit", "archive", "duplicate", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "template",
    label: "Communication Template",
    module: "communications",
    actions: ["view", "create", "edit", "archive", "restore", "duplicate", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "notification",
    label: "Notification",
    module: "communications",
    actions: ["view", "archive", "delete"],
    archivePreferred: true,
    hardDelete: true,
  },
  {
    entityKey: "calendar_event",
    label: "Calendar Event",
    module: "calendar",
    actions: ["view", "create", "edit", "reschedule", "duplicate", "cancel", "delete", "history"],
    archivePreferred: true,
    hardDelete: false,
    notes: "Cancel is the preferred end-state; series exceptions supported.",
  },
  {
    entityKey: "meeting",
    label: "Meeting",
    module: "calendar",
    actions: ["view", "create", "edit", "reschedule", "duplicate", "cancel", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "resource",
    label: "Resource",
    module: "calendar",
    actions: ["view", "create", "edit", "archive", "restore", "history"],
    archivePreferred: true,
    hardDelete: false,
  },
  {
    entityKey: "workflow",
    label: "Workflow",
    module: "workflows",
    actions: [
      "view",
      "create",
      "edit",
      "enable",
      "disable",
      "duplicate",
      "archive",
      "restore",
      "delete",
      "history",
    ],
    archivePreferred: true,
    hardDelete: true,
  },
  {
    entityKey: "document",
    label: "Document",
    module: "documents",
    actions: [
      "view",
      "create",
      "edit",
      "archive",
      "restore",
      "delete",
      "duplicate",
      "history",
    ],
    archivePreferred: true,
    hardDelete: true,
  },
  {
    entityKey: "report",
    label: "Report",
    module: "reports",
    actions: ["view", "create", "duplicate", "history"],
    archivePreferred: false,
    hardDelete: false,
  },
  {
    entityKey: "setting",
    label: "Setting",
    module: "settings",
    actions: ["view", "edit", "history"],
    archivePreferred: false,
    hardDelete: false,
  },
];

const byKey = new Map(ENTITY_CAPABILITIES.map((c) => [c.entityKey, c]));

export function getEntityCapability(entityKey: CrudEntityKey): EntityCapability | undefined {
  return byKey.get(entityKey);
}

export function entitySupports(entityKey: CrudEntityKey, action: CrudAction): boolean {
  return Boolean(byKey.get(entityKey)?.actions.includes(action));
}

export function listEntityCapabilities(): EntityCapability[] {
  return ENTITY_CAPABILITIES;
}
