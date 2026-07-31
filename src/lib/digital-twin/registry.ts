/**
 * TwinRegistry — create / update / archive twin entities; mirrors Knowledge Graph™.
 */

import { createHash } from "node:crypto";
import {
  knowledgeGraphNodeId,
  upsertKnowledgeGraphNode,
} from "@/lib/evidence-center";
import { createTwinHistoryService } from "@/lib/digital-twin/history";
import { twinTypeToGraphType } from "@/lib/digital-twin/mapping";
import {
  findTwinByExternalKey,
  getTwinEntity,
  listTwinEntities,
  upsertTwinEntity,
} from "@/lib/digital-twin/store";
import { createTwinValidationService } from "@/lib/digital-twin/validation";
import type {
  TwinEntity,
  TwinEntityType,
  TwinLifecycleStatus,
} from "@/lib/digital-twin/types";

function twinId(
  organizationId: string,
  entityType: TwinEntityType,
  externalKey: string
): string {
  return createHash("sha256")
    .update(`twin:${organizationId}:${entityType}:${externalKey}`)
    .digest("hex")
    .slice(0, 24);
}

export type TwinRegistry = {
  register(input: {
    organizationId: string;
    entityType: TwinEntityType;
    label: string;
    description?: string;
    externalKey: string;
    metadata?: Record<string, string>;
    createdBy: string;
  }): TwinEntity | { error: string };
  update(input: {
    organizationId: string;
    twinId: string;
    actor: string;
    label?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): TwinEntity | null;
  archive(input: {
    organizationId: string;
    twinId: string;
    actor: string;
  }): TwinEntity | null;
  get(organizationId: string, twinId: string): TwinEntity | null;
  list(
    organizationId: string,
    filter?: { entityType?: TwinEntityType; status?: TwinLifecycleStatus }
  ): readonly TwinEntity[];
  findByKey(
    organizationId: string,
    entityType: TwinEntityType,
    externalKey: string
  ): TwinEntity | null;
};

export function createTwinRegistry(): TwinRegistry {
  const validation = createTwinValidationService();
  const history = createTwinHistoryService();

  return {
    register(input) {
      const check = validation.validateCreateEntity(input);
      if (!check.ok) return { error: check.error };

      const existing = findTwinByExternalKey(
        input.organizationId,
        input.entityType,
        input.externalKey
      );
      if (existing) {
        return this.update({
          organizationId: input.organizationId,
          twinId: existing.id,
          actor: input.createdBy,
          label: input.label,
          description: input.description,
          metadata: input.metadata,
        })!;
      }

      const graphType = twinTypeToGraphType(input.entityType);
      const graphNode = upsertKnowledgeGraphNode({
        organizationId: input.organizationId,
        nodeType: graphType,
        label: input.label,
        externalKey: input.externalKey,
        externalId: input.externalKey,
        metadata: {
          twinEntityType: input.entityType,
          ...(input.metadata ?? {}),
        },
      });

      const now = new Date().toISOString();
      const entity: TwinEntity = {
        id: twinId(
          input.organizationId,
          input.entityType,
          input.externalKey
        ),
        organizationId: input.organizationId,
        entityType: input.entityType,
        label: input.label.trim(),
        description: (input.description ?? "").trim(),
        status: "Active",
        externalKey: input.externalKey.trim(),
        graphNodeId:
          graphNode.id ||
          knowledgeGraphNodeId(
            input.organizationId,
            graphType,
            input.externalKey
          ),
        metadata: Object.freeze({ ...(input.metadata ?? {}) }),
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        createdBy: input.createdBy,
      };
      upsertTwinEntity(entity);
      history.record({
        organizationId: input.organizationId,
        twinId: entity.id,
        kind: "created",
        actor: input.createdBy,
        message: `Twin entity created: ${entity.entityType} “${entity.label}”.`,
        metadata: { entityType: entity.entityType },
      });
      return entity;
    },

    update(input) {
      const current = getTwinEntity(input.organizationId, input.twinId);
      if (!current || current.status === "Archived") return null;
      const now = new Date().toISOString();
      const updated: TwinEntity = {
        ...current,
        label: input.label?.trim() ?? current.label,
        description:
          input.description !== undefined
            ? input.description.trim()
            : current.description,
        metadata: Object.freeze({
          ...current.metadata,
          ...(input.metadata ?? {}),
        }),
        updatedAt: now,
      };
      upsertTwinEntity(updated);
      upsertKnowledgeGraphNode({
        organizationId: input.organizationId,
        nodeType: twinTypeToGraphType(updated.entityType),
        label: updated.label,
        externalKey: updated.externalKey,
        externalId: updated.externalKey,
        existingId: updated.graphNodeId,
        metadata: {
          twinEntityType: updated.entityType,
          ...updated.metadata,
        },
      });
      history.record({
        organizationId: input.organizationId,
        twinId: updated.id,
        kind: "updated",
        actor: input.actor,
        message: `Twin entity updated: “${updated.label}”.`,
      });
      return updated;
    },

    archive(input) {
      const current = getTwinEntity(input.organizationId, input.twinId);
      if (!current) return null;
      if (current.status === "Archived") return current;
      const now = new Date().toISOString();
      const updated: TwinEntity = {
        ...current,
        status: "Archived",
        updatedAt: now,
        archivedAt: now,
      };
      upsertTwinEntity(updated);
      history.record({
        organizationId: input.organizationId,
        twinId: updated.id,
        kind: "archived",
        actor: input.actor,
        message: `Twin entity archived: “${updated.label}”.`,
      });
      return updated;
    },

    get: getTwinEntity,

    list(organizationId, filter) {
      return Object.freeze(
        listTwinEntities(organizationId).filter((e) => {
          if (filter?.entityType && e.entityType !== filter.entityType) {
            return false;
          }
          if (filter?.status && e.status !== filter.status) return false;
          return true;
        })
      );
    },

    findByKey: findTwinByExternalKey,
  };
}
