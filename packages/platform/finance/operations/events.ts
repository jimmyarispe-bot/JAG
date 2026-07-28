/**
 * Operational finance events → Digital Twin, Evidence Ledger, Organizational Memory.
 * In-process sinks (platform packages stay decoupled from src/lib adapters).
 */

import { randomUUID } from "node:crypto";

export type OperationalFinanceEventType =
  | "finance.purchase_request_created"
  | "finance.purchase_order_created"
  | "finance.purchase_order_approved"
  | "finance.goods_received"
  | "finance.bill_created"
  | "finance.bill_approved"
  | "finance.vendor_payment"
  | "finance.payment_run"
  | "finance.invoice_created"
  | "finance.invoice_sent"
  | "finance.customer_payment"
  | "finance.credit_memo"
  | "finance.refund"
  | "finance.write_off"
  | "finance.collection_activity"
  | "finance.contract_created"
  | "finance.subscription_billed"
  | "finance.revenue_recognized"
  | "finance.funding_applied"
  | "finance.adjustment"
  | "finance.report_generated"
  | "finance.budget_created"
  | "finance.budget_versioned"
  | "finance.forecast_created"
  | "finance.scenario_created"
  | "finance.variance_computed"
  | "finance.dashboard_built"
  | "finance.assumption_set"
  | "finance.allocation_posted";

export type OperationalFinanceEvent = {
  readonly id: string;
  readonly type: OperationalFinanceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

export type TwinProjection = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly entityHint: string;
  readonly projectedAt: string;
};

export type EvidenceRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly kind: "finance_operational";
  readonly summary: string;
  readonly recordedAt: string;
};

export type MemoryRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly title: string;
  readonly rememberedAt: string;
};

type OpsStore = {
  events: OperationalFinanceEvent[];
  twin: TwinProjection[];
  evidence: EvidenceRecord[];
  memory: MemoryRecord[];
  subscribers: ((e: OperationalFinanceEvent) => void)[];
};

const g = globalThis as typeof globalThis & {
  __jagFinanceOpsStore?: OpsStore;
};

function store(): OpsStore {
  if (!g.__jagFinanceOpsStore) {
    g.__jagFinanceOpsStore = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
      subscribers: [],
    };
  }
  return g.__jagFinanceOpsStore;
}

export function resetFinanceOpsStoreForTests(): void {
  g.__jagFinanceOpsStore = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
    subscribers: [],
  };
}

export function publishOperationalFinanceEvent(input: {
  type: OperationalFinanceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
}): OperationalFinanceEvent {
  const event: OperationalFinanceEvent = {
    id: `fops:${randomUUID()}`,
    type: input.type,
    organizationId: input.organizationId,
    recordType: input.recordType,
    recordId: input.recordId,
    actorUserId: input.actorUserId ?? null,
    occurredAt: new Date().toISOString(),
    payload: Object.freeze({ ...(input.payload ?? {}) }),
  };
  const s = store();
  s.events.unshift(event);
  if (s.events.length > 5000) s.events.length = 5000;

  // Digital Twin projection
  s.twin.unshift({
    id: `ftwin:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  });
  if (s.twin.length > 5000) s.twin.length = 5000;

  // Evidence Ledger
  s.evidence.unshift({
    id: `fevid:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "finance_operational",
    summary: `${input.type} on ${input.recordType} ${input.recordId}`,
    recordedAt: event.occurredAt,
  });
  if (s.evidence.length > 5000) s.evidence.length = 5000;

  // Organizational Memory
  s.memory.unshift({
    id: `fmem:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    title: input.type,
    rememberedAt: event.occurredAt,
  });
  if (s.memory.length > 5000) s.memory.length = 5000;

  for (const sub of s.subscribers) {
    try {
      sub(event);
    } catch {
      /* isolate */
    }
  }
  return event;
}

export function listOperationalEvents(
  organizationId: string,
  limit = 100
): readonly OperationalFinanceEvent[] {
  return Object.freeze(
    store()
      .events.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}

export function listTwinProjections(
  organizationId: string,
  limit = 100
): readonly TwinProjection[] {
  return Object.freeze(
    store()
      .twin.filter((t) => t.organizationId === organizationId)
      .slice(0, limit)
  );
}

export function listEvidenceRecords(
  organizationId: string,
  limit = 100
): readonly EvidenceRecord[] {
  return Object.freeze(
    store()
      .evidence.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}

export function listMemoryRecords(
  organizationId: string,
  limit = 100
): readonly MemoryRecord[] {
  return Object.freeze(
    store()
      .memory.filter((m) => m.organizationId === organizationId)
      .slice(0, limit)
  );
}

export function subscribeOperationalEvents(
  fn: (e: OperationalFinanceEvent) => void
): () => void {
  store().subscribers.push(fn);
  return () => {
    const arr = store().subscribers;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  };
}

export const OPERATIONAL_SINKS = Object.freeze({
  digitalTwin: true,
  evidenceLedger: true,
  organizationalMemory: true,
});
