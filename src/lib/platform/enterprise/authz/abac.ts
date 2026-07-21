/**
 * ABAC — attribute-based access control over in-memory policies.
 */

import { enterpriseAdminStore } from "@/lib/platform/enterprise/store/enterprise-store";
import type { AbacPolicy, AuthzDecision } from "@/lib/platform/enterprise/types";

function matchCondition(
  condition: AbacPolicy["conditions"][number],
  attrs: Record<string, unknown>
): boolean {
  const actual = attrs[condition.attribute];
  switch (condition.operator) {
    case "equals":
      return actual === condition.value;
    case "not_equals":
      return actual !== condition.value;
    case "contains":
      return String(actual ?? "").includes(String(condition.value ?? ""));
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(actual);
    default:
      return false;
  }
}

export function evaluateAbac(input: {
  organizationId: string;
  action: string;
  resource: string;
  attributes: Record<string, unknown>;
}): AuthzDecision {
  const policies = enterpriseAdminStore
    .get(input.organizationId)
    .abac.filter((p) => p.enabled);

  const applicable = policies.filter(
    (p) =>
      (p.actions.includes("*") || p.actions.includes(input.action)) &&
      (p.resource === "*" || p.resource === input.resource || input.resource.startsWith(p.resource))
  );

  const matched: string[] = [];
  let deny = false;
  let allow = false;

  for (const policy of applicable) {
    const ok = policy.conditions.every((c) => matchCondition(c, input.attributes));
    if (!ok) continue;
    matched.push(policy.id);
    if (policy.effect === "deny") deny = true;
    if (policy.effect === "allow") allow = true;
  }

  if (deny) {
    return {
      allowed: false,
      reason: "ABAC explicit deny",
      matchedPolicies: matched,
      engine: "abac",
    };
  }
  if (allow) {
    return {
      allowed: true,
      reason: "ABAC allow",
      matchedPolicies: matched,
      engine: "abac",
    };
  }
  return {
    allowed: false,
    reason: "ABAC no matching allow policy",
    matchedPolicies: matched,
    engine: "abac",
  };
}

export function evaluateRbacAbac(input: {
  organizationId: string;
  roleKeys: string[];
  permission: string;
  action: string;
  resource: string;
  attributes: Record<string, unknown>;
  evaluateRbac: (i: { roleKeys: string[]; permission: string }) => AuthzDecision;
}): AuthzDecision {
  const rbac = input.evaluateRbac({
    roleKeys: input.roleKeys,
    permission: input.permission,
  });
  const abac = evaluateAbac({
    organizationId: input.organizationId,
    action: input.action,
    resource: input.resource,
    attributes: input.attributes,
  });

  // Deny overrides; allow if either RBAC or ABAC allows (and no ABAC deny).
  if (!abac.allowed && abac.reason.includes("explicit deny")) {
    return {
      allowed: false,
      reason: `Combined deny — ${abac.reason}`,
      matchedPolicies: [...rbac.matchedPolicies, ...abac.matchedPolicies],
      engine: "rbac+abac",
    };
  }
  const allowed = rbac.allowed || abac.allowed;
  return {
    allowed,
    reason: allowed
      ? `Combined allow (rbac=${rbac.allowed}, abac=${abac.allowed})`
      : `Combined deny (rbac=${rbac.allowed}, abac=${abac.allowed})`,
    matchedPolicies: [...rbac.matchedPolicies, ...abac.matchedPolicies],
    engine: "rbac+abac",
  };
}
