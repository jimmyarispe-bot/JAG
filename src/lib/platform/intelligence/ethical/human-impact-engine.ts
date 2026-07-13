import type { HumanImpactEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import type { HumanImpactSuite } from "@/lib/platform/intelligence/ethical/types";

export class HumanImpactEngine implements HumanImpactEngineContract {
  assess(input: Parameters<HumanImpactEngineContract["assess"]>[0]): HumanImpactSuite {
    const suite = input.areas.human_impact;
    const records = suite.records.map(record => ({
      id: input.createId("eth-human"),
      title: record.title,
      impact: record.score,
      lenses: record.lenses,
      narrative: `Human impact: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      humanImpactIndex: input.baseline.humanImpact,
      narrative: `Human impact suite index ${Math.round(input.baseline.humanImpact)}.`,
    };
  }
}
