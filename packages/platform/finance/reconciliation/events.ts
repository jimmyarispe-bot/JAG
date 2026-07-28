/**
 * Reconciliation → Organizational Digital Twin signal source.
 * In-process bus; subscribers (Risk / Performance / Innovation / Mr. JAG) can attach.
 */

import { randomUUID } from "node:crypto";
import { appendSignal, listSignals, subscribeSignals } from "./store";
import type {
  ReconciliationSignalEvent,
  ReconciliationSignalEventType,
} from "./types";
import { RECONCILIATION_SIGNAL_TYPES } from "./types";

export function publishReconciliationSignal(input: {
  type: ReconciliationSignalEventType;
  organizationId: string;
  periodId?: string | null;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
}): ReconciliationSignalEvent {
  return appendSignal({
    id: `rsig:${randomUUID()}`,
    type: input.type,
    organizationId: input.organizationId,
    periodId: input.periodId ?? null,
    occurredAt: new Date().toISOString(),
    actorUserId: input.actorUserId ?? null,
    payload: Object.freeze({ ...(input.payload ?? {}) }),
  });
}

export function describeDigitalTwinSignals(): {
  readonly signalSource: true;
  readonly eventTypes: readonly ReconciliationSignalEventType[];
  readonly consumers: readonly string[];
} {
  return Object.freeze({
    signalSource: true as const,
    eventTypes: RECONCILIATION_SIGNAL_TYPES,
    consumers: Object.freeze([
      "Risk Intelligence",
      "Performance Intelligence",
      "Innovation Intelligence",
      "Mr. JAG",
      "Organizational Digital Twin",
    ]),
  });
}

export { listSignals, subscribeSignals };
