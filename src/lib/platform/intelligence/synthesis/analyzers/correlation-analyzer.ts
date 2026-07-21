import type {
  CorrelationFinding,
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
} from "@/lib/platform/intelligence/synthesis/types";

export function createCorrelationAnalyzer(): SynthesisAnalyzer {
  return {
    id: "correlation",
    name: "Cross-Domain Correlation Analyzer",
    version: "0.1.0",
    analyze(context: SynthesisAnalyzerContext) {
      const { signals, createId } = context;
      const correlations: CorrelationFinding[] = [];
      if (signals.length < 2) return { correlations };

      const degrading = signals.filter(
        (s) => s.direction === "down" || (s.score != null && s.score < 55)
      );
      if (degrading.length >= 2) {
        const domains = [...new Set(degrading.map((s) => s.domain))];
        correlations.push({
          id: createId("corr"),
          title: "Multi-domain degradation cluster",
          domains,
          strength: Math.min(0.95, 0.45 + degrading.length * 0.1),
          narrative: `Signals from ${domains.join(", ")} move together toward deterioration, suggesting a shared underlying driver rather than isolated noise.`,
          evidence: degrading.map((s, i) => ({
            id: createId(`ev-${i}`),
            domain: s.domain,
            statement: s.narrative ?? `${s.domain} score ${s.score ?? "n/a"} (${s.direction ?? "unknown"})`,
            weight: 0.7,
            supporting: true,
          })),
        });
      }

      const finance = signals.find((s) => /finance|revenue|funding|cash/i.test(s.domain));
      const hr = signals.find((s) => /human-capital|hr|staff|teacher/i.test(s.domain));
      const customer = signals.find((s) => /customer|parent|admissions|enrollment/i.test(s.domain));
      if (finance && hr && customer) {
        correlations.push({
          id: createId("corr-staffing"),
          title: "Staffing–finance–enrollment linkage",
          domains: [finance.domain, hr.domain, customer.domain],
          strength: 0.78,
          narrative:
            "Finance, human capital, and customer/enrollment signals co-vary — staffing instability often precedes instructional continuity risk and enrollment pressure.",
          evidence: [finance, hr, customer].map((s, i) => ({
            id: createId(`ev-s-${i}`),
            domain: s.domain,
            statement: s.narrative ?? `${s.domain}: ${s.direction ?? "flat"} @ ${s.score ?? "?"}`,
            weight: 0.8,
            supporting: true,
          })),
        });
      }

      return { correlations };
    },
  };
}
