import type {
  ContradictionFinding,
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
} from "@/lib/platform/intelligence/synthesis/types";

export function createContradictionAnalyzer(): SynthesisAnalyzer {
  return {
    id: "contradiction",
    name: "Contradiction Analyzer",
    version: "0.1.0",
    analyze(context: SynthesisAnalyzerContext) {
      const { signals, createId } = context;
      const contradictions: ContradictionFinding[] = [];

      const up = signals.filter((s) => s.direction === "up" || (s.score != null && s.score >= 70));
      const down = signals.filter((s) => s.direction === "down" || (s.score != null && s.score < 45));

      for (const a of up) {
        for (const b of down) {
          if (a.domain === b.domain) continue;
          const pairKey = [a.domain, b.domain].sort().join("|");
          if (contradictions.some((c) => c.domains.slice().sort().join("|") === pairKey)) continue;

          contradictions.push({
            id: createId("contra"),
            title: `Tension between ${a.domain} and ${b.domain}`,
            domains: [a.domain, b.domain],
            statementA: a.narrative ?? `${a.domain} appears healthy (${a.score ?? a.direction})`,
            statementB: b.narrative ?? `${b.domain} appears stressed (${b.score ?? b.direction})`,
            explanation:
              "These signals conflict at face value. Common explanations include lagging indicators, campus-level concentration, or metric definition mismatch — investigate before acting on either alone.",
            confidence: 0.62,
          });
        }
      }

      return { contradictions: contradictions.slice(0, 8) };
    },
  };
}
