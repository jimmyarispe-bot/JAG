/**
 * Accounting Intelligence — Append-only Audit Trail.
 *
 * Every accounting event records who, when, why, approval, evidence,
 * source transaction, and linked workflow/recommendation/governance refs.
 * Nothing may be deleted.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingAuditEvent,
  AccountingAuditEventKind,
  AccountingDimensionalContext,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingAuditDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface RecordAccountingAuditInput {
  kind: AccountingAuditEventKind;
  entityId: string;
  entityType: string;
  action: string;
  actorId?: string | null;
  reason?: string | null;
  approvalRef?: string | null;
  evidenceRef?: string | null;
  sourceTransactionId?: string | null;
  workflowRef?: string | null;
  recommendationRef?: string | null;
  governanceDecisionRef?: string | null;
  dimensions?: AccountingDimensionalContext;
  details?: Record<string, unknown>;
  metadata?: AccountingMetadata;
}

export class AccountingAudit {
  private readonly events: AccountingAuditEvent[] = [];
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: AccountingAuditDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  record(input: RecordAccountingAuditInput): AccountingAuditEvent {
    const event: AccountingAuditEvent = {
      id: this.createId("acct-audit"),
      kind: input.kind,
      entityId: input.entityId,
      entityType: input.entityType,
      action: input.action,
      actorId: input.actorId ?? null,
      reason: input.reason ?? null,
      approvalRef: input.approvalRef ?? null,
      evidenceRef: input.evidenceRef ?? null,
      sourceTransactionId: input.sourceTransactionId ?? null,
      workflowRef: input.workflowRef ?? null,
      recommendationRef: input.recommendationRef ?? null,
      governanceDecisionRef: input.governanceDecisionRef ?? null,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions ?? emptyDimensions(),
      details: input.details ?? {},
      metadata: input.metadata,
    };
    this.events.push(event);
    return event;
  }

  list(): AccountingAuditEvent[] {
    return [...this.events];
  }

  listByKind(kind: AccountingAuditEventKind): AccountingAuditEvent[] {
    return this.events.filter((e) => e.kind === kind);
  }

  listByEntity(entityId: string): AccountingAuditEvent[] {
    return this.events.filter((e) => e.entityId === entityId);
  }

  count(): number {
    return this.events.length;
  }

  /** Deletion is forbidden — always throws. */
  delete(_eventId: string): never {
    throw new Error(
      "Accounting audit events cannot be deleted. Reverse the source transaction instead."
    );
  }
}

export function createAccountingAudit(
  deps?: AccountingAuditDependencies
): AccountingAudit {
  return new AccountingAudit(deps);
}
