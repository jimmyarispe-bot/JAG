import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";
import {
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph";
import type { EnterpriseCanonicalEntity } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { enterpriseKgKind } from "@/lib/platform/integrations/connectors/enterprise/mapping/canonical";

export type EnterpriseGraphBundle = {
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
};

export function toPlatformCanonicalEntity(
  record: EnterpriseCanonicalEntity
): CanonicalEntity {
  const kg = enterpriseKgKind(record.objectType) ?? "Document";
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
    identityKey: `enterprise:${kg}:${record.externalId}`.toLowerCase(),
    contentHash: record.id,
    syncedAt: record.syncedAt,
  };
}

export function buildEnterpriseKnowledgeGraph(
  records: readonly EnterpriseCanonicalEntity[]
): EnterpriseGraphBundle {
  const entityBuilder = createGraphEntityBuilder({
    labelFor: (entity) =>
      String(
        entity.data.name ??
          entity.data.title ??
          entity.data.displayName ??
          entity.data.subject ??
          entity.externalId
      ),
    nodeIdFor: (entity) => `ent:${entity.canonicalType}:${entity.externalId}`,
  });
  const relBuilder = createGraphRelationshipBuilder();
  const platformEntities = records.map(toPlatformCanonicalEntity);
  const nodes = entityBuilder.buildNodes(platformEntities);
  const relationships: GraphRelationshipHint[] = [];
  const byExternal = new Map(platformEntities.map((e) => [e.externalId, e]));

  for (const entity of platformEntities) {
    const companyId = entity.data.companyId;
    if (typeof companyId === "string" && byExternal.has(companyId)) {
      relationships.push(
        relBuilder.build({
          type: "BELONGS_TO",
          from: entity,
          to: byExternal.get(companyId)!,
        })
      );
    }
    const pipelineId = entity.data.pipelineId;
    if (typeof pipelineId === "string" && byExternal.has(pipelineId)) {
      relationships.push(
        relBuilder.build({
          type: "IN_PIPELINE",
          from: entity,
          to: byExternal.get(pipelineId)!,
        })
      );
    }
    const employeeId = entity.data.employeeId;
    if (typeof employeeId === "string" && byExternal.has(employeeId)) {
      relationships.push(
        relBuilder.build({
          type: "FOR_EMPLOYEE",
          from: entity,
          to: byExternal.get(employeeId)!,
        })
      );
    }
    const studentId = entity.data.studentId;
    if (typeof studentId === "string" && byExternal.has(studentId)) {
      relationships.push(
        relBuilder.build({
          type: "FOR_STUDENT",
          from: entity,
          to: byExternal.get(studentId)!,
        })
      );
    }
    const classId = entity.data.classId;
    if (typeof classId === "string" && byExternal.has(classId)) {
      relationships.push(
        relBuilder.build({
          type: "IN_CLASS",
          from: entity,
          to: byExternal.get(classId)!,
        })
      );
    }
    const programId = entity.data.programId;
    if (typeof programId === "string" && byExternal.has(programId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(programId)!,
        })
      );
    }
    const contactId = entity.data.contactId;
    if (typeof contactId === "string" && byExternal.has(contactId)) {
      relationships.push(
        relBuilder.build({
          type: "RELATED_TO",
          from: entity,
          to: byExternal.get(contactId)!,
        })
      );
    }
  }

  return { nodes, relationships };
}
