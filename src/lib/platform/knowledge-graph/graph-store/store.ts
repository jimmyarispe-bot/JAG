/**
 * In-memory organizational graph store (RC-4).
 * Ingest is canonical-only — never raw connector API payloads.
 */

import type { UnifiedGraphNode } from "@/lib/platform/knowledge-graph/entities/types";
import type { UnifiedGraphEdge } from "@/lib/platform/knowledge-graph/relationships/types";

export type UnifiedGraphSnapshot = {
  organizationId: string;
  builtAt: string;
  nodes: UnifiedGraphNode[];
  edges: UnifiedGraphEdge[];
  domainsConnected: string[];
  kindsPresent: string[];
  relationshipTypesPresent: string[];
};

class UnifiedKnowledgeGraphStore {
  private readonly byOrg = new Map<string, UnifiedGraphSnapshot>();

  replace(snapshot: UnifiedGraphSnapshot): UnifiedGraphSnapshot {
    this.byOrg.set(snapshot.organizationId, snapshot);
    if (
      snapshot.organizationId.endsWith("-demo") ||
      snapshot.organizationId === "exec-demo-org"
    ) {
      this.byOrg.set("exec-demo-org", { ...snapshot, organizationId: "exec-demo-org" });
    }
    return snapshot;
  }

  get(organizationId: string): UnifiedGraphSnapshot | null {
    return (
      this.byOrg.get(organizationId) ??
      this.byOrg.get("exec-demo-org") ??
      null
    );
  }

  clear(organizationId?: string): void {
    if (!organizationId) {
      this.byOrg.clear();
      return;
    }
    this.byOrg.delete(organizationId);
  }
}

export const unifiedGraphStore = new UnifiedKnowledgeGraphStore();
