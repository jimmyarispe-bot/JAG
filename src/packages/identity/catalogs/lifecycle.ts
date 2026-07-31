/**
 * Identity lifecycle states — definitions only (no provisioning).
 */

export const IDENTITY_LIFECYCLE_STATES = Object.freeze([
  Object.freeze({ id: "invited", label: "Invited" }),
  Object.freeze({ id: "active", label: "Active" }),
  Object.freeze({ id: "inactive", label: "Inactive" }),
  Object.freeze({ id: "suspended", label: "Suspended" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type IdentityLifecycleStateId =
  (typeof IDENTITY_LIFECYCLE_STATES)[number]["id"];
