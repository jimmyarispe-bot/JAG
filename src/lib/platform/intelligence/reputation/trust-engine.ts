import type { TrustEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import type { TrustSuite } from "@/lib/platform/intelligence/reputation/types";

export class TrustEngine implements TrustEngineContract {
  assess(input: Parameters<TrustEngineContract["assess"]>[0]): TrustSuite {
    const suite = input.areas.organizational_trust;
    const records = suite.records.map(record => ({
      id: input.createId("rep-trust"),
      title: record.title,
      trust: record.score,
      lenses: record.lenses,
      narrative: `Trust: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      trustIndex: input.baseline.trustLevel,
      narrative: `Trust suite index ${Math.round(input.baseline.trustLevel)}.`,
    };
  }
}
