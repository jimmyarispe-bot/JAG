import type { GovernmentFundingEngineContract } from "@/lib/platform/intelligence/political/contracts";
import type { GovernmentFundingSuite } from "@/lib/platform/intelligence/political/types";

export class GovernmentFundingEngine implements GovernmentFundingEngineContract {
  assess(input: Parameters<GovernmentFundingEngineContract["assess"]>[0]): GovernmentFundingSuite {
    const suite = input.areas.public_funding;
    const records = suite.records.map(record => ({
      id: input.createId("pol-funding"),
      title: record.title,
      opportunity: record.score,
      lenses: record.lenses,
      narrative: `Funding opportunity: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      opportunityIndex: input.baseline.fundingOpportunity,
      narrative: `Government funding suite opportunity index ${Math.round(input.baseline.fundingOpportunity)}.`,
    };
  }
}
