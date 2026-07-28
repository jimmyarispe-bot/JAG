/**
 * Financial audit trail — every mutating action.
 */

import { randomUUID } from "node:crypto";
import { appendAudit, listAudit } from "../store";
import type { FinanceAuditEvent } from "../types";

export function recordFinanceAudit(input: {
  organizationId: string;
  action: string;
  recordType: string;
  recordId: string;
  userId: string;
  previousValue?: unknown;
  newValue?: unknown;
  approval?: string | null;
}): FinanceAuditEvent {
  return appendAudit({
    id: `faud:${randomUUID()}`,
    organizationId: input.organizationId,
    action: input.action,
    recordType: input.recordType,
    recordId: input.recordId,
    userId: input.userId,
    timestamp: new Date().toISOString(),
    previousValue:
      input.previousValue === undefined
        ? null
        : JSON.stringify(input.previousValue),
    newValue:
      input.newValue === undefined ? null : JSON.stringify(input.newValue),
    approval: input.approval ?? null,
  });
}

export { listAudit as listFinanceAudit };
