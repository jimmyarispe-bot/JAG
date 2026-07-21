import type { EducationCanonicalEntity } from "@/lib/platform/integrations/connectors/education/entities";
import { educationKgKind } from "@/lib/platform/integrations/connectors/education/mapping/canonical";

export type EducationGraphNode = {
  nodeId: string;
  entityType: string;
  label: string;
  properties: Record<string, unknown>;
};

export type EducationGraphRelationship = {
  relationshipId: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
};

export type EducationKnowledgeGraph = {
  nodes: EducationGraphNode[];
  relationships: EducationGraphRelationship[];
};

export function buildEducationKnowledgeGraph(
  records: readonly EducationCanonicalEntity[]
): EducationKnowledgeGraph {
  const nodes: EducationGraphNode[] = [];
  const relationships: EducationGraphRelationship[] = [];
  const byExternal = new Map<string, EducationCanonicalEntity>();

  for (const record of records) {
    byExternal.set(record.externalId, record);
    const kind = educationKgKind(record.objectType) ?? "Document";
    nodes.push({
      nodeId: record.id,
      entityType: kind,
      label: String(record.attributes.name ?? record.externalId),
      properties: {
        provider: record.sourceSystem,
        objectType: record.objectType,
        canonicalType: record.canonicalType,
        kind: record.attributes.kind ?? kind,
      },
    });
  }

  for (const record of records) {
    const link = (attr: string, type: string): void => {
      const targetId = record.attributes[attr];
      if (typeof targetId !== "string" || !byExternal.has(targetId)) return;
      relationships.push({
        relationshipId: `${record.id}->${type}->${targetId}`,
        type,
        fromNodeId: record.id,
        toNodeId: byExternal.get(targetId)!.id,
      });
    };

    if (record.objectType === "course" || record.objectType === "class") {
      link("teacherId", "TAUGHT_BY");
    }
    if (record.objectType === "assignment") {
      link("courseId", "PART_OF");
      link("classId", "PART_OF");
      link("teacherId", "ASSIGNED_BY");
    }
    if (record.objectType === "grade") {
      link("studentId", "FOR_STUDENT");
      link("assignmentId", "FOR_ASSIGNMENT");
      link("courseId", "PART_OF");
      link("classId", "PART_OF");
    }
    if (record.objectType === "attendance") {
      link("studentId", "FOR_STUDENT");
      link("courseId", "PART_OF");
      link("classId", "PART_OF");
    }
    if (record.objectType === "schedule") {
      link("courseId", "PART_OF");
      link("classId", "PART_OF");
      link("teacherId", "TAUGHT_BY");
      link("studentId", "FOR_STUDENT");
    }
  }

  return { nodes, relationships };
}
