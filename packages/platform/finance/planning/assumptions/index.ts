import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { listAssumptions, upsertAssumption } from "../store";
import type { PlanningAssumption } from "../types";

export function setAssumption(input: {
  organizationId: string;
  userId: string;
  key: string;
  label: string;
  value: number | string | boolean;
  scenarioId?: string | null;
}): PlanningAssumption {
  const key = input.key.trim();
  if (!key) throw new Error("assumption key required");
  const prior = listAssumptions(input.organizationId).filter(
    (a) =>
      a.key === key &&
      (input.scenarioId ?? null) === (a.scenarioId ?? null)
  );
  const version =
    prior.reduce((m, a) => Math.max(m, a.version), 0) + 1;
  const assumption = upsertAssumption({
    id: newId("asm"),
    organizationId: input.organizationId,
    key,
    label: input.label.trim() || key,
    value: input.value,
    version,
    scenarioId: input.scenarioId ?? null,
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.assumption_set",
    organizationId: input.organizationId,
    recordType: "planning_assumption",
    recordId: assumption.id,
    actorUserId: input.userId,
    payload: {
      key: assumption.key,
      version: assumption.version,
      value: assumption.value,
    },
  });
  return assumption;
}

export { listAssumptions };
