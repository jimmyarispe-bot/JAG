/**
 * Knowledge graph mapping — identical kinds to Google Workspace.
 * Copilot sees Meeting / Communication / Document — never Outlook vs Gmail.
 */

import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";
import {
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph";
import type { Microsoft365CanonicalEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { microsoft365KgKind } from "@/lib/platform/integrations/connectors/microsoft-365/mapping/canonical";

export type Microsoft365GraphBundle = {
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
};

export function toPlatformCanonicalEntity(
  record: Microsoft365CanonicalEntity
): CanonicalEntity {
  const kg = microsoft365KgKind(record.objectType) ?? "Document";
  return {
    id: record.id,
    canonicalType: kg,
    externalId: record.externalId,
    sourceSystem: record.sourceSystem,
    connectorId: "microsoft",
    instanceId: "microsoft",
    data: {
      ...record.attributes,
      jagCanonicalType: record.canonicalType,
      objectType: record.objectType,
      tenantDomain: record.tenantDomain,
      organizationId: record.organizationId,
      userId: record.userId,
      // Provider tag is lineage-only; KG node type is provider-neutral.
      provider: "microsoft-365",
    },
    identityKey: `productivity:${kg}:${record.externalId}`.toLowerCase(),
    contentHash: record.id,
    syncedAt: record.syncedAt,
  };
}

export function buildMicrosoft365Graph(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365GraphBundle {
  const entityBuilder = createGraphEntityBuilder({
    labelFor: (entity) =>
      String(
        entity.data.name ??
          entity.data.title ??
          entity.data.subject ??
          entity.data.email ??
          entity.externalId
      ),
    // Provider-neutral node ids so Google/Microsoft meetings can correlate by external key later.
    nodeIdFor: (entity) => `prod:${entity.canonicalType}:${entity.externalId}`,
  });
  const relBuilder = createGraphRelationshipBuilder();
  const platformEntities = records.map(toPlatformCanonicalEntity);
  const nodes = entityBuilder.buildNodes(platformEntities);
  const relationships: GraphRelationshipHint[] = [];
  const byExternal = new Map(platformEntities.map((e) => [e.externalId, e]));

  for (const entity of platformEntities) {
    const calendarEventId = entity.data.calendarEventId;
    if (typeof calendarEventId === "string" && byExternal.has(calendarEventId)) {
      relationships.push(
        relBuilder.build({
          type: "ASSOCIATED_WITH",
          from: entity,
          to: byExternal.get(calendarEventId)!,
        })
      );
    }
    const teamId = entity.data.teamId;
    if (typeof teamId === "string" && byExternal.has(teamId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(teamId)!,
        })
      );
    }
  }

  return { nodes, relationships };
}
