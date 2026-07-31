/** Report lifecycle — representation only. */
export const REPORT_LIFECYCLE_STATES = Object.freeze([
  Object.freeze({ id: "draft", label: "Draft" }),
  Object.freeze({ id: "validated", label: "Validated" }),
  Object.freeze({ id: "published", label: "Published" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type ReportLifecycleStateId =
  (typeof REPORT_LIFECYCLE_STATES)[number]["id"];
