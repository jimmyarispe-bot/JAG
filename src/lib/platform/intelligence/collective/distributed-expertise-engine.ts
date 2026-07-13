import type { DistributedExpertiseEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import type { DistributedExpertiseSuite } from "@/lib/platform/intelligence/collective/types";

export class DistributedExpertiseEngine implements DistributedExpertiseEngineContract {
  assess(input: Parameters<DistributedExpertiseEngineContract["assess"]>[0]): DistributedExpertiseSuite {
    const suite = input.areas.distributed_expertise;
    const records = suite.records.map(record => ({
      id: input.createId("col-expertise"),
      title: record.title,
      coverage: record.score,
      lenses: record.lenses,
      narrative: `Distributed expertise: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      expertiseIndex: input.baseline.expertiseCoverage,
      narrative: `Distributed expertise suite index ${Math.round(input.baseline.expertiseCoverage)}.`,
    };
  }
}
