import type {
  ScenarioDefinition,
  ScenarioKind,
} from "@/lib/platform/intelligence/digital-twin/types";

export function customScenario(
  createId: (p: string) => string,
  input: {
    kind?: ScenarioKind;
    label: string;
    description?: string;
    parameters?: Record<string, number | string | boolean>;
  }
): ScenarioDefinition {
  return {
    id: createId("sc-custom"),
    kind: input.kind ?? "custom",
    label: input.label,
    description: input.description ?? input.label,
    parameters: input.parameters ?? {},
  };
}

export function launchInitiativeScenario(
  createId: (p: string) => string,
  title = "Strategic initiative"
): ScenarioDefinition {
  return {
    id: createId("sc-launch"),
    kind: "launch_initiative",
    label: `Launch: ${title}`,
    description: `Add initiative "${title}" into the twin portfolio sandbox.`,
    parameters: { initiativeTitle: title, plannedBudget: 100_000 },
  };
}
