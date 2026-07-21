import type {
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
  SynthesisTrendWindow,
  TrendFinding,
} from "@/lib/platform/intelligence/synthesis/types";

const WINDOWS: SynthesisTrendWindow[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "year_over_year",
];

export function createTrendAnalyzer(): SynthesisAnalyzer {
  return {
    id: "trend",
    name: "Trend Correlation Analyzer",
    version: "0.1.0",
    analyze(context: SynthesisAnalyzerContext) {
      const { signals, createId } = context;
      const trends: TrendFinding[] = [];
      if (!signals.length) return { trends };

      const down = signals.filter((s) => s.direction === "down").length;
      const up = signals.filter((s) => s.direction === "up").length;
      const direction =
        down > up + 1 ? "degrading" : up > down + 1 ? "improving" : down === up ? "stable" : "mixed";

      for (const window of WINDOWS) {
        trends.push({
          id: createId(`trend-${window}`),
          title: `${window.replace(/_/g, " ")} cross-domain pattern`,
          window,
          domains: [...new Set(signals.map((s) => s.domain))],
          direction,
          narrative:
            direction === "degrading"
              ? `Across the ${window.replace(/_/g, " ")} lens, more domains are weakening than strengthening — watch for cascading operational risk.`
              : direction === "improving"
                ? `Across the ${window.replace(/_/g, " ")} lens, improvement signals outweigh declines.`
                : `Across the ${window.replace(/_/g, " ")} lens, signals are mixed or stable — monitor for divergence.`,
          confidence: Math.min(0.9, 0.4 + signals.length * 0.05),
        });
      }

      return { trends };
    },
  };
}
