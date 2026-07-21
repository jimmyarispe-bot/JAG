import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";
import {
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph";
import type { CollaborationCanonicalEntity } from "@/lib/platform/integrations/connectors/collaboration/entities";
import { collaborationKgKind } from "@/lib/platform/integrations/connectors/collaboration/mapping/canonical";

export type CollaborationGraphBundle = {
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
};

export function toPlatformCanonicalEntity(
  record: CollaborationCanonicalEntity
): CanonicalEntity {
  const kg = collaborationKgKind(record.objectType) ?? "Communication";
  return {
    id: record.id,
    canonicalType: kg,
    externalId: record.externalId,
    sourceSystem: record.sourceSystem,
    connectorId: record.sourceSystem,
    instanceId: record.sourceSystem,
    data: {
      ...record.attributes,
      jagCanonicalType: record.canonicalType,
      objectType: record.objectType,
      organizationId: record.organizationId,
      provider: record.sourceSystem,
    },
    identityKey: `productivity:${kg}:${record.externalId}`.toLowerCase(),
    contentHash: record.id,
    syncedAt: record.syncedAt,
  };
}

export function buildCollaborationKnowledgeGraph(
  records: readonly CollaborationCanonicalEntity[]
): CollaborationGraphBundle {
  const entityBuilder = createGraphEntityBuilder({
    labelFor: (entity) =>
      String(
        entity.data.name ??
          entity.data.title ??
          entity.data.subject ??
          entity.data.text ??
          entity.externalId
      ),
    nodeIdFor: (entity) => `prod:${entity.canonicalType}:${entity.externalId}`,
  });
  const relBuilder = createGraphRelationshipBuilder();
  const platformEntities = records.map(toPlatformCanonicalEntity);
  const nodes = entityBuilder.buildNodes(platformEntities);
  const relationships: GraphRelationshipHint[] = [];
  const byExternal = new Map(platformEntities.map((e) => [e.externalId, e]));

  for (const entity of platformEntities) {
    const channelId = entity.data.channelId;
    if (typeof channelId === "string" && byExternal.has(channelId)) {
      relationships.push(
        relBuilder.build({
          type: "POSTED_IN",
          from: entity,
          to: byExternal.get(channelId)!,
        })
      );
    }
    const threadId = entity.data.threadId;
    if (typeof threadId === "string" && byExternal.has(threadId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(threadId)!,
        })
      );
    }
    const teamId = entity.data.teamId;
    if (typeof teamId === "string" && byExternal.has(teamId)) {
      relationships.push(
        relBuilder.build({
          type: "MEMBER_OF",
          from: entity,
          to: byExternal.get(teamId)!,
        })
      );
    }
    const meetingId = entity.data.meetingId;
    if (typeof meetingId === "string" && byExternal.has(meetingId)) {
      relationships.push(
        relBuilder.build({
          type: "ASSOCIATED_WITH",
          from: entity,
          to: byExternal.get(meetingId)!,
        })
      );
    }
  }

  return { nodes, relationships };
}
