import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { listAssumptions } from "../assumptions";
import {
  getScenario,
  listScenarios,
  upsertScenario,
} from "../store";
import type { Scenario, ScenarioKind } from "../types";

export function createScenario(input: {
  organizationId: string;
  userId: string;
  name: string;
  kind: ScenarioKind;
  assumptionIds?: readonly string[];
}): Scenario {
  const prior = listScenarios(input.organizationId).filter(
    (s) => s.name === input.name
  );
  const version = prior.reduce((m, s) => Math.max(m, s.version), 0) + 1;
  const scenario = upsertScenario({
    id: newId("scen"),
    organizationId: input.organizationId,
    name: input.name,
    kind: input.kind,
    version,
    assumptionIds: Object.freeze([...(input.assumptionIds ?? [])]),
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.scenario_created",
    organizationId: input.organizationId,
    recordType: "scenario",
    recordId: scenario.id,
    actorUserId: input.userId,
    payload: { kind: scenario.kind, version: scenario.version },
  });
  return scenario;
}

export function compareScenarios(input: {
  organizationId: string;
  scenarioIds: readonly string[];
}): {
  readonly scenarios: readonly Scenario[];
  readonly assumptionDiffs: readonly {
    readonly key: string;
    readonly values: Readonly<Record<string, number | string | boolean | null>>;
  }[];
} {
  const scenarios = input.scenarioIds
    .map((id) => getScenario(id))
    .filter((s): s is Scenario => Boolean(s && s.organizationId === input.organizationId));
  const allAssumptions = listAssumptions(input.organizationId);
  const keys = new Set<string>();
  for (const s of scenarios) {
    for (const id of s.assumptionIds) {
      const a = allAssumptions.find((x) => x.id === id);
      if (a) keys.add(a.key);
    }
  }
  const assumptionDiffs = [...keys].map((key) => {
    const values: Record<string, number | string | boolean | null> = {};
    for (const s of scenarios) {
      const match = allAssumptions.find(
        (a) => a.key === key && s.assumptionIds.includes(a.id)
      );
      values[s.id] = match?.value ?? null;
    }
    return Object.freeze({ key, values: Object.freeze(values) });
  });
  return Object.freeze({
    scenarios: Object.freeze(scenarios),
    assumptionDiffs: Object.freeze(assumptionDiffs),
  });
}

export { listScenarios, getScenario };
