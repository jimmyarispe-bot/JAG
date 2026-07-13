import type { MotivationEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { MotivationSuite } from "@/lib/platform/intelligence/behavioral/types";

export class MotivationEngine implements MotivationEngineContract {
  assess(input: Parameters<MotivationEngineContract["assess"]>[0]): MotivationSuite {
    const suite = input.areas.motivation;
    const records = suite.records.map(record => ({
      id: input.createId("beh-motivation"),
      title: record.title,
      motivation: record.score,
      lenses: record.lenses,
      narrative: `Motivation: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      motivationIndex: input.baseline.motivationAlignment,
      narrative: `Motivation suite index ${Math.round(input.baseline.motivationAlignment)}.`,
    };
  }
}
