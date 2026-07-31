/**
 * TwinResolver — resolve twin entities by id, key, or graph node.
 */

import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import { listTwinEntities } from "@/lib/digital-twin/store";
import type {
  TwinEntity,
  TwinEntityType,
  TwinRelationship,
} from "@/lib/digital-twin/types";

export type TwinResolveResult = {
  readonly entity: TwinEntity;
  readonly relationships: readonly TwinRelationship[];
  readonly related: readonly TwinEntity[];
};

export type TwinResolver = {
  resolve(
    organizationId: string,
    twinId: string
  ): TwinResolveResult | null;
  resolveByKey(
    organizationId: string,
    entityType: TwinEntityType,
    externalKey: string
  ): TwinResolveResult | null;
  resolveByGraphNode(
    organizationId: string,
    graphNodeId: string
  ): TwinResolveResult | null;
  search(input: {
    organizationId: string;
    q?: string;
    entityType?: TwinEntityType | "";
    limit?: number;
  }): readonly TwinEntity[];
};

export function createTwinResolver(): TwinResolver {
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();

  function pack(entity: TwinEntity): TwinResolveResult {
    const rels = relationships.listForTwin(
      entity.organizationId,
      entity.id
    );
    const relatedIds = new Set<string>();
    for (const r of rels) {
      relatedIds.add(r.fromTwinId);
      relatedIds.add(r.toTwinId);
    }
    relatedIds.delete(entity.id);
    const related = listTwinEntities(entity.organizationId).filter((e) =>
      relatedIds.has(e.id)
    );
    return {
      entity,
      relationships: rels,
      related: Object.freeze(related),
    };
  }

  return {
    resolve(organizationId, twinId) {
      const entity = registry.get(organizationId, twinId);
      if (!entity) return null;
      return pack(entity);
    },
    resolveByKey(organizationId, entityType, externalKey) {
      const entity = registry.findByKey(
        organizationId,
        entityType,
        externalKey
      );
      if (!entity) return null;
      return pack(entity);
    },
    resolveByGraphNode(organizationId, graphNodeId) {
      const entity = listTwinEntities(organizationId).find(
        (e) => e.graphNodeId === graphNodeId
      );
      if (!entity) return null;
      return pack(entity);
    },
    search(input) {
      const q = (input.q ?? "").trim().toLowerCase();
      const limit = input.limit ?? 50;
      const rows = listTwinEntities(input.organizationId).filter((e) => {
        if (e.status !== "Active") return false;
        if (input.entityType && e.entityType !== input.entityType) return false;
        if (!q) return true;
        return (
          e.label.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.externalKey.toLowerCase().includes(q) ||
          e.entityType.toLowerCase().includes(q)
        );
      });
      return Object.freeze(rows.slice(0, limit));
    },
  };
}
