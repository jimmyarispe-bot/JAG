import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import {
  getPeriod,
  listExceptions,
  upsertException,
} from "../store";
import type {
  ReconciliationException,
  ReconciliationExceptionKind,
} from "../types";
import { publishReconciliationSignal } from "../events";
import { recordReconciliationHistory } from "../history";

export function createException(input: {
  organizationId: string;
  userId?: string;
  periodId: string;
  kind: ReconciliationExceptionKind;
  severity: ReconciliationException["severity"];
  message: string;
  relatedIds?: readonly string[];
}): ReconciliationException {
  const ex = upsertException({
    id: `rex:${randomUUID()}`,
    organizationId: input.organizationId,
    periodId: input.periodId,
    kind: input.kind,
    severity: input.severity,
    message: input.message,
    relatedIds: Object.freeze([...(input.relatedIds ?? [])]),
    open: true,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  });
  publishReconciliationSignal({
    type: "reconciliation.exception_created",
    organizationId: input.organizationId,
    periodId: input.periodId,
    actorUserId: input.userId ?? null,
    payload: { exceptionId: ex.id, kind: ex.kind, severity: ex.severity },
  });
  if (input.userId) {
    recordReconciliationHistory({
      organizationId: input.organizationId,
      periodId: input.periodId,
      action: "exception_created",
      actorUserId: input.userId,
      currentState: ex,
    });
  }
  return ex;
}

export function resolveException(input: {
  organizationId: string;
  userId: string;
  exceptionId: string;
}): ReconciliationException | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "reconcile",
  });
  if ("error" in gate) return gate;
  const existing = listExceptions(input.organizationId).find(
    (e) => e.id === input.exceptionId
  );
  if (!existing) return { error: "Exception not found." };
  const period = getPeriod(existing.periodId);
  if (!period || period.status === "closed") {
    return { error: "Period is closed." };
  }
  const updated = upsertException({
    ...existing,
    open: false,
    resolvedAt: new Date().toISOString(),
    resolvedBy: input.userId,
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: existing.periodId,
    action: "exception_resolved",
    actorUserId: input.userId,
    previousState: existing,
    currentState: updated,
  });
  return updated;
}

export { listExceptions };
