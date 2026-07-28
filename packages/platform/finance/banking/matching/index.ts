/**
 * Matching framework only — no reconciliation engine.
 */

import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { listMatches, upsertMatch } from "../store";
import type { MatchCandidate, MatchTargetType } from "../types";
import { TREASURY_GUARDS } from "../types";

export function suggestMatch(input: {
  organizationId: string;
  userId: string;
  leftType: MatchTargetType;
  leftId: string;
  rightType: MatchTargetType;
  rightId: string;
  score: number;
  note?: string | null;
}): MatchCandidate | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.score < 0 || input.score > 1) {
    return { error: "Match score must be between 0 and 1." };
  }
  return upsertMatch({
    id: `match:${randomUUID()}`,
    organizationId: input.organizationId,
    leftType: input.leftType,
    leftId: input.leftId,
    rightType: input.rightType,
    rightId: input.rightId,
    score: input.score,
    status: "suggested",
    createdAt: new Date().toISOString(),
    note: input.note ?? null,
  });
}

export function acceptMatch(input: {
  organizationId: string;
  userId: string;
  matchId: string;
}): MatchCandidate | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = listMatches(input.organizationId).find(
    (m) => m.id === input.matchId
  );
  if (!existing) return { error: "Match not found." };
  return upsertMatch({ ...existing, status: "accepted" });
}

export function rejectMatch(input: {
  organizationId: string;
  userId: string;
  matchId: string;
}): MatchCandidate | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = listMatches(input.organizationId).find(
    (m) => m.id === input.matchId
  );
  if (!existing) return { error: "Match not found." };
  return upsertMatch({ ...existing, status: "rejected" });
}

export function matchingCapabilities(): {
  readonly targets: readonly MatchTargetType[];
  /** Treasury matching remains infrastructure; full recon is ReconciliationEngine (P-010). */
  readonly reconciliationImplemented: false;
  readonly infrastructureOnly: true;
  readonly reconciliationEngine: "packages/platform/finance/reconciliation";
} {
  return Object.freeze({
    targets: Object.freeze([
      "transaction",
      "deposit",
      "payment",
      "invoice",
      "bill",
      "journal_entry",
    ] as MatchTargetType[]),
    reconciliationImplemented: TREASURY_GUARDS.includesReconciliation,
    infrastructureOnly: TREASURY_GUARDS.matchingInfrastructureOnly,
    reconciliationEngine:
      "packages/platform/finance/reconciliation" as const,
  });
}

export { listMatches };
