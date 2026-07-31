/**
 * Rollback model — metadata only; no execution in Sprint 018.
 */

import type { RuntimeRollbackRecord } from "@/jag/runtime-lifecycle/contracts";

let rollbackSeq = 0;

export function resetRollbackSequenceForTests(): void {
  rollbackSeq = 0;
}

export function createRollbackRecord(input: {
  readonly fromVersionId: string;
  readonly toVersionId: string;
  readonly reason: string;
  readonly approvalId?: string;
  readonly createdAt?: string;
  readonly rollbackId?: string;
}): RuntimeRollbackRecord {
  if (!input.reason?.trim()) {
    throw new Error("Rollback reason is required");
  }
  if (input.fromVersionId === input.toVersionId) {
    throw new Error("Rollback must reference a different previous version");
  }
  rollbackSeq += 1;
  return Object.freeze({
    rollbackId:
      input.rollbackId ?? `rollback.${rollbackSeq}.${input.toVersionId}`,
    fromVersionId: input.fromVersionId,
    toVersionId: input.toVersionId,
    reason: input.reason,
    approvalId: input.approvalId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    executed: false,
  });
}
