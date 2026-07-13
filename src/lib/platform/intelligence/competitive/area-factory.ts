import type { CompetitiveAreaIntelligence } from "@/lib/platform/intelligence/competitive/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/competitive/models";
import type { CompetitiveArea, CompetitiveAreaSuite } from "@/lib/platform/intelligence/competitive/types";

export function createAreaIntelligence(
  area: CompetitiveArea,
  titles: [string, string],
  forceLabel: string,
): new () => CompetitiveAreaIntelligence {
  return class implements CompetitiveAreaIntelligence {
    assess(input: Parameters<CompetitiveAreaIntelligence["assess"]>[0]): CompetitiveAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("cmp-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            competitiveThreatExists: `${forceLabel} competitive threat scored ${Math.round(value)}.`,
            evidenceSupports: `Current ${area} indicators and competitive soft signals.`,
            competitorsInvolved: `Peer institutions and substitute providers in ${area}.`,
            ourDifferentiation: `Differentiation advantage tracked against ${area} movement.`,
            enrollmentOrRevenueImpact: `Enrollment and revenue exposure linked to ${area} conditions.`,
            responseOptions: `Monitor, differentiate, reposition, or partner around ${area}.`,
            organizationalCapabilitiesRequired: `Strategy, marketing, admissions, and academic capabilities.`,
            signalsToMonitor: `${area} competitive shift, peer moves, and market signals.`,
          }),
          narrative: `${item.title} score ${Math.round(value)}.`,
        };
      });
      return {
        area,
        records,
        score,
        favorableCount: records.filter(r => r.status === "favorable").length,
        atRiskCount: records.filter(r => r.status === "at_risk").length,
        narrative: `${forceLabel} competitive score ${Math.round(score)}.`,
      };
    }
  };
}
