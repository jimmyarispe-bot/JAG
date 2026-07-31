/** Schedule lifecycle status — representation only (no workflow engine). */
export const SCHEDULE_STATUS_STATES = Object.freeze([
  Object.freeze({ id: "planned", label: "Planned" }),
  Object.freeze({ id: "confirmed", label: "Confirmed" }),
  Object.freeze({ id: "in_progress", label: "In Progress" }),
  Object.freeze({ id: "completed", label: "Completed" }),
  Object.freeze({ id: "cancelled", label: "Cancelled" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type ScheduleStatusStateId =
  (typeof SCHEDULE_STATUS_STATES)[number]["id"];
