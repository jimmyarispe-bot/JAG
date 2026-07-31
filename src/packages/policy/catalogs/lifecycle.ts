/** Policy lifecycle — representation only (no workflow engine). */
export const POLICY_LIFECYCLE_STATES = Object.freeze([
  Object.freeze({ id: "draft", label: "Draft" }),
  Object.freeze({ id: "review", label: "Review" }),
  Object.freeze({ id: "approved", label: "Approved" }),
  Object.freeze({ id: "effective", label: "Effective" }),
  Object.freeze({ id: "superseded", label: "Superseded" }),
  Object.freeze({ id: "retired", label: "Retired" }),
] as const);

export type PolicyLifecycleStateId =
  (typeof POLICY_LIFECYCLE_STATES)[number]["id"];
