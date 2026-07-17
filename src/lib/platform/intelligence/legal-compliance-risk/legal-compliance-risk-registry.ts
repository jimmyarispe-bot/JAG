/**
 * Legal, Compliance & Risk Registry — default signal publishers.
 */

import type { LegalComplianceRiskRegistry as LegalComplianceRiskRegistryContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import type { LegalComplianceRiskPublisher } from "@/lib/platform/intelligence/legal-compliance-risk/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: LegalComplianceRiskPublisher[] = [
  { domain: "organization-dna", capability: "legal_compliance_risk.dna_context" },
  { domain: "document", capability: "legal_compliance_risk.document_evidence" },
  { domain: "knowledge", capability: "legal_compliance_risk.knowledge_contribution" },
  { domain: "board-governance", capability: "legal_compliance_risk.board_compliance" },
  { domain: "executive-decision", capability: "legal_compliance_risk.decision_evidence" },
  { domain: "human-capital", capability: "legal_compliance_risk.people_policy_records" },
  { domain: "funding", capability: "legal_compliance_risk.grant_compliance" },
  { domain: "operations", capability: "legal_compliance_risk.process_controls" },
  { domain: "customer", capability: "legal_compliance_risk.communication_records" },
  { domain: "organizational-improvement", capability: "legal_compliance_risk.corrective_actions" },
];

export class LegalComplianceRiskRegistryStore
  extends PublisherRegistryMap
  implements LegalComplianceRiskRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { LegalComplianceRiskRegistryStore as LegalComplianceRiskRegistry };
