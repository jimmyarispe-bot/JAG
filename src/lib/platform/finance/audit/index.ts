/**
 * Enterprise Financial Intelligence Engine — Audit Service.
 *
 * Immutable append-only event log. Events are NEVER deleted.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceAuditEvent,
  FinanceAuditEventKind,
  FinanceDimensionalContext,
  FinanceMetadata,
} from "@/lib/platform/finance/types";

export interface FinanceAuditServiceDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface RecordAuditEventInput {
  kind: FinanceAuditEventKind;
  entityId: string;
  entityType: string;
  action: string;
  actorId?: string | null;
  dimensions: FinanceDimensionalContext;
  details?: Record<string, unknown>;
  metadata?: FinanceMetadata;
}

/**
 * Append-only audit event log for all finance operations.
 * Thread-safe for sequential calls; events are immutable once appended.
 */
export class FinanceAuditService {
  private readonly events: FinanceAuditEvent[] = [];
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceAuditServiceDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  /** Append a new audit event. Returns the immutable record. */
  record(input: RecordAuditEventInput): FinanceAuditEvent {
    const event: FinanceAuditEvent = {
      id: this.createId("audit"),
      kind: input.kind,
      entityId: input.entityId,
      entityType: input.entityType,
      action: input.action,
      actorId: input.actorId ?? null,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      details: input.details ?? {},
      metadata: input.metadata,
    };
    this.events.push(event);
    return event;
  }

  /** Return all audit events in insertion order. */
  list(): FinanceAuditEvent[] {
    return [...this.events];
  }

  /** Return all events matching the given kind. */
  listByKind(kind: FinanceAuditEventKind): FinanceAuditEvent[] {
    return this.events.filter((e) => e.kind === kind);
  }

  /** Return all events for a specific entity. */
  listByEntity(entityId: string): FinanceAuditEvent[] {
    return this.events.filter((e) => e.entityId === entityId);
  }

  /** Total number of recorded events. */
  count(): number {
    return this.events.length;
  }
}

export function createFinanceAuditService(
  deps?: FinanceAuditServiceDependencies
): FinanceAuditService {
  return new FinanceAuditService(deps);
}
