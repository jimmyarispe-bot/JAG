/**
 * Document Registry — default publishers for document signals.
 */

import type { DocumentRegistry as DocumentRegistryContract } from "@/lib/platform/intelligence/document/contracts";
import type { DocumentPublisher } from "@/lib/platform/intelligence/document/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: DocumentPublisher[] = [
  { domain: "organization-dna", capability: "document.dna_context" },
  { domain: "knowledge", capability: "document.knowledge_contribution" },
  { domain: "operations", capability: "document.process_evidence" },
  { domain: "customer", capability: "document.communication_records" },
  { domain: "human-capital", capability: "document.people_policy_records" },
  { domain: "revenue", capability: "document.contract_finance_records" },
  { domain: "funding", capability: "document.grant_records" },
  { domain: "board-governance", capability: "document.board_records" },
  { domain: "executive-decision", capability: "document.decision_evidence" },
];

export class DocumentRegistryStore
  extends PublisherRegistryMap
  implements DocumentRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { DocumentRegistryStore as DocumentRegistry };
