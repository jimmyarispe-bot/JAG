import { getEvidenceRecordById } from "@/lib/platform/evidence/query";
import { loadPersistedGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by KEE — links evidence to competencies and students. */
export const evidenceGraphProvider: GraphProvider = {
  providerKey: "evidence",

  async resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "evidence_record" || !entityId) return null;

    const record = await getEvidenceRecordById(ctx.supabase, entityId);

    return {
      nodeId: buildGraphNodeId("evidence", entityType, entityId),
      nodeType: "evidence",
      entityType,
      entityId,
      organizationId: record?.organization_id ?? ctx.organizationId ?? null,
      schoolId: record?.school_id ?? ctx.schoolId ?? null,
      metadata: {
        providerKey: "evidence",
        referenceOnly: !record,
        evidenceTypeKey: record?.evidence_type_key,
        studentId: record?.student_id,
        competencyKeys: record?.competency_keys ?? [],
        skillKeys: record?.skill_keys ?? [],
      },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    const persisted = await loadPersistedGraphEdges(ctx.supabase, {
      nodeId: node.nodeId,
      direction: options?.direction ?? "both",
      providerKey: "evidence",
      limit: 200,
    });

    if (node.nodeType !== "evidence" || node.entityType !== "evidence_record") {
      return persisted;
    }

    const record = await getEvidenceRecordById(ctx.supabase, node.entityId);
    if (!record) return persisted;

    const studentNodeId = buildGraphNodeId("entity", "student", record.student_id);
    const evidenceNodeId = node.nodeId;
    const derived: GraphEdge[] = [];

    for (const competencyKey of record.competency_keys) {
      const competencyNodeId = buildGraphNodeId("competency", "competency", competencyKey);
      derived.push(
        {
          edgeType: "student.demonstrates.competency",
          sourceNode: studentNodeId,
          targetNode: competencyNodeId,
          direction: "directed",
          weight: record.evidence_confidence,
          effectiveDate: record.captured_at,
          endDate: record.expires_at,
          metadata: {
            providerKey: "evidence",
            evidenceId: record.id,
            evidenceTypeKey: record.evidence_type_key,
          },
        },
        {
          edgeType: "competency.supported_by.evidence",
          sourceNode: competencyNodeId,
          targetNode: evidenceNodeId,
          direction: "directed",
          weight: record.evidence_quality,
          effectiveDate: record.captured_at,
          endDate: record.expires_at,
          metadata: {
            providerKey: "evidence",
            evidenceId: record.id,
          },
        }
      );
    }

    return [...persisted, ...derived];
  },
};
