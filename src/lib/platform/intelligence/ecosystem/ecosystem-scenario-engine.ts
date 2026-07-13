import type { EcosystemScenarioEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_SCENARIOS, type EcosystemScenarioSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemScenarioEngine implements EcosystemScenarioEngineContract {
  assess(input: Parameters<EcosystemScenarioEngineContract["assess"]>[0]): EcosystemScenarioSuite {
    const scenarios = ECOSYSTEM_SCENARIOS.map((kind, index) => {
      const pressure = input.baseline.dependencyRisk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("esm-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        partnershipImpact: clamp(input.baseline.strategicPartnerships - index * 2),
        dependencyImpact: clamp(input.baseline.dependencyRisk + index * 2),
        monitors: [`monitor:${kind}`, "monitor:ecosystem-health"],
        lenses: buildLens({
          networkStrength: `Scenario network strength for ${kind}.`,
          strategicPartnerships: `Scenario strategic partnerships for ${kind}.`,
          ecosystemHealth: `Scenario ecosystem health for ${kind}.`,
          collaborationPotential: `Scenario collaboration potential for ${kind}.`,
          dependencyRisk: `Scenario dependency risk for ${kind}.`,
          networkEffects: `Scenario network effects for ${kind}.`,
          strategicPosition: `Scenario strategic position for ${kind}.`,
          longTermEcosystemOutlook: `Long-term ecosystem outlook under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary ecosystem scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
