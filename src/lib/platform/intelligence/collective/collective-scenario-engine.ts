import type { CollectiveScenarioEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/collective/models";
import { COLLECTIVE_SCENARIOS, type CollectiveScenarioSuite } from "@/lib/platform/intelligence/collective/types";

export class CollectiveScenarioEngine implements CollectiveScenarioEngineContract {
  assess(input: Parameters<CollectiveScenarioEngineContract["assess"]>[0]): CollectiveScenarioSuite {
    const scenarios = COLLECTIVE_SCENARIOS.map((kind, index) => {
      const pressure = clamp(100 - input.baseline.collectiveConfidence);
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("col-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        consensusImpact: clamp(input.baseline.consensusStrength - index * 2),
        expertiseImpact: clamp(input.baseline.expertiseCoverage - index * 2),
        monitors: [`monitor:${kind}`, "monitor:collective-intelligence"],
        lenses: buildLens({
          consensusStrength: `Scenario consensus strength for ${kind}.`,
          expertiseCoverage: `Scenario expertise coverage for ${kind}.`,
          perspectiveDiversity: `Scenario perspective diversity for ${kind}.`,
          crossDomainAgreement: `Scenario cross-domain agreement for ${kind}.`,
          organizationalAlignment: `Scenario organizational alignment for ${kind}.`,
          collaborationQuality: `Scenario collaboration quality for ${kind}.`,
          collectiveConfidence: `Scenario collective confidence for ${kind}.`,
          longTermCollectiveValue: `Long-term collective value under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary collective scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
