import type { ResilienceScenarioEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_SCENARIOS, type ResilienceScenarioSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceScenarioEngine implements ResilienceScenarioEngineContract {
  assess(input: Parameters<ResilienceScenarioEngineContract["assess"]>[0]): ResilienceScenarioSuite {
    const scenarios = RESILIENCE_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.adaptiveCapacity;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("rsl-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        recoveryImpact: clamp(input.baseline.recoveryCapability - index * 2),
        continuityImpact: clamp(input.baseline.areaScores.business_continuity - index * 2),
        monitors: [`monitor:${kind}`, "monitor:adaptive-capacity"],
        lenses: buildLens({
          organizationalReadiness: `Scenario organizational readiness for ${kind}.`,
          recoveryCapability: `Scenario recovery capability for ${kind}.`,
          operationalStability: `Scenario operational stability for ${kind}.`,
          financialStability: `Scenario financial stability for ${kind}.`,
          workforceStability: `Scenario workforce stability for ${kind}.`,
          infrastructureReadiness: `Scenario infrastructure readiness for ${kind}.`,
          adaptiveCapacity: `Scenario adaptive capacity for ${kind}.`,
          longTermResilienceOutlook: `Long-term resilience outlook under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary resilience scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
