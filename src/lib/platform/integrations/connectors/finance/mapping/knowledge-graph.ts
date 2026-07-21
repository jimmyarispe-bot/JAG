import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";
import {
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph";
import type { FinanceCanonicalEntity } from "@/lib/platform/integrations/connectors/finance/entities";
import { financeKgKind } from "@/lib/platform/integrations/connectors/finance/mapping/canonical";

export type FinanceGraphBundle = {
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
};

export function toPlatformCanonicalEntity(record: FinanceCanonicalEntity): CanonicalEntity {
  const kg = financeKgKind(record.objectType) ?? "FinancialTransaction";
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
    identityKey: `finance:${kg}:${record.externalId}`.toLowerCase(),
    contentHash: record.id,
    syncedAt: record.syncedAt,
  };
}

export function buildFinanceKnowledgeGraph(
  records: readonly FinanceCanonicalEntity[]
): FinanceGraphBundle {
  const entityBuilder = createGraphEntityBuilder({
    labelFor: (entity) =>
      String(
        entity.data.name ??
          entity.data.title ??
          entity.data.subject ??
          entity.data.displayName ??
          entity.externalId
      ),
    nodeIdFor: (entity) => `fin:${entity.canonicalType}:${entity.externalId}`,
  });
  const relBuilder = createGraphRelationshipBuilder();
  const platformEntities = records.map(toPlatformCanonicalEntity);
  const nodes = entityBuilder.buildNodes(platformEntities);
  const relationships: GraphRelationshipHint[] = [];
  const byExternal = new Map(platformEntities.map((e) => [e.externalId, e]));

  for (const entity of platformEntities) {
    const customerId = entity.data.customerId;
    if (typeof customerId === "string" && byExternal.has(customerId)) {
      relationships.push(
        relBuilder.build({
          type: "BILLED_TO",
          from: entity,
          to: byExternal.get(customerId)!,
        })
      );
    }
    const vendorId = entity.data.vendorId;
    if (typeof vendorId === "string" && byExternal.has(vendorId)) {
      relationships.push(
        relBuilder.build({
          type: "PAID_TO",
          from: entity,
          to: byExternal.get(vendorId)!,
        })
      );
    }
    const accountId = entity.data.accountId;
    if (typeof accountId === "string" && byExternal.has(accountId)) {
      relationships.push(
        relBuilder.build({
          type: "POSTED_TO",
          from: entity,
          to: byExternal.get(accountId)!,
        })
      );
    }
    const invoiceId = entity.data.invoiceId;
    if (typeof invoiceId === "string" && byExternal.has(invoiceId)) {
      relationships.push(
        relBuilder.build({
          type: "SETTLES",
          from: entity,
          to: byExternal.get(invoiceId)!,
        })
      );
    }
    const subscriptionId = entity.data.subscriptionId;
    if (typeof subscriptionId === "string" && byExternal.has(subscriptionId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(subscriptionId)!,
        })
      );
    }
  }

  return { nodes, relationships };
}
