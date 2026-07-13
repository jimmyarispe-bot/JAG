import type { RecoveryEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { RecoverySuite } from "@/lib/platform/intelligence/resilience/types";

export class RecoveryEngine implements RecoveryEngineContract {
  assess(input: Parameters<RecoveryEngineContract["assess"]>[0]): RecoverySuite {
    const suite = input.areas.recovery_time_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-recovery"),
      title: record.title,
      recoveryTime: 100 - record.score,
      lenses: record.lenses,
      narrative: `Recovery analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      recoveryIndex: input.baseline.recoveryCapability,
      narrative: `Recovery suite index ${Math.round(input.baseline.recoveryCapability)}.`,
    };
  }
}
