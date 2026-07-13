import type { ConstraintEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { ConstraintSuite } from "@/lib/platform/intelligence/systems/types";

export class ConstraintEngine implements ConstraintEngineContract {
  assess(input: Parameters<ConstraintEngineContract["assess"]>[0]): ConstraintSuite {
    const suite = input.areas.constraint_identification;
    const records = suite.records.map(record => ({
      id: input.createId("sys-constraint"),
      title: record.title,
      tightness: record.score,
      lenses: record.lenses,
      narrative: `Constraint analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      constraintIndex: input.baseline.areaScores.constraint_identification,
      narrative: `Constraint suite index ${Math.round(input.baseline.areaScores.constraint_identification)}.`,
    };
  }
}
