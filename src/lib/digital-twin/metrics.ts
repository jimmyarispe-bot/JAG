/**
 * TwinMetrics — deterministic counts for Twin Explorer.
 */

import {
  knowledgeGraphSummary,
} from "@/lib/evidence-center";
import {
  listTwinEntities,
  listTwinRelationships,
} from "@/lib/digital-twin/store";
import {
  TWIN_ENTITY_TYPES,
  TWIN_RELATIONSHIP_TYPES,
  type TwinMetricsSnapshot,
} from "@/lib/digital-twin/types";

export type TwinMetricsService = {
  snapshot(organizationId: string): TwinMetricsSnapshot;
};

export function createTwinMetricsService(): TwinMetricsService {
  return {
    snapshot(organizationId) {
      const entities = listTwinEntities(organizationId);
      const relationships = listTwinRelationships(organizationId);
      const byEntityType: Record<string, number> = {};
      const byRelationshipType: Record<string, number> = {};
      for (const t of TWIN_ENTITY_TYPES) byEntityType[t] = 0;
      for (const t of TWIN_RELATIONSHIP_TYPES) byRelationshipType[t] = 0;

      let activeCount = 0;
      let archivedCount = 0;
      for (const e of entities) {
        byEntityType[e.entityType] = (byEntityType[e.entityType] ?? 0) + 1;
        if (e.status === "Active") activeCount += 1;
        else archivedCount += 1;
      }
      for (const r of relationships) {
        byRelationshipType[r.relationshipType] =
          (byRelationshipType[r.relationshipType] ?? 0) + 1;
      }

      const kg = knowledgeGraphSummary(organizationId);
      return {
        entityCount: entities.length,
        relationshipCount: relationships.length,
        activeCount,
        archivedCount,
        byEntityType: Object.freeze(byEntityType),
        byRelationshipType: Object.freeze(byRelationshipType),
        graphNodeCount: kg.nodeCount,
        graphEdgeCount: kg.edgeCount,
      };
    },
  };
}
