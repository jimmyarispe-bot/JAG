import type { CrmCanonicalEntity } from "@/lib/platform/integrations/connectors/crm/entities";
import { crmKgKind } from "@/lib/platform/integrations/connectors/crm/mapping/canonical";

export type CrmGraphNode = {
  nodeId: string;
  entityType: string;
  label: string;
  properties: Record<string, unknown>;
};

export type CrmGraphRelationship = {
  relationshipId: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
};

export type CrmKnowledgeGraph = {
  nodes: CrmGraphNode[];
  relationships: CrmGraphRelationship[];
};

export function buildCrmKnowledgeGraph(
  records: readonly CrmCanonicalEntity[]
): CrmKnowledgeGraph {
  const nodes: CrmGraphNode[] = [];
  const relationships: CrmGraphRelationship[] = [];
  const byExternal = new Map<string, CrmCanonicalEntity>();

  for (const record of records) {
    byExternal.set(record.externalId, record);
    const kind = crmKgKind(record.objectType) ?? "Person";
    nodes.push({
      nodeId: record.id,
      entityType: kind,
      label: String(record.attributes.name ?? record.externalId),
      properties: {
        provider: record.sourceSystem,
        objectType: record.objectType,
        canonicalType: record.canonicalType,
        kind: record.attributes.kind ?? kind,
        amount: record.attributes.amount ?? null,
        stage: record.attributes.stage ?? null,
      },
    });
  }

  for (const record of records) {
    const link = (
      attr: string,
      type: string,
      from = record.id
    ): void => {
      const targetId = record.attributes[attr];
      if (typeof targetId !== "string" || !byExternal.has(targetId)) return;
      relationships.push({
        relationshipId: `${from}->${type}->${targetId}`,
        type,
        fromNodeId: from,
        toNodeId: byExternal.get(targetId)!.id,
      });
    };

    if (record.objectType === "contact" || record.objectType === "lead") {
      link("companyId", "BELONGS_TO");
    }
    if (record.objectType === "deal" || record.objectType === "opportunity") {
      link("companyId", "BELONGS_TO");
      link("contactId", "RELATED_TO");
      link("pipelineId", "IN_PIPELINE");
      link("ownerId", "OWNED_BY");
    }
    if (record.objectType === "activity") {
      link("contactId", "RELATED_TO");
      link("dealId", "RELATED_TO");
      link("opportunityId", "RELATED_TO");
      link("companyId", "BELONGS_TO");
    }
    if (record.objectType === "lead") {
      link("convertedContactId", "CONVERTED_TO");
      link("convertedDealId", "CONVERTED_TO");
    }
  }

  return { nodes, relationships };
}
