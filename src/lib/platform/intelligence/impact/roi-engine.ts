import type { RoiEngineContract } from "@/lib/platform/intelligence/impact/contracts";
import { buildLens, levelFromValue } from "@/lib/platform/intelligence/impact/models";
import type { RoiSuite } from "@/lib/platform/intelligence/impact/types";
export class RoiEngine implements RoiEngineContract {
  assess(input: Parameters<RoiEngineContract["assess"]>[0]): RoiSuite {
    const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
    const make = (kind: "roi" | "sroi", investment: number, multiplier: number) => { const valueCreated = Math.round(investment * multiplier); return { id: input.createId("imp-roi"), title: kind === "roi" ? "Financial return on impact investment" : "Social return on investment", kind, investment, valueCreated, ratio: multiplier, confidence, lenses: buildLens({ outcomeAchieved: `${multiplier.toFixed(2)}x ${kind.toUpperCase()}.`, evidenceSupports: input.outcomes.narrative, baselineUsed: `$${investment.toLocaleString()} investment baseline.`, whatChanged: `$${valueCreated.toLocaleString()} value created.`, confidenceLevel: confidence, causeAttribution: "Value weighted by outcome attribution.", goalsImproved: kind === "roi" ? "Financial sustainability." : "Mission and community value.", nextImprovement: "Strengthen valuation evidence and attribution." }), narrative: `${kind.toUpperCase()} ${multiplier.toFixed(2)}x.` }; };
    const analyses = [make("roi", 250000, 1 + input.outcomes.achievementScore / 100), make("sroi", 250000, 1.5 + input.outcomes.achievementScore / 80)];
    return { analyses, roi: analyses[0].ratio, sroi: analyses[1].ratio, valueCreated: analyses.reduce((s, r) => s + r.valueCreated, 0), narrative: `ROI ${analyses[0].ratio.toFixed(2)}x; SROI ${analyses[1].ratio.toFixed(2)}x.` };
  }
}
