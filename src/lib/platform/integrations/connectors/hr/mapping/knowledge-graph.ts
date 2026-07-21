import type { HrCanonicalEntity } from "@/lib/platform/integrations/connectors/hr/entities";
import { hrKgKind } from "@/lib/platform/integrations/connectors/hr/mapping/canonical";

export type HrGraphNode = {
  nodeId: string;
  entityType: string;
  label: string;
  properties: Record<string, unknown>;
};

export type HrGraphRelationship = {
  relationshipId: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
};

export type HrKnowledgeGraph = {
  nodes: HrGraphNode[];
  relationships: HrGraphRelationship[];
};

export function buildHrKnowledgeGraph(
  records: readonly HrCanonicalEntity[]
): HrKnowledgeGraph {
  const nodes: HrGraphNode[] = [];
  const relationships: HrGraphRelationship[] = [];
  const byExternal = new Map<string, HrCanonicalEntity>();

  for (const record of records) {
    byExternal.set(record.externalId, record);
    const kind = hrKgKind(record.objectType) ?? "Employee";
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
    if (record.objectType === "employee") {
      const deptId = record.attributes.departmentId;
      const managerId = record.attributes.managerId;
      if (typeof deptId === "string" && byExternal.has(deptId)) {
        relationships.push({
          relationshipId: `${record.id}->dept`,
          type: "BELONGS_TO",
          fromNodeId: record.id,
          toNodeId: byExternal.get(deptId)!.id,
        });
      }
      if (typeof managerId === "string" && byExternal.has(managerId)) {
        relationships.push({
          relationshipId: `${record.id}->mgr`,
          type: "REPORTS_TO",
          fromNodeId: record.id,
          toNodeId: byExternal.get(managerId)!.id,
        });
      }
    }
    if (
      (record.objectType === "payroll" ||
        record.objectType === "benefit" ||
        record.objectType === "time_off" ||
        record.objectType === "pto") &&
      typeof record.attributes.employeeId === "string"
    ) {
      const emp = byExternal.get(String(record.attributes.employeeId));
      if (emp) {
        relationships.push({
          relationshipId: `${record.id}->emp`,
          type: "FOR_EMPLOYEE",
          fromNodeId: record.id,
          toNodeId: emp.id,
        });
      }
    }
    if (
      record.objectType === "manager" &&
      typeof record.attributes.employeeId === "string"
    ) {
      const emp = byExternal.get(String(record.attributes.employeeId));
      if (emp) {
        relationships.push({
          relationshipId: `${record.id}->person`,
          type: "IS_PERSON",
          fromNodeId: record.id,
          toNodeId: emp.id,
        });
      }
    }
  }

  return { nodes, relationships };
}
