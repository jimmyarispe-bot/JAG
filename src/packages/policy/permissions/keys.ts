export const POLICY_PERMISSION_KEYS = Object.freeze({
  access: "policy.access",
  familiesRead: "policy.families.read",
  familiesUpdate: "policy.families.update",
  policiesRead: "policy.policies.read",
  policiesUpdate: "policy.policies.update",
  versionsRead: "policy.versions.read",
  versionsCreate: "policy.versions.create",
  scopeRead: "policy.scope.read",
  scopeUpdate: "policy.scope.update",
  exceptionsRead: "policy.exceptions.read",
  exceptionsUpdate: "policy.exceptions.update",
  acknowledgementsRead: "policy.acknowledgements.read",
  acknowledgementsUpdate: "policy.acknowledgements.update",
} as const);

export const POLICY_PERMISSION_PACK_ID = "policy.permission.core" as const;
