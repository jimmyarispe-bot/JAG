import type { WisdomScenarioEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/wisdom/models";
import { WISDOM_SCENARIOS, type WisdomScenarioSuite } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomScenarioEngine implements WisdomScenarioEngineContract {
  assess(input: Parameters<WisdomScenarioEngineContract["assess"]>[0]): WisdomScenarioSuite {
    const scenarios = WISDOM_SCENARIOS.map((kind, index) => {
      const pressure = clamp(100 - input.baseline.wisdomScore);
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("wis-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        judgmentImpact: clamp(input.baseline.strategicValue - index * 2),
        timingImpact: clamp(input.baseline.longTermImpact - index * 2),
        monitors: [`monitor:${kind}`, "monitor:wisdom-intelligence"],
        lenses: buildLens({
          strategicValue: `Scenario strategic value for ${kind}.`,
          longTermImpact: `Scenario long-term impact for ${kind}.`,
          confidenceLevel: `Scenario confidence level for ${kind}.`,
          evidenceQuality: `Scenario evidence quality for ${kind}.`,
          tradeOffBalance: `Scenario trade-off balance for ${kind}.`,
          organizationalAlignment: `Scenario organizational alignment for ${kind}.`,
          ethicalIntegrity: `Scenario ethical integrity for ${kind}.`,
          wisdomScore: `Wisdom score under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary wisdom scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
