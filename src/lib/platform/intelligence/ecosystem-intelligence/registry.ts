import type { EcosystemFederationResult } from "@/lib/platform/intelligence/ecosystem-intelligence/types";
import {
  ECOSYSTEM_INTELLIGENCE_MODULE_ID,
  ECOSYSTEM_FEDERATION_VERSION,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export function toEcosystemFederationRegistryRecord(result: EcosystemFederationResult) {
  return {
    moduleId: ECOSYSTEM_INTELLIGENCE_MODULE_ID,
    version: ECOSYSTEM_FEDERATION_VERSION,
    requestId: result.requestId,
    authorizedCount: result.federation.authorizedCount,
    excludedCount: result.federation.excludedCount,
    riskCount: result.model.risks.length,
    opportunityCount: result.model.opportunities.length,
    confidence: result.explainability.confidence,
    generatedAt: result.generatedAt,
  };
}
