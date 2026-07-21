import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin/types";

export function closeCampusScenario(createId: (p: string) => string): ScenarioDefinition {
  return {
    id: createId("sc-close"),
    kind: "close_campus",
    label: "Close a campus",
    description: "Consolidate a campus; model cost savings vs enrollment/compliance risk.",
    parameters: { campusesClosed: 1, costSavePct: 12 },
  };
}

export function openLocationScenario(createId: (p: string) => string): ScenarioDefinition {
  return {
    id: createId("sc-open"),
    kind: "open_location",
    label: "Open a new location",
    description: "Expand footprint; model capital, staffing, and enrollment upside.",
    parameters: { locationsOpened: 1, startupCost: 450_000 },
  };
}
