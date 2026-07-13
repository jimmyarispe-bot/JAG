import type { SystemsScenarioEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_SCENARIOS, type SystemsScenarioSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsScenarioEngine implements SystemsScenarioEngineContract {
  assess(input: Parameters<SystemsScenarioEngineContract["assess"]>[0]): SystemsScenarioSuite {
    const scenarios = SYSTEMS_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.areaScores.cascading_risk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("sys-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        dependencyImpact: clamp(input.baseline.dependencyImpact - index * 2),
        cascadingImpact: clamp(input.baseline.cascadingRisk - index * 2),
        monitors: [`monitor:${kind}`, "monitor:cascading-risk"],
        lenses: buildLens({
          dependencyImpact: `Scenario dependency impact for ${kind}.`,
          bottleneckRisk: `Scenario bottleneck risk for ${kind}.`,
          feedbackStability: `Scenario feedback stability for ${kind}.`,
          systemComplexity: `Scenario system complexity for ${kind}.`,
          resourceFlow: `Scenario resource flow for ${kind}.`,
          cascadingRisk: `Scenario cascading risk for ${kind}.`,
          adaptability: `Scenario adaptability for ${kind}.`,
          longTermSystemHealth: `Long-term system health under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary systems scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
