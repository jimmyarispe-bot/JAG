/**
 * Knowledge Registry — tracks which OIOS domains feed knowledge signals (Sprint 040).
 */

import type { KnowledgeRegistry as KnowledgeRegistryContract } from "@/lib/platform/intelligence/knowledge/contracts";
import type { KnowledgePublisher } from "@/lib/platform/intelligence/knowledge/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: KnowledgePublisher[] = [
  { domain: "organization-dna", capability: "knowledge.dna_facts" },
  { domain: "oios-core", capability: "knowledge.execution_baseline" },
  { domain: "customer", capability: "knowledge.customer_insights" },
  { domain: "operations", capability: "knowledge.process_sops" },
  { domain: "human-capital", capability: "knowledge.transfer_signals" },
  { domain: "board-governance", capability: "knowledge.board_memory" },
  { domain: "executive-decision", capability: "knowledge.decision_lineage" },
];

export class KnowledgeRegistryStore
  extends PublisherRegistryMap
  implements KnowledgeRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { KnowledgeRegistryStore as KnowledgeRegistry };
