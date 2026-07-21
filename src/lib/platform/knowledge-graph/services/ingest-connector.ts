/**
 * Connector write path — ingest a domain KG after sync (canonical nodes/edges only).
 */

import type { DomainGraphBundle } from "@/lib/platform/knowledge-graph/graph-store/ingest";
import { rebuildUnifiedKnowledgeGraph } from "@/lib/platform/knowledge-graph/services/rebuild";
import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";

/**
 * After a connector sync, rebuild the org graph from all canonical stores.
 * Domain bundle argument is accepted for future incremental ingest; today we
 * rebuild so multi-domain merges stay consistent.
 */
export function ingestConnectorGraph(
  organizationId: string,
  _bundle?: DomainGraphBundle
): UnifiedGraphSnapshot | null {
  return rebuildUnifiedKnowledgeGraph(organizationId);
}
