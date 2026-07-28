import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { listAllocations, upsertAllocation } from "../store";
import type { Allocation } from "../types";

export function postAllocation(input: {
  organizationId: string;
  userId: string;
  name: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  periodKey: string;
  dimensionFilters?: Readonly<Record<string, string>>;
}): Allocation {
  if (input.amount === 0) throw new Error("allocation amount required");
  const allocation = upsertAllocation({
    id: newId("alloc"),
    organizationId: input.organizationId,
    name: input.name,
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    periodKey: input.periodKey,
    dimensionFilters: Object.freeze({ ...(input.dimensionFilters ?? {}) }),
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.allocation_posted",
    organizationId: input.organizationId,
    recordType: "allocation",
    recordId: allocation.id,
    actorUserId: input.userId,
    payload: {
      amount: allocation.amount,
      periodKey: allocation.periodKey,
    },
  });
  return allocation;
}

export { listAllocations };
