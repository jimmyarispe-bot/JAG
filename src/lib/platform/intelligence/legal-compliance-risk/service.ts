/**
 * Legal, Compliance & Risk Intelligence — service façade.
 */

import type {
  LegalComplianceRiskDependencies,
  LegalComplianceRiskIntelligenceService as LegalComplianceRiskIntelligenceServiceContract,
  LegalComplianceRiskRepository as LegalComplianceRiskRepositoryContract,
} from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import {
  LegalComplianceRiskIntelligenceEngineImpl,
  type LegalComplianceRiskIntelligenceEngine,
} from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-engine";
import type {
  LegalComplianceRiskQueryRequest,
  LegalComplianceRiskQueryResult,
  LegalComplianceRiskRequest,
  LegalComplianceRiskResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export interface LegalComplianceRiskServiceDependencies extends LegalComplianceRiskDependencies {
  engine?: LegalComplianceRiskIntelligenceEngine;
}

export class LegalComplianceRiskIntelligenceServiceImpl
  implements LegalComplianceRiskIntelligenceServiceContract
{
  private readonly engine: LegalComplianceRiskIntelligenceEngineImpl;

  constructor(dependencies: LegalComplianceRiskServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as LegalComplianceRiskIntelligenceEngineImpl | undefined) ??
      new LegalComplianceRiskIntelligenceEngineImpl(dependencies);
  }

  build(request: LegalComplianceRiskRequest): LegalComplianceRiskResult {
    return this.engine.build(request);
  }

  query(result: LegalComplianceRiskResult, request: LegalComplianceRiskQueryRequest): LegalComplianceRiskQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): LegalComplianceRiskRepositoryContract {
    return this.engine.repository;
  }
}

export { LegalComplianceRiskIntelligenceServiceImpl as LegalComplianceRiskIntelligenceService };
export { LegalComplianceRiskIntelligenceServiceImpl as LegalComplianceRiskService };
export { LegalComplianceRiskIntelligenceServiceImpl as LegalComplianceRiskServiceImpl };
