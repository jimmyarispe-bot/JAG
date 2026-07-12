/** Opportunity ranking suite (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import type * as T from "@/lib/platform/intelligence/opportunity/types";
import { OPPORTUNITY_RANKING_LENSES } from "@/lib/platform/intelligence/opportunity/types";

function sortBy(records: T.OpportunityExchangeRecord[], compare: (a: T.OpportunityExchangeRecord, b: T.OpportunityExchangeRecord) => number): T.OpportunityExchangeRecord[] {
  return [...records].sort(compare).slice(0, 12);
}

export class OpportunityRankingEngine implements C.OpportunityRankingEngine {
  rank({ records, lens }: Parameters<C.OpportunityRankingEngine["rank"]>[0]): T.OpportunityRankingResult {
    let opportunities: T.OpportunityExchangeRecord[];
    let narrative: string;
    switch (lens) {
      case "highest_roi":
        opportunities = sortBy(records, (a, b) => b.roi - a.roi);
        narrative = "Ranked by highest projected ROI.";
        break;
      case "quick_wins":
        opportunities = sortBy(
          records.filter((r) => r.expectedTimelineDays <= 90),
          (a, b) => a.expectedTimelineDays - b.expectedTimelineDays || b.score - a.score
        );
        if (!opportunities.length) opportunities = sortBy(records, (a, b) => a.expectedTimelineDays - b.expectedTimelineDays);
        narrative = "Ranked by fastest time-to-value with strong scores.";
        break;
      case "strategic_investments":
        opportunities = sortBy(
          records.filter((r) => r.expectedTimelineDays > 90 || r.implementationCost > 100_000),
          (a, b) => b.estimatedFinancialImpact - a.estimatedFinancialImpact
        );
        if (!opportunities.length) opportunities = sortBy(records, (a, b) => b.estimatedFinancialImpact - a.estimatedFinancialImpact);
        narrative = "Ranked as strategic investments with larger, longer-cycle upside.";
        break;
      case "mission_critical":
        opportunities = sortBy(records, (a, b) => b.estimatedMissionImpact - a.estimatedMissionImpact);
        narrative = "Ranked by mission impact criticality.";
        break;
      case "long_term_growth":
        opportunities = sortBy(records, (a, b) => b.estimatedFinancialImpact * b.organizationalDnaAlignment.stageFit - a.estimatedFinancialImpact * a.organizationalDnaAlignment.stageFit);
        narrative = "Ranked by long-term growth contribution.";
        break;
      case "highest_confidence":
        opportunities = sortBy(records, (a, b) => b.confidence - a.confidence);
        narrative = "Ranked by highest confidence.";
        break;
      case "lowest_risk":
        opportunities = sortBy(records, (a, b) => a.risks.reduce((s, r) => s + r.score, 0) / Math.max(1, a.risks.length) - b.risks.reduce((s, r) => s + r.score, 0) / Math.max(1, b.risks.length));
        narrative = "Ranked by lowest composite risk.";
        break;
      default:
        opportunities = sortBy(records, (a, b) => b.score - a.score);
        narrative = "Ranked by composite opportunity score.";
    }
    return { lens, opportunities, narrative };
  }

  rankAll({ records }: Parameters<C.OpportunityRankingEngine["rankAll"]>[0]): T.OpportunityRankingResult[] {
    return OPPORTUNITY_RANKING_LENSES.map((lens) => this.rank({ records, lens }));
  }
}
