import type { InstitutionalMemoryAnalysisEngineContract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/institutional-memory/models";
import { INSTITUTIONAL_MEMORY_ANALYSIS_KINDS, type InstitutionalMemoryAnalysisSuite } from "@/lib/platform/intelligence/institutional-memory/types";

/** Primary analysis engine (also exported as KnowledgeAnalysisEngine). */
export class InstitutionalMemoryAnalysisEngine implements InstitutionalMemoryAnalysisEngineContract {
  assess(input: Parameters<InstitutionalMemoryAnalysisEngineContract["assess"]>[0]): InstitutionalMemoryAnalysisSuite {
    const scoreFor = (kind: (typeof INSTITUTIONAL_MEMORY_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "knowledge_confidence": return clamp(input.baseline.knowledgeConfidence);
        case "evidence_strength": return clamp(input.baseline.evidenceStrength);
        case "institutional_memory_coverage": return clamp(input.baseline.institutionalMemoryCoverage);
        case "knowledge_freshness": return clamp(input.baseline.knowledgeFreshness);
        case "expertise_availability": return clamp(input.baseline.expertiseAvailability);
        case "knowledge_gaps": return clamp(100 - input.baseline.knowledgeGaps);
        case "knowledge_quality": return clamp(input.baseline.knowledgeQuality);
        case "long_term_learning_value": return clamp(input.baseline.longTermLearningValue);
        case "early_warning": return clamp(input.baseline.longTermLearningValue);
        default: return 65;
      }
    };
    const analyses = INSTITUTIONAL_MEMORY_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("imm-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          knowledgeConfidence: `Knowledge confidence through ${kind}.`,
          evidenceStrength: `Evidence strength reading for ${kind}.`,
          institutionalMemoryCoverage: `Institutional memory coverage for ${kind}.`,
          knowledgeFreshness: `Knowledge freshness around ${kind}.`,
          expertiseAvailability: `Expertise availability of ${kind}.`,
          knowledgeGaps: `Knowledge gaps in ${kind}.`,
          knowledgeQuality: `Knowledge quality for ${kind}.`,
          longTermLearningValue: `Long-term learning value via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...INSTITUTIONAL_MEMORY_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Institutional memory analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}

export { InstitutionalMemoryAnalysisEngine as KnowledgeAnalysisEngine };
