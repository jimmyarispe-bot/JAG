/**
 * RelationshipService — twin relationships mirrored onto Knowledge Graph™.
 */

import { randomUUID } from "node:crypto";
import { createKnowledgeGraphEdge } from "@/lib/evidence-center";
import { createTwinHistoryService } from "@/lib/digital-twin/history";
import { twinRelationshipToGraphType } from "@/lib/digital-twin/mapping";
import {
  findTwinRelationshipBetween,
  getTwinEntity,
  listTwinRelationships,
  upsertTwinRelationship,
} from "@/lib/digital-twin/store";
import { createTwinValidationService } from "@/lib/digital-twin/validation";
import type {
  TwinRelationship,
  TwinRelationshipType,
} from "@/lib/digital-twin/types";

export type TwinRelationshipService = {
  connect(input: {
    organizationId: string;
    fromTwinId: string;
    toTwinId: string;
    relationshipType: TwinRelationshipType;
    actor: string;
    metadata?: Record<string, string>;
  }): TwinRelationship | { error: string };
  list(
    organizationId: string,
    filter?: { twinId?: string; relationshipType?: TwinRelationshipType }
  ): readonly TwinRelationship[];
  listForTwin(
    organizationId: string,
    twinId: string
  ): readonly TwinRelationship[];
};

export function createTwinRelationshipService(): TwinRelationshipService {
  const validation = createTwinValidationService();
  const history = createTwinHistoryService();

  return {
    connect(input) {
      const check = validation.validateRelationship(input);
      if (!check.ok) return { error: check.error };

      const existing = findTwinRelationshipBetween(
        input.organizationId,
        input.fromTwinId,
        input.toTwinId,
        input.relationshipType
      );
      if (existing) return existing;

      const from = getTwinEntity(input.organizationId, input.fromTwinId)!;
      const to = getTwinEntity(input.organizationId, input.toTwinId)!;
      const graphType = twinRelationshipToGraphType(input.relationshipType);
      const edgeResult = createKnowledgeGraphEdge({
        organizationId: input.organizationId,
        fromNodeId: from.graphNodeId,
        toNodeId: to.graphNodeId,
        relationshipType: graphType,
        metadata: {
          twinRelationship: input.relationshipType,
          ...(input.metadata ?? {}),
        },
      });

      const now = new Date().toISOString();
      const relationship: TwinRelationship = {
        id: randomUUID(),
        organizationId: input.organizationId,
        fromTwinId: input.fromTwinId,
        toTwinId: input.toTwinId,
        relationshipType: input.relationshipType,
        graphEdgeId: edgeResult.ok ? edgeResult.edge.id : null,
        metadata: Object.freeze({ ...(input.metadata ?? {}) }),
        createdAt: now,
        updatedAt: now,
        createdBy: input.actor,
      };
      upsertTwinRelationship(relationship);

      const kind =
        input.relationshipType === "assigned_to" ? "assigned" : "connected";
      history.record({
        organizationId: input.organizationId,
        twinId: input.fromTwinId,
        kind,
        actor: input.actor,
        message: `${input.relationshipType} → ${to.label}`,
        metadata: {
          relationshipType: input.relationshipType,
          toTwinId: input.toTwinId,
        },
      });
      history.record({
        organizationId: input.organizationId,
        twinId: input.toTwinId,
        kind: "connected",
        actor: input.actor,
        message: `${from.label} ${input.relationshipType} this entity`,
        metadata: {
          relationshipType: input.relationshipType,
          fromTwinId: input.fromTwinId,
        },
      });

      return relationship;
    },

    list(organizationId, filter) {
      return Object.freeze(
        listTwinRelationships(organizationId).filter((r) => {
          if (
            filter?.relationshipType &&
            r.relationshipType !== filter.relationshipType
          ) {
            return false;
          }
          if (
            filter?.twinId &&
            r.fromTwinId !== filter.twinId &&
            r.toTwinId !== filter.twinId
          ) {
            return false;
          }
          return true;
        })
      );
    },

    listForTwin(organizationId, twinId) {
      return this.list(organizationId, { twinId });
    },
  };
}
