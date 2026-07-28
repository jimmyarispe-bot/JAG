import { randomUUID } from "node:crypto";
import { appendHistory, listHistory } from "../store";
import type { ReconciliationHistoryEntry } from "../types";
import { recordFinanceAudit } from "../../audit";

export function recordReconciliationHistory(input: {
  organizationId: string;
  periodId: string;
  action: string;
  actorUserId: string;
  previousState?: unknown;
  currentState?: unknown;
}): ReconciliationHistoryEntry {
  const entry = appendHistory({
    id: `rhist:${randomUUID()}`,
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: input.action,
    actorUserId: input.actorUserId,
    at: new Date().toISOString(),
    previousState: input.previousState ?? null,
    currentState: input.currentState ?? null,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: `reconciliation.${input.action}`,
    recordType: "reconciliation_period",
    recordId: input.periodId,
    userId: input.actorUserId,
    previousValue: input.previousState,
    newValue: input.currentState,
  });
  return entry;
}

export { listHistory };
