/**
 * Intelligence Platform Infrastructure — built-in module providers (Sprint 027).
 */

export { createOrganizationHealthModule, ORGANIZATION_HEALTH_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/organization-health";
export { createFinancialIntelligenceModule, FINANCIAL_INTELLIGENCE_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/financial";
export { createFounderIntelligenceModule, FOUNDER_INTELLIGENCE_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/founder";
export { createExecutiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/executive";
export { createExecutiveGraphModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-graph";
export { createExecutiveDecisionModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-decision";

import type { IntelligenceModule, IntelligenceProvider } from "@/lib/platform/intelligence/infrastructure/contracts";
import { createIntelligenceProvider } from "@/lib/platform/intelligence/infrastructure/provider";
import { createOrganizationHealthModule } from "@/lib/platform/intelligence/infrastructure/modules/organization-health";
import { createFinancialIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/financial";
import { createFounderIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/founder";
import { createExecutiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/executive";
import { createExecutiveGraphModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-graph";
import { createExecutiveDecisionModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-decision";
import type {
  CreateExecutiveDecisionOptions,
  ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import type {
  CreateExecutiveGraphAnalyzerOptions,
  ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";

export interface CreateDefaultModulesOptions {
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  decision?: ExecutiveDecisionStack;
}

/** Create the default set of integrated intelligence modules. */
export function createDefaultIntelligenceModules(
  options: CreateDefaultModulesOptions = {}
): IntelligenceModule[] {
  return [
    createOrganizationHealthModule(),
    createFinancialIntelligenceModule(),
    createFounderIntelligenceModule(),
    createExecutiveIntelligenceModule(),
    createExecutiveGraphModule(options.graphAnalyzerOptions, options.graphAnalyzer),
    createExecutiveDecisionModule(options.decisionOptions, options.decision),
  ];
}

/** Default provider that auto-registers all integrated modules. */
export function createDefaultIntelligenceProvider(
  options: CreateDefaultModulesOptions = {}
): IntelligenceProvider {
  return createIntelligenceProvider(
    "default-intelligence-modules",
    createDefaultIntelligenceModules(options)
  );
}
