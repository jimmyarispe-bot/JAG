/**
 * Participant roles — identity.core refs (no authorization logic).
 */
export const DECISION_PARTICIPANT_ROLES = Object.freeze([
  Object.freeze({ id: "requester", label: "Requester" }),
  Object.freeze({ id: "owner", label: "Owner" }),
  Object.freeze({ id: "approver", label: "Approver" }),
  Object.freeze({ id: "reviewer", label: "Reviewer" }),
  Object.freeze({ id: "stakeholder", label: "Stakeholder" }),
] as const);
