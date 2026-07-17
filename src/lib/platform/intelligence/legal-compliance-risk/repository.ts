/**
 * Legal, Compliance & Risk Intelligence — repository.
 */

import type { LegalComplianceRiskRepository as LegalComplianceRiskRepositoryContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import type {
  GraphScope,
  LegalComplianceRiskHistoryRecord,
  LegalComplianceRiskResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class LegalComplianceRiskRepositoryStore
  extends InMemoryResultHistoryRepository<LegalComplianceRiskResult, LegalComplianceRiskHistoryRecord, GraphScope>
  implements LegalComplianceRiskRepositoryContract {}

export { LegalComplianceRiskRepositoryStore as LegalComplianceRiskRepository };
