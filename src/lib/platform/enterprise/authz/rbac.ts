/**
 * RBAC — soft-reads IAM core permissions + enterprise role catalog.
 */

import { IAM_CORE_PERMISSIONS } from "@/lib/platform/iam/permissions/registry";
import type { AuthzDecision, RbacRole } from "@/lib/platform/enterprise/types";

export function listEnterpriseRbacRoles(): RbacRole[] {
  const iamKeys = IAM_CORE_PERMISSIONS.map((p) => p.key);
  return [
    {
      key: "platform_admin",
      displayName: "Platform Admin",
      kind: "system",
      permissions: iamKeys,
    },
    {
      key: "org_admin",
      displayName: "Organization Admin",
      kind: "organization",
      permissions: [
        "iam.admin",
        "iam.audit.read",
        "iam.delegation.grant",
        "iam.delegation.revoke",
        "enterprise.sso.manage",
        "enterprise.scim.manage",
        "enterprise.api_keys.manage",
        "enterprise.licenses.read",
        "enterprise.org.manage",
      ],
    },
    {
      key: "security_admin",
      displayName: "Security Admin",
      kind: "organization",
      permissions: [
        "iam.audit.read",
        "enterprise.security.manage",
        "enterprise.compliance.read",
        "enterprise.api_keys.manage",
      ],
    },
    {
      key: "compliance_officer",
      displayName: "Compliance Officer",
      kind: "organization",
      permissions: ["enterprise.compliance.manage", "iam.audit.read", "enterprise.audit.read"],
    },
    {
      key: "delegated_admin",
      displayName: "Delegated Admin",
      kind: "custom",
      permissions: ["enterprise.org.read", "iam.audit.read"],
    },
    {
      key: "auditor",
      displayName: "Auditor",
      kind: "organization",
      permissions: ["iam.audit.read", "enterprise.audit.read", "enterprise.compliance.read"],
    },
  ];
}

export function listEnterprisePermissionCatalog(): Array<{
  key: string;
  name: string;
  module: string;
}> {
  const core = IAM_CORE_PERMISSIONS.map((p) => ({
    key: p.key,
    name: p.name,
    module: p.module,
  }));
  const enterprise = [
    "enterprise.sso.manage",
    "enterprise.saml.manage",
    "enterprise.scim.manage",
    "enterprise.api_keys.manage",
    "enterprise.security.manage",
    "enterprise.compliance.manage",
    "enterprise.compliance.read",
    "enterprise.audit.read",
    "enterprise.licenses.read",
    "enterprise.licenses.manage",
    "enterprise.org.manage",
    "enterprise.org.read",
    "enterprise.provision.manage",
    "enterprise.usage.read",
  ].map((key) => ({
    key,
    name: key.split(".").slice(1).join(" "),
    module: "enterprise",
  }));
  return [...core, ...enterprise];
}

export function evaluateRbac(input: {
  roleKeys: string[];
  permission: string;
}): AuthzDecision {
  const roles = listEnterpriseRbacRoles().filter((r) => input.roleKeys.includes(r.key));
  const matched = roles.filter((r) => r.permissions.includes(input.permission));
  const allowed = matched.length > 0;
  return {
    allowed,
    reason: allowed
      ? `RBAC allow via ${matched.map((r) => r.key).join(", ")}`
      : `RBAC deny — no role grants ${input.permission}`,
    matchedPolicies: matched.map((r) => `role:${r.key}`),
    engine: "rbac",
  };
}
