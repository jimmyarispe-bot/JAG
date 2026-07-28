/**
 * Finance permissions — role grants (foundation; enforce in engine).
 */

import { getPermission, upsertPermission } from "../store";
import type { FinancePermissionGrant, FinanceRole } from "../types";
import { recordFinanceAudit } from "../audit";

const ROLE_IMPLIES: Record<FinanceRole, readonly FinanceRole[]> = {
  read: Object.freeze(["read"]),
  create: Object.freeze(["read", "create"]),
  approve: Object.freeze(["read", "approve"]),
  post: Object.freeze(["read", "post"]),
  reconcile: Object.freeze(["read", "reconcile"]),
  close_period: Object.freeze(["read", "close_period"]),
  financial_administrator: Object.freeze([
    "read",
    "create",
    "approve",
    "post",
    "reconcile",
    "close_period",
    "financial_administrator",
  ]),
  controller: Object.freeze([
    "read",
    "create",
    "approve",
    "post",
    "reconcile",
    "close_period",
    "controller",
  ]),
  cfo: Object.freeze([
    "read",
    "create",
    "approve",
    "post",
    "reconcile",
    "close_period",
    "cfo",
    "financial_administrator",
  ]),
  auditor: Object.freeze(["read", "auditor"]),
};

export function grantFinanceRoles(input: {
  organizationId: string;
  userId: string;
  roles: readonly FinanceRole[];
  actorUserId: string;
}): FinancePermissionGrant {
  const grant = upsertPermission({
    organizationId: input.organizationId,
    userId: input.userId,
    roles: Object.freeze([...input.roles]),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "permissions.grant",
    recordType: "permission",
    recordId: `${input.organizationId}::${input.userId}`,
    userId: input.actorUserId,
    newValue: grant,
  });
  return grant;
}

export function hasFinancePermission(input: {
  organizationId: string;
  userId: string;
  role: FinanceRole;
}): boolean {
  const grant = getPermission(input.organizationId, input.userId);
  if (!grant) return false;
  for (const r of grant.roles) {
    if (ROLE_IMPLIES[r]?.includes(input.role)) return true;
  }
  return false;
}

export function requireFinancePermission(input: {
  organizationId: string;
  userId: string;
  role: FinanceRole;
}): { ok: true } | { error: string } {
  if (hasFinancePermission(input)) return { ok: true };
  return {
    error: `Missing finance permission: ${input.role}`,
  };
}
