/**
 * Knowledge Registry — tracks which OIOS domains feed knowledge signals (Sprint 040).
 */

import type { KnowledgeRegistry as KnowledgeRegistryContract } from "@/lib/platform/intelligence/knowledge/contracts";
import type { KnowledgePublisher } from "@/lib/platform/intelligence/knowledge/types";

const DEFAULT_PUBLISHERS: KnowledgePublisher[] = [
  { domain: "organization-dna", capability: "knowledge.dna_facts" },
  { domain: "oios-core", capability: "knowledge.execution_baseline" },
  { domain: "customer", capability: "knowledge.customer_insights" },
  { domain: "operations", capability: "knowledge.process_sops" },
  { domain: "human-capital", capability: "knowledge.transfer_signals" },
  { domain: "board-governance", capability: "knowledge.board_memory" },
  { domain: "executive-decision", capability: "knowledge.decision_lineage" },
];

export class KnowledgeRegistryStore implements KnowledgeRegistryContract {
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): KnowledgePublisher[] {
    return [...this.publishers.entries()].map(([domain, capability]) => ({
      domain,
      capability,
    }));
  }

  isRegistered(domain: string): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { KnowledgeRegistryStore as KnowledgeRegistry };
