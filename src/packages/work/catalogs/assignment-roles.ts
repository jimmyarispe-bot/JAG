/**
 * Assignment roles — identity.core person refs (never duplicate Identity).
 */
export const WORK_ASSIGNMENT_ROLES = Object.freeze([
  Object.freeze({ id: "assignee", label: "Assignee" }),
  Object.freeze({ id: "owner", label: "Owner" }),
  Object.freeze({ id: "collaborator", label: "Collaborator" }),
  Object.freeze({ id: "reviewer", label: "Reviewer" }),
] as const);
