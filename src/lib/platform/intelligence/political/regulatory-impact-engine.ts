import type { RegulatoryImpactEngineContract } from "@/lib/platform/intelligence/political/contracts";
import type { RegulatoryImpactSuite } from "@/lib/platform/intelligence/political/types";

export class RegulatoryImpactEngine implements RegulatoryImpactEngineContract {
  assess(input: Parameters<RegulatoryImpactEngineContract["assess"]>[0]): RegulatoryImpactSuite {
    const suite = input.areas.regulatory;
    const records = suite.records.map(record => ({
      id: input.createId("pol-reg"),
      title: record.title,
      impact: 100 - record.score,
      lenses: record.lenses,
      narrative: `Regulatory impact from ${record.title}: ${Math.round(100 - record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      pressure: input.baseline.regulatoryBurden,
      narrative: `Regulatory impact suite pressure ${Math.round(input.baseline.regulatoryBurden)}.`,
    };
  }
}
