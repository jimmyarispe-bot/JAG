/**
 * Knowledge graph entity extension points.
 * Transforms canonical entities into graph node hints — no provider mappings yet.
 */

import type { CanonicalEntity, GraphNodeHint } from "@/lib/platform/integrations/types";

export type EntityBuilderOptions = {
  nodeIdFor?: (entity: CanonicalEntity) => string;
  labelFor?: (entity: CanonicalEntity) => string;
};

export class GraphEntityBuilder {
  constructor(private readonly options: EntityBuilderOptions = {}) {}

  buildNode(entity: CanonicalEntity): GraphNodeHint {
    const nodeId =
      this.options.nodeIdFor?.(entity) ?? `node:${entity.identityKey}`;
    const label =
      this.options.labelFor?.(entity) ??
      String(entity.data.name ?? entity.data.title ?? entity.externalId);

    return {
      nodeId,
      label,
      entityType: entity.canonicalType,
      properties: {
        ...entity.data,
        externalId: entity.externalId,
        sourceSystem: entity.sourceSystem,
        connectorId: entity.connectorId,
        contentHash: entity.contentHash,
      },
      sourceEntityId: entity.id,
    };
  }

  buildNodes(entities: readonly CanonicalEntity[]): GraphNodeHint[] {
    return entities.map((entity) => this.buildNode(entity));
  }
}

export function createGraphEntityBuilder(
  options?: EntityBuilderOptions
): GraphEntityBuilder {
  return new GraphEntityBuilder(options);
}
