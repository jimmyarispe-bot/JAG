/**
 * Scope applicability kinds — identity / pack references; no enforcement.
 */
export const POLICY_SCOPE_KINDS = Object.freeze([
  Object.freeze({
    id: "organization",
    label: "Organization",
    identityEntityType: "Organization",
  }),
  Object.freeze({
    id: "division",
    label: "Division",
    identityEntityType: "Division",
  }),
  Object.freeze({
    id: "department",
    label: "Department",
    identityEntityType: "Department",
  }),
  Object.freeze({ id: "team", label: "Team", identityEntityType: "Team" }),
  Object.freeze({
    id: "role",
    label: "Role",
    identityEntityType: "RoleDefinition",
  }),
  Object.freeze({ id: "location", label: "Location", identityEntityType: null }),
  Object.freeze({
    id: "capability_pack",
    label: "Capability Pack",
    identityEntityType: null,
  }),
] as const);
