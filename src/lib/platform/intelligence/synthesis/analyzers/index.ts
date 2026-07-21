import { createCorrelationAnalyzer } from "@/lib/platform/intelligence/synthesis/analyzers/correlation-analyzer";
import { createContradictionAnalyzer } from "@/lib/platform/intelligence/synthesis/analyzers/contradiction-analyzer";
import { createTrendAnalyzer } from "@/lib/platform/intelligence/synthesis/analyzers/trend-analyzer";
import { createOpportunityAnalyzer } from "@/lib/platform/intelligence/synthesis/analyzers/opportunity-analyzer";
import { createRiskAnalyzer } from "@/lib/platform/intelligence/synthesis/analyzers/risk-analyzer";
import type { SynthesisAnalyzer } from "@/lib/platform/intelligence/synthesis/types";

export function createBuiltinAnalyzers(): SynthesisAnalyzer[] {
  return [
    createCorrelationAnalyzer(),
    createContradictionAnalyzer(),
    createTrendAnalyzer(),
    createOpportunityAnalyzer(),
    createRiskAnalyzer(),
  ];
}

export {
  createCorrelationAnalyzer,
  createContradictionAnalyzer,
  createTrendAnalyzer,
  createOpportunityAnalyzer,
  createRiskAnalyzer,
};
