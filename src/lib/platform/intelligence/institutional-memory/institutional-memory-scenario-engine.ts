import type { InstitutionalMemoryScenarioEngineContract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/institutional-memory/models";
import { INSTITUTIONAL_MEMORY_SCENARIOS, type InstitutionalMemoryScenarioSuite } from "@/lib/platform/intelligence/institutional-memory/types";

export class InstitutionalMemoryScenarioEngine implements InstitutionalMemoryScenarioEngineContract {
  assess(input: Parameters<InstitutionalMemoryScenarioEngineContract["assess"]>[0]): InstitutionalMemoryScenarioSuite {
    const scenarios = INSTITUTIONAL_MEMORY_SCENARIOS.map((kind, index) => {
      const pressure = input.baseline.knowledgeGaps;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("imm-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        memoryImpact: clamp(input.baseline.institutionalMemoryCoverage - index * 2),
        expertiseImpact: clamp(input.baseline.expertiseAvailability - index * 2),
        monitors: [`monitor:${kind}`, "monitor:institutional-memory"],
        lenses: buildLens({
          knowledgeConfidence: `Scenario knowledge confidence for ${kind}.`,
          evidenceStrength: `Scenario evidence strength for ${kind}.`,
          institutionalMemoryCoverage: `Scenario institutional memory coverage for ${kind}.`,
          knowledgeFreshness: `Scenario knowledge freshness for ${kind}.`,
          expertiseAvailability: `Scenario expertise availability for ${kind}.`,
          knowledgeGaps: `Scenario knowledge gaps for ${kind}.`,
          knowledgeQuality: `Scenario knowledge quality for ${kind}.`,
          longTermLearningValue: `Long-term learning value under ${kind}.`,
        }),
        narrative: `${kind} probability ${Math.round(probability * 100)}% with impact ${Math.round(organizationalImpact)}.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary institutional memory scenario ${primary.kind.replaceAll("_", " ")}.`,
    };
  }
}
