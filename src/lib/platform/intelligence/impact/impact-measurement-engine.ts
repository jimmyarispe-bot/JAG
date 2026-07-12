import type { ImpactMeasurementEngineContract } from "@/lib/platform/intelligence/impact/contracts";
import { clamp } from "@/lib/platform/intelligence/impact/models";
import { IMPACT_AREAS, MEASUREMENT_KINDS, type ImpactMeasurement, type ImpactMeasurementSuite } from "@/lib/platform/intelligence/impact/types";
export class ImpactMeasurementEngine implements ImpactMeasurementEngineContract {
  assess(input: Parameters<ImpactMeasurementEngineContract["assess"]>[0]): ImpactMeasurementSuite {
    const measurements: ImpactMeasurement[] = MEASUREMENT_KINDS.map((kind, index) => {
      const area = IMPACT_AREAS[index % IMPACT_AREAS.length]; const current = clamp(input.baseline.areaScores[area] + index % 3);
      const indicatorType = kind === "leading_indicator" ? "leading" as const : kind === "lagging_indicator" ? "lagging" as const : index % 2 ? "leading" as const : "lagging" as const;
      return { id: input.createId(kind === "kpi" ? "imp-kpi" : "imp-measure"), name: `${area} ${kind}`, kind, indicatorType, area, baseline: clamp(current - 5), current, target: clamp(current + 10), unit: "score", trend: current >= 65 ? "improving" : "stable", benchmark: clamp(current + 4), forecast: clamp(current + 6), history: [clamp(current - 8), clamp(current - 5), clamp(current - 2), current], narrative: `${kind} tracks ${area} impact.` };
    });
    return { measurements, kindsCovered: [...MEASUREMENT_KINDS], leadingCount: measurements.filter(m => m.indicatorType === "leading").length, laggingCount: measurements.filter(m => m.indicatorType === "lagging").length, maturityScore: input.baseline.measurementMaturity, narrative: `Measurement suite covers ${MEASUREMENT_KINDS.length} kinds with baselines, benchmarks, trends, longitudinal history, and forecasts.` };
  }
}
