import { requireFinancePermission } from "../../permissions";
import { getPolicy, upsertPolicy } from "../store";
import type { TreasuryApprovalPolicy } from "../types";
import type { CurrencyCode } from "../../types";

const DEFAULT_POLICY = (organizationId: string): TreasuryApprovalPolicy => ({
  organizationId,
  singleApprovalLimit: 10_000,
  dualAuthLimit: 50_000,
  largeTransactionThreshold: 25_000,
  currency: "USD",
});

export function setTreasuryApprovalPolicy(input: {
  organizationId: string;
  userId: string;
  singleApprovalLimit: number;
  dualAuthLimit: number;
  largeTransactionThreshold: number;
  currency?: CurrencyCode;
}): TreasuryApprovalPolicy | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "financial_administrator",
  });
  if ("error" in gate) return gate;
  if (input.dualAuthLimit < input.singleApprovalLimit) {
    return { error: "Dual-auth limit must be >= single approval limit." };
  }
  return upsertPolicy({
    organizationId: input.organizationId,
    singleApprovalLimit: input.singleApprovalLimit,
    dualAuthLimit: input.dualAuthLimit,
    largeTransactionThreshold: input.largeTransactionThreshold,
    currency: input.currency ?? "USD",
  });
}

export function getTreasuryApprovalPolicy(
  organizationId: string
): TreasuryApprovalPolicy {
  return getPolicy(organizationId) ?? DEFAULT_POLICY(organizationId);
}

/** Sensitive account masking — never return full account numbers. */
export function maskAccountNumber(
  mask: string | null | undefined,
  last4?: string | null
): string {
  const digits = (last4 ?? mask ?? "").replace(/\D/g, "").slice(-4);
  if (!digits) return "••••";
  return `••••${digits}`;
}

/**
 * Segregation of duties: creator cannot be sole approver for dual-auth transfers.
 */
export function assertDualAuthSegregation(input: {
  createdBy: string;
  approverId: string;
  approvedBy: readonly string[];
}): { ok: true } | { error: string } {
  if (input.approverId === input.createdBy) {
    return {
      error: "Segregation of duties: creator cannot approve their own transfer.",
    };
  }
  if (input.approvedBy.includes(input.approverId)) {
    return { error: "Approver already recorded." };
  }
  return { ok: true };
}

export function requiresDualAuthorization(
  organizationId: string,
  amount: number
): boolean {
  const policy = getTreasuryApprovalPolicy(organizationId);
  return amount >= policy.dualAuthLimit;
}

export function requiresTransferApproval(
  organizationId: string,
  amount: number
): boolean {
  const policy = getTreasuryApprovalPolicy(organizationId);
  return amount >= policy.singleApprovalLimit;
}
