import type { ConflictDetectionEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { ConflictDetectionSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class ConflictDetectionEngine implements ConflictDetectionEngineContract {
  assess(input: Parameters<ConflictDetectionEngineContract["assess"]>[0]): ConflictDetectionSuite {
    const suite = input.areas.conflict_detection;
    const records = suite.records.map(record => ({
      id: input.createId("stk-conflict"),
      title: record.title,
      risk: 100 - record.score,
      lenses: record.lenses,
      narrative: `Conflict risk from ${record.title}: ${Math.round(100 - record.score)}.`,
    }));
    const conflictIndex = 100 - suite.score;
    return {
      records,
      score: suite.score,
      conflictIndex,
      narrative: `Conflict detection suite index ${Math.round(conflictIndex)}.`,
    };
  }
}
