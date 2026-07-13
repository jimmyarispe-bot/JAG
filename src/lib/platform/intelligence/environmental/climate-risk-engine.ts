import type { ClimateRiskEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import { priorityFromScore } from "@/lib/platform/intelligence/environmental/models";
import type { ClimateRiskSuite } from "@/lib/platform/intelligence/environmental/types";

export class ClimateRiskEngine implements ClimateRiskEngineContract {
  assess(input: Parameters<ClimateRiskEngineContract["assess"]>[0]): ClimateRiskSuite {
    const areas = ["climate", "weather_risk", "carbon_emissions"] as const;
    const records = areas.flatMap(area =>
      input.areas[area].records.map(record => ({
        id: input.createId("env-climate-risk"),
        title: record.title,
        area,
        severity: priorityFromScore(record.score),
        score: 100 - record.score,
        lenses: record.lenses,
        narrative: record.narrative,
      }))
    );
    const aggregateRisk = (input.baseline.climateRisk + input.baseline.facilityExposure + input.baseline.insurancePressure) / 3;
    return {
      records,
      score: 100 - aggregateRisk,
      aggregateRisk,
      narrative: `Climate risk suite aggregates climate, weather, and carbon (${Math.round(aggregateRisk)} risk).`,
    };
  }
}
