import type {
  AnalyzerOutput,
  DomainSignalLight,
  RootCauseAnalysis,
} from "@/lib/platform/intelligence/synthesis/types";
import { evidenceFromSignals } from "@/lib/platform/intelligence/synthesis/root-cause/evidence";
import { rootCauseConfidence } from "@/lib/platform/intelligence/synthesis/root-cause/confidence";

export function analyzeRootCause(
  signals: DomainSignalLight[],
  analyzerOutput: AnalyzerOutput,
  createId: (prefix: string) => string
): RootCauseAnalysis {
  const evidence = evidenceFromSignals(signals, createId);
  const domains = [...new Set(signals.map((s) => s.domain))];
  const hrStress = signals.some(
    (s) => /human-capital|hr|staff|teacher/i.test(s.domain) && (s.direction === "down" || (s.score != null && s.score < 55))
  );
  const financeStress = signals.some(
    (s) => /finance|revenue|funding|cash/i.test(s.domain) && (s.direction === "down" || (s.score != null && s.score < 55))
  );
  const customerStress = signals.some(
    (s) => /customer|parent|admissions|enrollment/i.test(s.domain) && (s.direction === "down" || (s.score != null && s.score < 55))
  );

  let likelyCause = "Insufficient cross-domain evidence to isolate a single cause";
  const alternatives: string[] = [];

  if (hrStress && (financeStress || customerStress)) {
    likelyCause =
      "Staffing instability is the most plausible shared driver linking instructional continuity, parent confidence, and financial / enrollment pressure.";
    alternatives.push(
      "Campus-specific leadership or culture issue concentrated in one site",
      "Temporary seasonal enrollment cycle misread as structural decline",
      "Data definition mismatch between HR vacancies and finance cash timing"
    );
  } else if (financeStress) {
    likelyCause = "Financial stress appears primary; operational and customer metrics may lag cash / revenue signals.";
    alternatives.push("Accounting timing artifact", "One-time expense spike");
  } else if (customerStress) {
    likelyCause = "Customer / enrollment pressure is the leading signal; investigate service quality and competitive alternatives.";
    alternatives.push("Marketing funnel interruption", "Local demographic shift");
  } else if (signals.length) {
    likelyCause = "Diffuse multi-domain variance without a dominant driver — continue monitoring correlated degradations.";
    alternatives.push("Measurement noise", "Uncorrelated local incidents");
  }

  return {
    likelyCause,
    supportingEvidence: evidence,
    confidence: rootCauseConfidence(
      evidence.length,
      domains.length,
      analyzerOutput.contradictions.length > 0
    ),
    alternativeCauses: alternatives,
    affectedDomains: domains,
  };
}
