/** Decision lifecycle status — representation only (no workflow engine). */
export const DECISION_STATUS_STATES = Object.freeze([
  Object.freeze({ id: "proposed", label: "Proposed" }),
  Object.freeze({ id: "under_review", label: "Under Review" }),
  Object.freeze({ id: "approved", label: "Approved" }),
  Object.freeze({ id: "rejected", label: "Rejected" }),
  Object.freeze({ id: "implemented", label: "Implemented" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type DecisionStatusStateId =
  (typeof DECISION_STATUS_STATES)[number]["id"];
