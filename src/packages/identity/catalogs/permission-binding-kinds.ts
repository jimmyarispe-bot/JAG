/**
 * Permission binding kinds — represent bindings; do not execute authorization.
 * Authorization remains a JAG engine concern.
 */

export const IDENTITY_PERMISSION_BINDING_KINDS = Object.freeze([
  Object.freeze({
    id: "role_assignment",
    label: "Role assignment",
    description: "Binds a role to a member within a scope",
  }),
  Object.freeze({
    id: "effective",
    label: "Effective permissions",
    description: "Resolved permission set for a principal (representation only)",
  }),
  Object.freeze({
    id: "inherited",
    label: "Inherited permissions",
    description: "Permissions inherited through hierarchy",
  }),
  Object.freeze({
    id: "delegated",
    label: "Delegated permissions",
    description: "Permissions delegated from one principal to another",
  }),
] as const);
