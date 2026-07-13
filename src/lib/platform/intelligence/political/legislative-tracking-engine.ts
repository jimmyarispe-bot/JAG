import type { LegislativeTrackingEngineContract } from "@/lib/platform/intelligence/political/contracts";
import type { LegislativeTrackingSuite } from "@/lib/platform/intelligence/political/types";

export class LegislativeTrackingEngine implements LegislativeTrackingEngineContract {
  assess(input: Parameters<LegislativeTrackingEngineContract["assess"]>[0]): LegislativeTrackingSuite {
    const suite = input.areas.legislative;
    const records = suite.records.map((record, index) => ({
      id: input.createId("pol-bill"),
      title: record.title,
      status: index === 0 ? "in_committee" : "floor_ready",
      score: record.score,
      lenses: record.lenses,
      narrative: `Bill status: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      activeCount: records.length,
      narrative: `Legislative tracking monitors ${records.length} active bill signals (score ${Math.round(suite.score)}).`,
    };
  }
}
