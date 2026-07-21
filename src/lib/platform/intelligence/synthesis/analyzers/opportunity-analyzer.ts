import type {
  OpportunityFinding,
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
} from "@/lib/platform/intelligence/synthesis/types";

export function createOpportunityAnalyzer(): SynthesisAnalyzer {
  return {
    id: "opportunity",
    name: "Opportunity Detection Analyzer",
    version: "0.1.0",
    analyze(context: SynthesisAnalyzerContext) {
      const { signals, createId } = context;
      const opportunities: OpportunityFinding[] = [];

      const ops = signals.find((s) => /operations|systems|resilience/i.test(s.domain));
      if (ops && (ops.score == null || ops.score < 65)) {
        opportunities.push({
          id: createId("opp-ops"),
          title: "Operational efficiency unlock",
          category: "operational_efficiency",
          narrative:
            "Operational and systems signals leave headroom for process automation and load balancing before quality erodes further.",
          estimatedImpact: 68,
          confidence: 0.64,
          domains: [ops.domain],
        });
      }

      const funding = signals.find((s) => /funding|revenue|finance/i.test(s.domain));
      if (funding && funding.direction !== "down") {
        opportunities.push({
          id: createId("opp-fund"),
          title: "Funding / revenue capture window",
          category: "funding",
          narrative:
            "Financial posture is not collapsing — a targeted funding or pricing initiative can convert stability into growth.",
          estimatedImpact: 72,
          confidence: 0.58,
          domains: [funding.domain],
        });
      }

      const hr = signals.find((s) => /human-capital|hr|staff/i.test(s.domain));
      if (hr && (hr.direction === "down" || (hr.score != null && hr.score < 55))) {
        opportunities.push({
          id: createId("opp-staff"),
          title: "Staffing optimization opportunity",
          category: "staffing",
          narrative:
            "Elevated vacancy / turnover risk creates a window for retention incentives, scheduling redesign, and selective hiring before enrollment impact compounds.",
          estimatedImpact: 75,
          confidence: 0.7,
          domains: [hr.domain],
        });
      }

      if (!opportunities.length && signals.length) {
        opportunities.push({
          id: createId("opp-growth"),
          title: "Cross-domain growth scan",
          category: "growth",
          narrative:
            "No acute collapse detected — prioritize partnership and program pilots that amplify the strongest domain signals.",
          estimatedImpact: 55,
          confidence: 0.5,
          domains: signals.slice(0, 3).map((s) => s.domain),
        });
      }

      return { opportunities };
    },
  };
}
