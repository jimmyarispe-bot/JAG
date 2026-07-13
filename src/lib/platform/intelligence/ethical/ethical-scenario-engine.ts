import type { EthicalScenarioEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_SCENARIOS, type EthicalScenarioSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalScenarioEngine implements EthicalScenarioEngineContract {
  assess(input: Parameters<EthicalScenarioEngineContract["assess"]>[0]): EthicalScenarioSuite {
    const scenarios = ETHICAL_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.areaScores.ethical_risk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("eth-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        valuesImpact: clamp(input.baseline.valuesAlignment - index * 2),
        humanImpact: clamp(input.baseline.humanImpact - index * 2),
        monitors: [`monitor:${kind}`, "monitor:ethical-risk"],
        lenses: buildLens({
          valuesAlignment: `Scenario values alignment for ${kind}.`,
          fairness: `Scenario fairness for ${kind}.`,
          transparency: `Scenario transparency for ${kind}.`,
          accountability: `Scenario accountability for ${kind}.`,
          humanImpact: `Scenario human impact for ${kind}.`,
          biasRisk: `Scenario bias risk for ${kind}.`,
          governanceIntegrity: `Scenario governance integrity for ${kind}.`,
          longTermEthicalOutlook: `Long-term ethical outlook under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary ethical scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
