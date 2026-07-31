/** Work lifecycle status — representation only (no BPM / workflow engine). */
export const WORK_STATUS_STATES = Object.freeze([
  Object.freeze({ id: "not_started", label: "Not Started" }),
  Object.freeze({ id: "planned", label: "Planned" }),
  Object.freeze({ id: "in_progress", label: "In Progress" }),
  Object.freeze({ id: "blocked", label: "Blocked" }),
  Object.freeze({ id: "review", label: "Review" }),
  Object.freeze({ id: "completed", label: "Completed" }),
  Object.freeze({ id: "cancelled", label: "Cancelled" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type WorkStatusStateId = (typeof WORK_STATUS_STATES)[number]["id"];
