import type {
  RiskFinding,
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
} from "@/lib/platform/intelligence/synthesis/types";
import { scoreSignals } from "@/lib/platform/intelligence/synthesis/scoring/math";

export function createRiskAnalyzer(): SynthesisAnalyzer {
  return {
    id: "risk",
    name: "Cross-Domain Risk Analyzer",
    version: "0.1.0",
    analyze(context: SynthesisAnalyzerContext) {
      const { signals, createId } = context;
      const risks: RiskFinding[] = [];
      if (!signals.length) return { risks };

      const scores = scoreSignals(signals);
      const weak = signals.filter((s) => s.direction === "down" || (s.score != null && s.score < 50));

      if (weak.length) {
        risks.push({
          id: createId("risk-cluster"),
          title: "Cross-domain risk concentration",
          narrative: `${weak.length} domain signal(s) are stressed. Left unaddressed, degradation can cascade into enrollment, cash, and instructional continuity.`,
          severity: scores.severity,
          urgency: scores.urgency,
          domains: weak.map((s) => s.domain),
          confidence: scores.confidence / 100,
        });
      }

      if (scores.priority === "critical" || scores.priority === "high") {
        risks.push({
          id: createId("risk-exec"),
          title: "Executive attention required",
          narrative: `Composite priority is ${scores.priority} with business impact ${scores.businessImpact}/100.`,
          severity: scores.severity,
          urgency: scores.urgency,
          domains: [...new Set(signals.map((s) => s.domain))],
          confidence: scores.confidence / 100,
        });
      }

      return { risks };
    },
  };
}
