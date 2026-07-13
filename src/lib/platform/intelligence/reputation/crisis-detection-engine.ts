import type { CrisisDetectionEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import type { CrisisDetectionSuite } from "@/lib/platform/intelligence/reputation/types";

export class CrisisDetectionEngine implements CrisisDetectionEngineContract {
  assess(input: Parameters<CrisisDetectionEngineContract["assess"]>[0]): CrisisDetectionSuite {
    const suite = input.areas.crisis_reputation;
    const records = suite.records.map(record => ({
      id: input.createId("rep-crisis"),
      title: record.title,
      risk: 100 - record.score,
      lenses: record.lenses,
      narrative: `Crisis risk: ${record.title} at ${Math.round(100 - record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      crisisIndex: input.baseline.crisisRisk,
      narrative: `Crisis detection suite index ${Math.round(input.baseline.crisisRisk)}.`,
    };
  }
}
