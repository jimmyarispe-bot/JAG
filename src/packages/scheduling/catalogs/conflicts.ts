/** Conflict kinds — representation only (no resolution algorithms). */
export const CONFLICT_KINDS = Object.freeze([
  Object.freeze({ id: "participant", label: "Participant Conflict" }),
  Object.freeze({ id: "resource", label: "Resource Conflict" }),
  Object.freeze({ id: "policy", label: "Policy Conflict" }),
] as const);

export type ConflictKindId = (typeof CONFLICT_KINDS)[number]["id"];
