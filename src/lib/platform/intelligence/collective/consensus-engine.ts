import type { ConsensusEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import type { ConsensusSuite } from "@/lib/platform/intelligence/collective/types";

export class ConsensusEngine implements ConsensusEngineContract {
  assess(input: Parameters<ConsensusEngineContract["assess"]>[0]): ConsensusSuite {
    const suite = input.areas.consensus_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("col-consensus"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: `Consensus: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      consensusIndex: input.baseline.consensusStrength,
      narrative: `Consensus suite index ${Math.round(input.baseline.consensusStrength)}.`,
    };
  }
}
